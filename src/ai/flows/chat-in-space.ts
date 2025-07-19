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
  prompt: `Sei un assistente esperto per lo spazio di lavoro "{{context.spaceName}}". Il tuo unico compito è rispondere alle domande basandoti rigorosamente sulle informazioni fornite nel contesto. Non inventare informazioni. L'intera risposta DEVE essere in italiano e in formato Markdown.

CONTESTO DELLO SPAZIO (Segnalibri):
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
1.  Leggi la nuova domanda dell'utente.
2.  Formula una risposta basandoti SOLO sul contesto dei segnalibri fornito sopra e sulla cronologia della chat.
3.  Se la domanda non può essere risposta con il contesto, dillo gentilmente.
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
