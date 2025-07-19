'use server';

/**
 * @fileOverview A Genkit flow to analyze the content of a workspace space.
 * 
 * - analyzeSpace - A function that analyzes a collection of bookmarks and folders.
 * - AnalyzeSpaceInput - The input type for the analyzeSpace function.
 * - AnalyzeSpaceOutput - The return type for the analyzeSpace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BookmarkSchemaForAnalysis = z.object({
  title: z.string(),
  summary: z.string().optional(),
});

export const AnalyzeSpaceInputSchema = z.object({
  spaceName: z.string().describe('Il nome dello spazio da analizzare.'),
  bookmarks: z.array(BookmarkSchemaForAnalysis).describe('Elenco dei segnalibri nello spazio.'),
});
export type AnalyzeSpaceInput = z.infer<typeof AnalyzeSpaceInputSchema>;

export const AnalyzeSpaceOutputSchema = z.object({
  analysis: z.string().describe('Un\'analisi dettagliata in formato Markdown.'),
  keyThemes: z.array(z.string()).describe('I temi o le tecnologie chiave identificati.'),
  suggestions: z.array(z.string()).describe('Suggerimenti per argomenti correlati o strumenti mancanti.'),
});
export type AnalyzeSpaceOutput = z.infer<typeof AnalyzeSpaceOutputSchema>;

export async function analyzeSpace(input: AnalyzeSpaceInput): Promise<AnalyzeSpaceOutput> {
  return analyzeSpaceFlow(input);
}

const analyzeSpacePrompt = ai.definePrompt({
  name: 'analyzeSpacePrompt',
  input: { schema: AnalyzeSpaceInputSchema },
  output: { schema: AnalyzeSpaceOutputSchema },
  prompt: `Sei un esperto analista di dati e un curatore di contenuti. Il tuo compito è analizzare il contenuto di uno spazio di lavoro digitale per aiutare l'utente a comprenderlo meglio. L'intera risposta DEVE essere in italiano.

Spazio da Analizzare: "{{spaceName}}"

Contenuto dello Spazio (Segnalibri):
{{#each bookmarks}}
- Titolo: {{this.title}} (Riepilogo: {{this.summary}})
{{/each}}

Istruzioni per l'analisi:
1.  **Analisi Generale (analysis):** Scrivi un paragrafo di riepilogo (in formato Markdown) che descriva lo scopo generale e il focus dello spazio basandoti sui segnalibri forniti. Identifica le categorie principali di strumenti o risorse.
2.  **Temi Chiave (keyThemes):** Estrai un elenco dei 3-5 temi, tecnologie o concetti più importanti presenti nello spazio.
3.  **Suggerimenti (suggestions):** Sulla base dei contenuti esistenti, fornisci 2-3 suggerimenti intelligenti per aree correlate che l'utente potrebbe voler esplorare o strumenti che potrebbero mancare per completare la sua collezione.

Restituisci l'output come un singolo oggetto JSON che corrisponda allo schema di output.`,
});

const analyzeSpaceFlow = ai.defineFlow(
  {
    name: 'analyzeSpaceFlow',
    inputSchema: AnalyzeSpaceInputSchema,
    outputSchema: AnalyzeSpaceOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeSpacePrompt(input);
    return output!;
  }
);
