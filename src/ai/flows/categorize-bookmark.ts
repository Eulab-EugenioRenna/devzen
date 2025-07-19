'use server';
/**
 * @fileOverview A Genkit flow to categorize a bookmark into a space.
 * 
 * - categorizeBookmark - Suggests a space for a given URL.
 * - CategorizeBookmarkInput - The input type for the categorizeBookmark function.
 * - CategorizeBookmarkOutput - The return type for the categorizeBookmark function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const CategorizeBookmarkInputSchema = z.object({
  url: z.string().url().describe('L\'URL del segnalibro da categorizzare.'),
  spaces: z.array(SpaceSchema).describe('Un elenco di possibili spazi in cui inserire il segnalibro.'),
});
export type CategorizeBookmarkInput = z.infer<typeof CategorizeBookmarkInputSchema>;

export const CategorizeBookmarkOutputSchema = z.object({
  spaceId: z.string().describe("L'ID dello spazio suggerito più pertinente per il segnalibro."),
});
export type CategorizeBookmarkOutput = z.infer<typeof CategorizeBookmarkOutputSchema>;

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
