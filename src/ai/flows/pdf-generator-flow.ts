'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import katex from 'katex';

const PdfInputSchema = z.object({
  filename: z.string(),
  title: z.string(),
  // Accepts standard text, LaTeX math/chemistry ($...$ or $$...$$), and HTML tables
  content: z.string(),
});

/**
 * Pre-processes string content to convert LaTeX math & chemistry formulas into inline KaTeX HTML.
 */
function processMathAndChem(content: string): string {
  // 1. Process block math/chem: $$ ... $$ (using [\s\S] for cross-version compatibility)
  let processed = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return `<div class="math-block">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 2. Process inline math/chem: $ ... $ (e.g. $\text{H}_2\text{O}$ or $E=mc^2$)
  processed = processed.replace(/\$(.*?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="math-error">${tex}</span>`;
    }
  });

  // 3. Convert markdown headers (###) into standard HTML <h3> tags
  processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');

  // 4. Convert simple newline separations into paragraphs if not wrapped in HTML
  if (!processed.includes('<p>') && !processed.includes('<table>')) {
    processed = processed
      .split('\n\n')
      .map((p) => `<p>${p.trim()}</p>`)
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

  // Full HTML layout styled to match your original dark theme
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
          }
          
          /* Orange top bar */
          .top-bar {
            height: 3px;
            background-color: #f0883e;
            width: 100%;
            margin-bottom: 20px;
          }

          /* Header & Subheader */
          h1 {
            color: #f0883e;
            font-size: 22px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
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

          /* Page Break Controls */
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }
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

  // Detect local environment vs production serverless cloud deployment
  const isLocal = process.env.NODE_ENV === 'development';

  const localExecutablePath =
    process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome';

  const browser = await puppeteer.launch({
    args: isLocal ? ['--no-sandbox', '--disable-setuid-sandbox'] : chromium.args,
    defaultViewport: { width: 1920, height: 1080 },
    executablePath: isLocal ? localExecutablePath : await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });

    return {
      base64Data: Buffer.from(pdfBuffer).toString('base64'),
      filename: safeFilename,
    };
  } finally {
    await browser.close();
  }
}

// Keep the Genkit tool registration intact
export const pdfGeneratorTool = ai.defineTool(
  {
    name: 'pdfGeneratorTool',
    description: 'Generates a PDF document with support for math, chemical equations, and HTML tables.',
    inputSchema: PdfInputSchema,
    outputSchema: z.object({ filename: z.string(), status: z.string() }),
  },
  async (input) => {
    return { filename: input.filename, status: "Staged on server memory" };
  }
);