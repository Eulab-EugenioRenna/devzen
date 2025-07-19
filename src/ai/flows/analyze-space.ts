'use server';

/**
 * @fileOverview A Genkit flow to analyze the content of a workspace space.
 * 
 * - analyzeSpace - A function that analyzes a collection of bookmarks and folders.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeSpaceInputSchema, AnalyzeSpaceOutputSchema, type AnalyzeSpaceInput, type AnalyzeSpaceOutput } from '@/lib/types';

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
