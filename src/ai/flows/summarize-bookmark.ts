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
  summary: z.string().describe('A short summary of the content at the URL.'),
});
export type SummarizeBookmarkOutput = z.infer<typeof SummarizeBookmarkOutputSchema>;

export async function summarizeBookmark(input: SummarizeBookmarkInput): Promise<SummarizeBookmarkOutput> {
  return summarizeBookmarkFlow(input);
}

const summarizeBookmarkPrompt = ai.definePrompt({
  name: 'summarizeBookmarkPrompt',
  input: {schema: SummarizeBookmarkInputSchema},
  output: {schema: SummarizeBookmarkOutputSchema},
  prompt: `You are an expert web content summarizer.  You will be given a URL and you will summarize the content of the page at that URL in a single sentence.

URL: {{{url}}}`,
});

const summarizeBookmarkFlow = ai.defineFlow(
  {
    name: 'summarizeBookmarkFlow',
    inputSchema: SummarizeBookmarkInputSchema,
    outputSchema: SummarizeBookmarkOutputSchema,
  },
  async input => {
    const {output} = await summarizeBookmarkPrompt(input);
    return output!;
  }
);
