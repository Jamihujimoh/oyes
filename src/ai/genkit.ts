
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { keyManager } from './key-manager';

// Initialize Genkit with the primary key from the matrix
const initialKey = keyManager.getCurrentKey();
if (initialKey) {
  process.env.GOOGLE_GENAI_API_KEY = initialKey;
  process.env.GEMINI_API_KEY = initialKey;
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-3.1-flash-lite',
});
