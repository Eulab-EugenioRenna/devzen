'use server';
/**
 * @fileOverview A Genkit flow to categorize a bookmark into a space.
 * 
 * - categorizeBookmark - Suggests a space for a given URL.
 */

import { ai } from '@/ai/genkit';
import { CategorizeBookmarkInputSchema, CategorizeBookmarkOutputSchema, type CategorizeBookmarkInput, type CategorizeBookmarkOutput } from '@/lib/types';


export async function categorizeBookmark(input: CategorizeBookmarkInput): Promise<CategorizeBookmarkOutput> {
  return categorizeBookmarkFlow(input);
}

const categorizeBookmarkPrompt = ai.definePrompt({
  name: 'categorizeBookmarkPrompt',
  input: { schema: CategorizeBookmarkInputSchema },
  output: { schema: CategorizeBookmarkOutputSchema },
  prompt: `Sei un organizzatore esperto. Data l'URL di una pagina web e un elenco di spazi di lavoro, determina quale spazio è il più appropriato per questo segnalibro.

URL da analizzare: {{{url}}}

Elenco degli spazi disponibili:
{{#each spaces}}
- {{this.name}} (ID: {{this.id}})
{{/each}}

Analizza il contenuto della pagina all'URL fornito e scegli lo spazio più pertinente dall'elenco. Restituisci solo l'ID dello spazio scelto. L'intera analisi deve essere basata sul contenuto della pagina, non solo sull'URL stesso.`,
});

const categorizeBookmarkFlow = ai.defineFlow(
  {
    name: 'categorizeBookmarkFlow',
    inputSchema: CategorizeBookmarkInputSchema,
    outputSchema: CategorizeBookmarkOutputSchema,
  },
  async (input) => {
    if (input.spaces.length === 0) {
      throw new Error('Nessuno spazio disponibile per la categorizzazione.');
    }
    const { output } = await categorizeBookmarkPrompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
    return output!;
  }
);
