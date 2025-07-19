'use server';

/**
 * @fileOverview A Genkit flow to perform a smart search over bookmarks.
 * 
 * - smartSearch - Searches bookmarks based on a natural language query.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BookmarkSearchSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
});

export const SmartSearchInputSchema = z.object({
  query: z.string().describe('La query di ricerca in linguaggio naturale dell\'utente.'),
  bookmarks: z.array(BookmarkSearchSchema).describe('L\'elenco dei segnalibri in cui cercare.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

export const SmartSearchOutputSchema = z.object({
  relevantBookmarkIds: z.array(z.string()).describe('Un array di ID dei segnalibri che corrispondono alla query.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const smartSearchPrompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: { schema: SmartSearchInputSchema },
  output: { schema: SmartSearchOutputSchema },
  prompt: `Sei un assistente di ricerca intelligente. Il tuo compito è analizzare una query di ricerca in linguaggio naturale e trovare i segnalibri più pertinenti da un elenco fornito. Tutta l'analisi DEVE essere in italiano.

Query dell'utente: "{{query}}"

Elenco dei segnalibri disponibili:
{{#each bookmarks}}
- ID: {{this.id}}
  Titolo: {{this.title}}
  URL: {{this.url}}
  Riepilogo: {{this.summary}}
---
{{/each}}

Istruzioni:
1.  Comprendi l'INTENTO della query dell'utente, non solo le parole chiave.
2.  Confronta l'intento con il titolo, l'URL e il riepilogo di ogni segnalibro.
3.  Restituisci un elenco di ID dei segnalibri che ritieni più pertinenti per la query.
4.  Se nessun segnalibro è pertinente, restituisci un array vuoto.

Restituisci l'output come un singolo oggetto JSON che corrisponda allo schema di output.`,
});

const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input) => {
    const { output } = await smartSearchPrompt(input);
    return output!;
  }
);
