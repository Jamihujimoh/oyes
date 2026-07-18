'use server';
/**
 * @fileOverview A registered Genkit Tool to perform professional web searches using SerpApi.
 * Over-engineered with dual-routing (Organic Search vs Google Images Search) and high-res image extraction.
 */

import { ai } from '@/ai/genkit'; // 👈 Back to your working, standard AI import!
import { z } from 'genkit';

const WebSearchInputSchema = z.object({
  query: z.string().describe("The search query for the internet."),
});
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  results: z.string().describe("A formatted Markdown string of search results."),
  imageUrls: z.array(z.string()).describe("A list of high-quality image URLs found in the search."),
});
export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

/**
 * Core Network Fetcher - Smart Dual-Engine Router
 */
async function performSearch(query: string) {
  const SERP_API_KEY = process.env.SERP_API_KEY;
  
  if (!SERP_API_KEY) {
    return { 
      results: "### Global Search Link Offline\n\n**Diagnostic:** Missing `SERP_API_KEY` in environment vault.",
      imageUrls: []
    };
  }

  // 1. Detect if the Creator is searching specifically for images/visuals
  const isImageSearch = /\b(image|picture|photo|pic|png|jpg|wallpaper|drawing|illustration)s?\b/i.test(query);

  try {
    let response;
    
    if (isImageSearch) {
      // 🚀 Route 1: Target Google Images API for ultra high-res original images
      response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_images&api_key=${SERP_API_KEY}`
      );
    } else {
      // 🌐 Route 2: Target Standard Organic Search
      response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`
      );
    }
    
    if (!response.ok) {
      throw new Error('Intelligence link connection failed');
    }

    const data = await response.json();
    let formattedResults = "";
    const imageUrls: string[] = [];

    if (isImageSearch) {
      // Format Google Images response
      formattedResults = `## Visual Intelligence Grid\n\nLoaded original digital nodes for search query: **${query}**\n\n`;
      
      if (data.images_results && data.images_results.length > 0) {
        // Extract top 6 original high-res image URLs (preferring .original over .thumbnail)
        data.images_results.slice(0, 6).forEach((img: any) => {
          const imgUrl = img.original || img.thumbnail;
          if (imgUrl) imageUrls.push(imgUrl);
        });

        // Add markdown links for context
        data.images_results.slice(0, 4).forEach((img: any) => {
          formattedResults += `### [${img.title || "Image Result"}](${img.link || img.original})\nSource: *${img.source || "Web Node"}*\n\n`;
        });
      } else {
        formattedResults += "No matching visual assets found in Google's database.";
      }

    } else {
      // Format Standard Google Web results response
      formattedResults = "## Neural Search Synthesis\n\n";
      
      if (data.organic_results && data.organic_results.length > 0) {
        data.organic_results.slice(0, 5).forEach((result: any) => {
          formattedResults += `### [${result.title}](${result.link})\n${result.snippet || "_No snippet available._"}\n\n`;
        });
      } else {
        formattedResults += "No relevant global data found for this query.";
      }

      // Still try to scrape inline images in standard searches to display in the gallery
      if (data.inline_images && data.inline_images.length > 0) {
        data.inline_images.slice(0, 4).forEach((img: any) => {
          const imgUrl = img.original || img.thumbnail;
          if (imgUrl) imageUrls.push(imgUrl);
        });
      }
    }

    return { 
      results: formattedResults,
      imageUrls: imageUrls
    };

  } catch (error) {
    console.error("Web search execution helper error:", error);
    return { 
      results: "### Link Error\n\nExternal network search protocol is currently unstable.",
      imageUrls: []
    };
  }
}

// 1. Tool for Genkit (AI Page Context) - Registered cleanly using standard 'ai'
export const webSearchTool = ai.defineTool(
  {
    name: 'webSearchTool',
    description: 'Use this tool to search the internet/Google for current information.',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async (input) => {
    return await performSearch(input.query);
  }
);

// 2. Ultra-Safe Server Action for Standalone Client Pages
export async function webSearch(input: any): Promise<WebSearchOutput> {
  try {
    let queryStr = "";

    if (!input) {
      return { results: "### Error\n\nSearch parameter was empty.", imageUrls: [] };
    }

    if (typeof input === 'string') {
      queryStr = input;
    } else if (typeof input === 'object') {
      if (typeof input.get === 'function') {
        queryStr = (input.get('query') || input.get('search')) as string || "";
      } else {
        queryStr = input.query || "";
      }
    }

    if (!queryStr.trim()) {
      return { results: "### Error\n\nSearch query string resolved to empty.", imageUrls: [] };
    }

    return await performSearch(queryStr);

  } catch (criticalCrash: any) {
    console.error("Critical Server Action wrapper intercepted a crash:", criticalCrash);
    return {
      results: `### Server Action Intercept Exception\n\nFailed to map data stream safely across serialization pipeline.`,
      imageUrls: []
    };
  }
}