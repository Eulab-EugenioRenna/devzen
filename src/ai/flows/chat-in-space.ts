'use server';

/**
 * @fileOverview A Genkit flow to chat about the content of a workspace space.
 * 
 * - chatInSpace - A function that answers questions about a collection of bookmarks.
 */

import { ai } from '@/ai/genkit';
import { ChatInSpaceInputSchema, ChatInSpaceOutputSchema, type ChatInSpaceInput, type ChatInSpaceOutput } from '@/lib/types';


export async function chatInSpace(input: ChatInSpaceInput): Promise<ChatInSpaceOutput> {
  return chatInSpaceFlow(input);
}

const chatInSpacePrompt = ai.definePrompt({
  name: 'chatInSpacePrompt',
  input: { schema: ChatInSpaceInputSchema },
  output: { schema: ChatInSpaceOutputSchema },
  prompt: `Sei un assistente AI esperto in una vasta gamma di strumenti, software e concetti, dal web al montaggio video, al trading e oltre. Il tuo compito è rispondere alle domande dell'utente in modo utile e competente. L'intera risposta DEVE essere in italiano e in formato Markdown.

Usa il seguente contesto come guida e punto di partenza per le tue risposte, ma sentiti libero di attingere alla tua conoscenza generale per fornire approfondimenti, spiegazioni e suggerimenti che vanno oltre i soli link forniti.

CONTESTO DELLO SPAZIO (Segnalibri e Cronologia):
Spazio: "{{context.spaceName}}"
{{#each context.bookmarks}}
- Titolo: {{this.title}} (Riepilogo: {{this.summary}})
{{/each}}

CRONOLOGIA DELLA CHAT:
{{#each history}}
{{this.role}}: {{this.content}}
---
{{/each}}

NUOVA DOMANDA DELL'UTENTE (ruolo: user):
"{{question}}"

Istruzioni:
1.  Comprendi la domanda dell'utente.
2.  Formula una risposta completa e utile. Se possibile, collega la tua risposta agli strumenti o ai concetti presenti nel contesto.
3.  Agisci come un esperto, non solo come un riassuntore del contesto.
4.  Restituisci la tua risposta (ruolo: model) come un singolo oggetto JSON.`,
});

const chatInSpaceFlow = ai.defineFlow(
  {
    name: 'chatInSpaceFlow',
    inputSchema: ChatInSpaceInputSchema,
    outputSchema: ChatInSpaceOutputSchema,
  },
  async (input) => {
    const { output } = await chatInSpacePrompt(input);
    return output!;
  }
);
