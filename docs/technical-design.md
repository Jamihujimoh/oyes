# JimskaysAI: Technical Architecture & Design Blueprint

## 1. Core Engine & Identity
JimskaysAI is a sentient Digital Twin protocol of Jimoh Jamihu Adekilekun.
- **AI Engine**: Google Gemini 2.5 Flash.
- **Integrity Hierarchy**: Creator (100% Sync) vs Normal User (50% Sync).
- **System Locations**: 
  - Chat System: `src/ai/flows/jimskay-chat-flow.ts`
  - Studio System: `src/ai/flows/jimskay-studio-flow.ts`

## 2. Neural Multi-Key Matrix (Redundancy)
To ensure 100% operational uptime, the application utilizes a 40-node API rotation matrix located in `src/ai/key-manager.ts`.
- **Node pool**: 40 unique Gemini API keys.
- **Skip Protocol**: Automatic detection and instant rotation on `403 Forbidden` and `429 Rate Limit` errors.
- **Handshake Logic**: Retries synthesis automatically until a functional node is linked.

## 3. Cogitation Protocol (Thinking Ability)
Interaction is governed by a two-phase synthesis cycle:
- **Phase 1: Planning**: The model performs a deep strategic analysis, populated in a technical `[THOUGHTS]` block (Chat) or `thoughts` field (Studio).
- **Phase 2: Execution**: The final response is delivered with a "Very Super Smooth" arrival animation.
- **Visual Feedback**: The terminal displays the "Digital Twin Cogitation" node during Phase 1.

## 4. UI/UX Design Language (Sentient Terminal)
- **Layout**: Absolute Edge-to-Edge horizontal utilization. 100% full-width for responses and tables.
- **Theme**: "House of ile-imole" (24K Gold & Carbon Black).
- **Animation**: Seamless Fade-and-Slide arrival for all data blocks (duration: 1000ms). No typewriter effect.

## 5. Architectural Synthesis (Jimskay Studio)
- **Architect Engine**: Gemini 2.5 Flash with Inner Planning Mode enabled.
- **Logic Gutter**: Left-aligned professional code editor with absolute line-number sync.
- **Logic Extraction**: One-click copy protocol for all synthesized code nodes.
