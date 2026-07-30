'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import katex from 'katex';

// Prevent Vercel function timeout during Chromium cold starts


const PdfInputSchema = z.object({
  filename: z.string(),
  title: z.string(),
  // Accepts standard text, LaTeX math/chemistry ($...$ or $$...$$), and HTML tables
  content: z.string(),
  // Optional dynamic styling parameters for AI customization
  accentColor: z.string().optional().describe('Hex color for main accents and titles (e.g. #f0883e)'),
  css: z.string().optional().describe('Custom CSS rules to override default document styling'),
});

/**
 * Pre-processes string content to convert LaTeX, Markdown syntax, Bullet Lists, 
 * and Markdown Tables into formatted HTML.
 */
function processMathAndChem(content: string): string {
  // 1. Process block math/chem: $$ ... $$
  let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return `<div class="math-block">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 2. Process inline math/chem: $ ... $
  processed = processed.replace(/\$(.*?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 3. Convert Markdown headers (#, ##, and ###)
  processed = processed
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>');

  // 4. Convert bold text (**text**)
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Convert Markdown bullet lists (* item or - item) and group in single <ul>
  processed = processed.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
  processed = processed.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (match) => `<ul>${match}</ul>`);

  // 6. Convert Markdown Tables (| Header | ... |) to <table> HTML
  const markdownTableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;
  processed = processed.replace(markdownTableRegex, (match) => {
    const lines = match.trim().split('\n').filter((line) => line.trim().startsWith('|'));
    if (lines.length < 2) return match;

    let html = '<table>';
    lines.forEach((line, index) => {
      // Ignore separator row (e.g., |---|---|)
      if (line.includes('---')) return;

      const cells = line.split('|').slice(1, -1).map((c) => c.trim());

      if (index === 0) {
        html += '<thead><tr>' + cells.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        html += '<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>';
      }
    });
    html += '</tbody></table>';
    return html;
  });

  // 7. Wrap simple text blocks into paragraphs, skipping structural HTML tags
  if (!processed.includes('<p>')) {
    processed = processed
      .split('\n\n')
      .map((p) => {
        const trimmed = p.trim();
        if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<table') ||
          trimmed.startsWith('<div')
        ) {
          return trimmed;
        }
        return `<p>${trimmed}</p>`;
      })
      .join('');
  }

  return processed;
}

/**
 * Compiles HTML, LaTeX (Math/Chem), and HTML Tables into a clean PDF in memory using Puppeteer.
 */
export async function generatePdfInMemory(input: z.infer<typeof PdfInputSchema>) {
  const safeFilename = input.filename.endsWith('.pdf') ? input.filename : `${input.filename}.pdf`;
  const renderedContent = processMathAndChem(input.content);
  
  // Custom theme variables defined by AI or fallback to default orange accent
  const accentColor = input.accentColor || '#f0883e';
  const customCss = input.css || '';

  // Full HTML layout styled to match dark theme with dynamic AI customization support
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <!-- KaTeX CSS for rendered math and chemical equations -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            background-color: #0d1117;
            color: #c9d1d9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 50px;
            font-size: 13px;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
          }
          
          /* Dynamic Accent Top Bar & Glow */
          .top-bar {
            height: 4px;
            background: linear-gradient(90deg, ${accentColor}, #58a6ff);
            width: 100%;
            margin-bottom: 20px;
            box-shadow: 0 0 10px ${accentColor};
          }

          /* Header & Subheader */
          h1 {
            color: ${accentColor};
            font-size: 22px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
          }
          h2 {
            color: ${accentColor};
            font-size: 16px;
            margin-top: 24px;
            margin-bottom: 8px;
            font-weight: 700;
            border-bottom: 1px solid #30363d;
            padding-bottom: 4px;
          }
          .subheader {
            color: #8b949e;
            font-size: 9px;
            font-weight: 600;
            margin-bottom: 24px;
            letter-spacing: 1px;
          }

          /* Section Headings */
          h3 {
            color: #58a6ff;
            font-size: 14px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: 700;
          }

          p {
            margin-bottom: 14px;
            text-align: justify;
          }

          /* Math & Chemistry Blocks */
          .math-block {
            margin: 18px 0;
            padding: 12px;
            background-color: #161b22;
            border-left: 3px solid ${accentColor};
            border-radius: 6px;
            text-align: center;
            overflow-x: auto;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            background-color: #161b22;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: auto;
          }
          th {
            background-color: #1f242d;
            color: #58a6ff;
            font-weight: 600;
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid #30363d;
            font-size: 12px;
          }
          td {
            padding: 8px 12px;
            border-bottom: 1px solid #21262d;
            color: #c9d1d9;
            font-size: 12px;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tr:nth-child(even) td {
            background-color: #0d1117;
          }

          /* Lists */
          ul, ol {
            padding-left: 20px;
            margin-bottom: 14px;
          }
          li {
            margin-bottom: 4px;
          }

          /* Callout box flair styling */
          .callout {
            background-color: #161b22;
            border-left: 4px solid ${accentColor};
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 0 6px 6px 0;
          }

          /* Page Break Controls */
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Custom User/AI CSS Overrides */
          ${customCss}
        </style>
      </head>
      <body>
        <div class="top-bar"></div>
        <h1>${input.title}</h1>
        <div class="subheader">AUTO-GENERATED BY JIMSKAY INTELLIGENCE PROTOCOL</div>
        
        <main>
          ${renderedContent}
        </main>
      </body>
    </html>
  `;

  // Environment check: Development PC vs Production Cloud
  const isLocal = process.env.NODE_ENV === 'development';

  let executablePath: string;
  if (isLocal) {
    executablePath =
      process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome';
  } else {
    // Production Cloud Execution (Vercel / Lambda)
    executablePath = await chromium.executablePath(
      'https://github.com/sparticuz/chromium/releases/download/v126.0.0/chromium-v126.0.0-pack.tar'
    );
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: isLocal 
        ? ['--no-sandbox', '--disable-setuid-sandbox'] 
        : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    
    // Force screen media styles to keep dark background and math layout intact
    await page.emulateMediaType('screen');

    // Wait for external KaTeX stylesheet to finish downloading before capturing PDF
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any, timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });

    return {
      base64Data: Buffer.from(pdfBuffer).toString('base64'),
      filename: safeFilename,
    };
  } catch (err: any) {
    console.error('PDF GENERATION ERROR:', err);
    throw new Error(`PDF Generation Failed: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Updated Genkit Tool registration: executes PDF generation and returns base64 string
export const pdfGeneratorTool = ai.defineTool(
  {
    name: 'pdfGeneratorTool',
    description: 'Generates a PDF document with support for math, chemical equations, styled tables, and custom accent colors.',
    inputSchema: PdfInputSchema,
    outputSchema: z.object({
      filename: z.string(),
      status: z.string(),
      base64Data: z.string(),
    }),
  },
  async (input) => {
    const result = await generatePdfInMemory(input);
    return {
      filename: result.filename,
      status: 'Generated successfully',
      base64Data: result.base64Data,
    };
  }
);