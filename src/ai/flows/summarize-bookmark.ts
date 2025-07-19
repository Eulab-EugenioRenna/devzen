
'use server';

/**
 * @fileOverview A Genkit flow to summarize a bookmark given its URL.
 *
 * - summarizeBookmark - A function that summarizes the content of a given URL.
 * - SummarizeBookmarkInput - The input type for the summarizeBookmark function.
 * - SummarizeBookmarkOutput - The return type for the summarizeBookmark function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeBookmarkInputSchema = z.object({
  url: z.string().url().describe('The URL of the bookmark to summarize.'),
});
export type SummarizeBookmarkInput = z.infer<typeof SummarizeBookmarkInputSchema>;

const SummarizeBookmarkOutputSchema = z.object({
  summary: z.string().describe("Un breve riassunto in italiano del contenuto all'URL."),
});
export type SummarizeBookmarkOutput = z.infer<typeof SummarizeBookmarkOutputSchema>;

export async function summarizeBookmark(input: SummarizeBookmarkInput): Promise<SummarizeBookmarkOutput> {
  return summarizeBookmarkFlow(input);
}

const summarizeBookmarkPrompt = ai.definePrompt({
  name: 'summarizeBookmarkPrompt',
  input: {schema: SummarizeBookmarkInputSchema},
  output: {schema: SummarizeBookmarkOutputSchema},
  prompt: `Sei un esperto riassuntore di contenuti web. Ti verrà fornito un URL e riassumerai il contenuto della pagina a quell'URL in una singola frase. La risposta DEVE essere in italiano.

URL: {{{url}}}`,
});

const summarizeBookmarkFlow = ai.defineFlow(
  {
    name: 'summarizeBookmarkFlow',
    inputSchema: SummarizeBookmarkInputSchema,
    outputSchema: SummarizeBookmarkOutputSchema,
  },
  async input => {
    const {output} = await summarizeBookmarkPrompt(input, {model: 'googleai/gemini-1.5-flash-latest'});
    return output!;
  }
);
