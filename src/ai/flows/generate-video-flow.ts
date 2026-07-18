'use server';
/**
 * @fileOverview Neural Motion Synthesis flow using Veo 2.0.
 * Optimized for cinematic motion and parade choreography visualization.
 * Handles long-running operations with a robust polling protocol.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe("A detailed description of the motion to be synthesized."),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
});

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe("The data URI of the generated MP4 video."),
});

export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    try {
      let { operation } = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: input.prompt,
        config: {
          durationSeconds: 5,
          aspectRatio: input.aspectRatio,
        },
      });

      if (!operation) {
        throw new Error('Neural Motion Link Failure: Protocol returned no operation.');
      }

      // Polling protocol: Wait for synthesis to complete
      while (!operation.done) {
        operation = await ai.checkOperation(operation);
        if (operation.done) break;
        // Wait 5 seconds before next status check
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      if (operation.error) {
        throw new Error(`Synthesis Error: ${operation.error.message}`);
      }

      const videoPart = operation.output?.message?.content.find((p) => !!p.media);
      if (!videoPart || !videoPart.media) {
        throw new Error('Synthesis failure: No visual motion data found.');
      }

      // Download and encode to Base64 for client transfer
      const videoResponse = await fetch(`${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error('Link failure during motion data retrieval.');
      }

      const buffer = await videoResponse.arrayBuffer();
      const base64Video = Buffer.from(buffer).toString('base64');

      return {
        videoUrl: `data:video/mp4;base64,${base64Video}`,
      };
    } catch (error: any) {
      console.error("Motion Synthesis Error:", error);
      throw new Error(error.message || "Neural motion link unstable.");
    }
  }
);
