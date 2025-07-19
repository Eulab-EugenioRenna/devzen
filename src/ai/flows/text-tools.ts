
'use server';

/**
 * @fileOverview A set of Genkit flows for AI-powered text manipulation.
 * 
 * - correctText: Fixes spelling and grammar.
 * - summarizeText: Summarizes the given text.
 * - translateText: Translates text to a target language.
 * - improveText: Improves the writing style of the text.
 * - generateText: Generates text from a prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Correct Text
const CorrectTextInputSchema = z.object({
  text: z.string().describe('The text to correct.'),
});
const CorrectTextOutputSchema = z.object({
  correctedText: z.string().describe('The corrected text.'),
});
export async function correctText(text: string): Promise<string> {
  const { output } = await correctTextFlow({ text });
  return output!.correctedText;
}
const correctTextPrompt = ai.definePrompt({
  name: 'correctTextPrompt',
  input: { schema: CorrectTextInputSchema },
  output: { schema: CorrectTextOutputSchema },
  prompt: `Correggi eventuali errori di ortografia e grammatica nel seguente testo. Restituisci solo un oggetto JSON valido contenente il testo corretto, senza alcuna spiegazione. Il testo DEVE essere in italiano.

Testo da correggere:
"{{text}}"`,
});
const correctTextFlow = ai.defineFlow(
  { name: 'correctTextFlow', inputSchema: CorrectTextInputSchema, outputSchema: CorrectTextOutputSchema },
  async (input) => await correctTextPrompt(input)
);


// Summarize Text
const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The summarized text.'),
});
export async function summarizeText(text: string): Promise<string> {
  const { output } = await summarizeTextFlow({ text });
  return output!.summary;
}
const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: { schema: SummarizeTextInputSchema },
  output: { schema: SummarizeTextOutputSchema },
  prompt: `Riassumi il seguente testo in modo conciso. Restituisci solo un oggetto JSON valido contenente il riassunto. Il riassunto DEVE essere in italiano.

Testo da riassumere:
"{{text}}"`,
});
const summarizeTextFlow = ai.defineFlow(
  { name: 'summarizeTextFlow', inputSchema: SummarizeTextInputSchema, outputSchema: SummarizeTextOutputSchema },
  async (input) => await summarizeTextPrompt(input)
);

// Translate Text
const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "English", "Spanish").'),
});
const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export async function translateText(text: string, targetLanguage: string): Promise<string> {
    const { output } = await translateTextFlow({ text, targetLanguage });
    return output!.translatedText;
}
const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Traduci il seguente testo in {{targetLanguage}}. Restituisci solo un oggetto JSON valido contenente il testo tradotto.

Testo da tradurre:
"{{text}}"`,
});
const translateTextFlow = ai.defineFlow(
  { name: 'translateTextFlow', inputSchema: TranslateTextInputSchema, outputSchema: TranslateTextOutputSchema },
  async (input) => await translateTextPrompt(input)
);

// Improve Text
const ImproveTextInputSchema = z.object({
  text: z.string().describe('The text to improve.'),
});
const ImproveTextOutputSchema = z.object({
  improvedText: z.string().describe('The improved text.'),
});
export async function improveText(text: string): Promise<string> {
    const { output } = await improveTextFlow({ text });
    return output!.improvedText;
}
const improveTextPrompt = ai.definePrompt({
  name: 'improveTextPrompt',
  input: { schema: ImproveTextInputSchema },
  output: { schema: ImproveTextOutputSchema },
  prompt: `Migliora lo stile, la chiarezza e il tono del seguente testo, rendendolo più professionale e scorrevole. Restituisci solo un oggetto JSON valido contenente il testo migliorato. Il testo DEVE essere in italiano.

Testo da migliorare:
"{{text}}"`,
});
const improveTextFlow = ai.defineFlow(
  { name: 'improveTextFlow', inputSchema: ImproveTextInputSchema, outputSchema: ImproveTextOutputSchema },
  async (input) => await improveTextPrompt(input)
);


// Generate Text
const GenerateTextInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate text from.'),
});
const GenerateTextOutputSchema = z.object({
  generatedText: z.string().describe('The generated text.'),
});
export async function generateText(prompt: string): Promise<string> {
    const { output } = await generateTextFlow({ prompt });
    return output!.generatedText;
}
const generateTextPrompt = ai.definePrompt({
  name: 'generateTextPrompt',
  input: { schema: GenerateTextInputSchema },
  output: { schema: GenerateTextOutputSchema },
  prompt: `Genera del testo basato sul seguente prompt. Fornisci una risposta completa e ben formattata all'interno di un oggetto JSON valido. La risposta DEVE essere in italiano.

Prompt:
"{{prompt}}"`,
});
const generateTextFlow = ai.defineFlow(
  { name: 'generateTextFlow', inputSchema: GenerateTextInputSchema, outputSchema: GenerateTextOutputSchema },
  async (input) => await generateTextPrompt(input)
);
