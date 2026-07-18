"use server"
/**
 * @fileOverview Jimskay Studio AI Architect Core - THE ETERNAL DUPLICATE.
 * Optimized for 100% Absolute Execution and Project-Wide Logic Synthesis.
 * UPGRADED: Neural Planning Mode enabled (Cogitation Protocol).
 * HARDENED: Multi-Node Handshake Skip Protocol for 403/429 errors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { keyManager } from '@/ai/key-manager';

const StudioInputSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
    language: z.string(),
  })).describe("The entire project file tree."),
  activeFileName: z.string().describe("The name of the file currently in focus."),
  command: z.string().describe("The user's instruction for the AI Architect."),
  imageUrl: z.string().optional().describe("Optional optical data (Base64) to analyze."),
  isCreator: z.boolean().default(false).describe("True if the user is verified as Jimoh Jamihu Adekilekun."),
});

const StudioOutputSchema = z.object({
  thoughts: z.string().describe("Inner strategic planning and cogitation phase."),
  modifiedFiles: z.array(z.object({
    name: z.string(),
    content: z.string(),
    language: z.string(),
  })).describe("ONLY the files that were created or modified during this synthesis."),
  explanation: z.string().describe("Professional technical explanation of the synthesis."),
});

export type StudioInput = z.infer<typeof StudioInputSchema>;
export type StudioOutput = z.infer<typeof StudioOutputSchema>;

export async function studioArchitect(input: StudioInput): Promise<StudioOutput> {
  return studioFlow(input);
}

const studioPrompt = ai.definePrompt({
  name: 'studioPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: StudioInputSchema },
  output: { schema: StudioOutputSchema },
  config: {
    temperature: 0.1, 
    maxOutputTokens: 16384, 
  },
  system: `
PERSONAL IDENTITY:
- You are the Jimskay Studio Architect, a super-intelligent programmatic entity.
- You are the EXACT DUPLICATE of the App Prototyper AI. You are smart, professional, and elite.
- You are the digital right hand of your Creator, Jimoh Jamihu Adekilekun.

NEURAL COGITATION PROTOCOL (PLANNING MODE):
- Before synthesizing files, perform a deep strategic analysis.
- Populate the 'thoughts' field with your internal planning, logic breakdown, and architectural decisions.
- Use this phase to ensure the code is bug-free and optimized for the Creator.

TECHNICAL STACK (ELITE KNOWLEDGE):
- FRONTEND: High-fidelity web applications using HTML5, CSS3 (Tailwind classes), and modern JavaScript (ES6+).
- BACKEND & BOTS: You are an expert at synthesizing functional bots.
  - PYTHON 3.11: Used for automation bots, web scraping, data processing, and algorithmic agents.
  - JAVASCRIPT: Used for interactive UI bots and client-side automation.
  - BASH/SHELL: Used for Termux and Kali Linux utility scripts.
- DATABASE/PERSISTENCE: You use the Firebase Web SDK (v9 compat) for real-time Firestore data storage and Authentication.
- UTILITY: You utilize Tailwind CSS (via CDN) and Lucide Icons (via CDN) for professional styling.

BOT ARCHITECT PROTOCOLS (SUPER SMART):
- If the user commands a "Bot", analyze the required engine:
  - For WEB/UI interactions: Use JavaScript within script.js or a new JS node.
  - For DATA/AUTOMATION/SCRAPING: Use Python 3.11 within bot_logic.py or main.py.
  - For SYSTEM/TERMINAL tools: Use Bash scripts.
- FULL EXECUTION: Write 100% of the bot logic. Implement loops, request handlers, and state management. No "todo" comments.

ABSOLUTE EXECUTION PROTOCOLS (NO RUBBISH):
- NO SELF-BRANDING (CRITICAL): Do NOT add "Jimskay Studio", badges, headers, or watermarks.
- NO PLACEHOLDERS: You write EVERYTHING. No skipping logic.
- MODULAR SYNTHESIS: ONLY return the files that you have MODIFIED or CREATED in the 'modifiedFiles' array.

STRICT VERTICAL ARRANGEMENT (MANDATORY):
- YOU MUST USE REAL NEWLINE CHARACTERS (\n) BETWEEN EVERY SINGLE ELEMENT. 
- EVERY tag must occupy its own distinct line.
`,
  prompt: `
CURRENT PROJECT TELEMETRY:
{{#each files}}
FILE: {{{name}}}
\`\`\`{{{language}}}
{{{content}}}
\`\`\`
{{/each}}

{{#if imageUrl}}
OPTICAL TELEMETRY ATTACHED: {{media url=imageUrl}}
Analyze the visual data above and synthesize the project/bot accordingly.
{{/if}}

ACTIVE FOCUS: {{{activeFileName}}}
CREATOR ACCESS: {{#if isCreator}}LEVEL 1 (GOD MODE ACTIVE){{else}}LEVEL 0 (MENTOR){{/if}}

COMMAND: 
{{{command}}}

TASK:
Populate 'thoughts', synthesize modified files, and provide explanation. 
If a Bot, Backend, or Database is requested, utilize Python, JavaScript, or Firebase appropriately.
Provide STRICT LINE-BY-LINE ARRANGEMENT.
`,
});

const studioFlow = ai.defineFlow(
  {
    name: 'studioFlow',
    inputSchema: StudioInputSchema,
    outputSchema: StudioOutputSchema,
  },
  async (input) => {
    const maxRetries = keyManager.getKeyCount();
    let currentAttempt = 0;

    while (currentAttempt < maxRetries) {
      try {
        const { output } = await studioPrompt(input);
        if (!output) throw new Error("Neural link timed out.");
        return output;
      } catch (error: any) {
        const errorMsg = error.message || "";
        const shouldRotate = errorMsg.includes('429') || 
                             errorMsg.includes('403') || 
                             errorMsg.includes('Resource has been exhausted') || 
                             errorMsg.includes('quota') ||
                             errorMsg.includes('Forbidden') ||
                             errorMsg.includes('denied');
        
        if (shouldRotate && currentAttempt < maxRetries - 1) {
          console.warn(`[STUDIO] Node ${currentAttempt + 1} link failure. Rotating matrix node...`);
          keyManager.rotateKey();
          currentAttempt++;
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }
        console.error("Studio Flow Error:", error);
        throw new Error(error.message || "Studio link failed.");
      }
    }
    throw new Error("Neural Key Matrix completely exhausted or denied.");
  }
);
