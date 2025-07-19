
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
  const result = await correctTextFlow({ text });
  return result.correctedText;
}
const correctTextPrompt = ai.definePrompt({
  name: 'correctTextPrompt',
  input: { schema: CorrectTextInputSchema },
  output: { format: 'json' },
  prompt: `Correggi eventuali errori di ortografia e grammatica nel seguente testo. Restituisci solo un oggetto JSON valido contenente il testo corretto, senza alcuna spiegazione. Il testo DEVE essere in italiano.

Testo da correggere:
"{{text}}"`,
});
const correctTextFlow = ai.defineFlow(
  { name: 'correctTextFlow', inputSchema: CorrectTextInputSchema, outputSchema: CorrectTextOutputSchema },
  async (input) => {
    const llmResponse = await correctTextPrompt(input);
    return JSON.parse(llmResponse.text);
  }
);


// Summarize Text
const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The summarized text.'),
});
export async function summarizeText(text: string): Promise<string> {
  const result = await summarizeTextFlow({ text });
  return result.summary;
}
const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: { schema: SummarizeTextInputSchema },
  output: { format: 'json' },
  prompt: `Riassumi il seguente testo in modo conciso. Restituisci solo un oggetto JSON valido contenente il riassunto. Il riassunto DEVE essere in italiano.

Testo da riassumere:
"{{text}}"`,
});
const summarizeTextFlow = ai.defineFlow(
  { name: 'summarizeTextFlow', inputSchema: SummarizeTextInputSchema, outputSchema: SummarizeTextOutputSchema },
  async (input) => {
    const llmResponse = await summarizeTextPrompt(input);
    return JSON.parse(llmResponse.text);
  }
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
    const result = await translateTextFlow({ text, targetLanguage });
    return result.translatedText;
}
const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { format: 'json' },
  prompt: `Traduci il seguente testo in {{targetLanguage}}. Restituisci solo un oggetto JSON valido contenente il testo tradotto.

Testo da tradurre:
"{{text}}"`,
});
const translateTextFlow = ai.defineFlow(
  { name: 'translateTextFlow', inputSchema: TranslateTextInputSchema, outputSchema: TranslateTextOutputSchema },
  async (input) => {
    const llmResponse = await translateTextPrompt(input);
    return JSON.parse(llmResponse.text);
  }
);

// Improve Text
const ImproveTextInputSchema = z.object({
  text: z.string().describe('The text to improve.'),
});
const ImproveTextOutputSchema = z.object({
  improvedText: z.string().describe('The improved text.'),
});
export async function improveText(text: string): Promise<string> {
    const result = await improveTextFlow({ text });
    return result.improvedText;
}
const improveTextPrompt = ai.definePrompt({
  name: 'improveTextPrompt',
  input: { schema: ImproveTextInputSchema },
  output: { format: 'json' },
  prompt: `Migliora lo stile, la chiarezza e il tono del seguente testo, rendendolo più professionale e scorrevole. Restituisci solo un oggetto JSON valido contenente il testo migliorato. Il testo DEVE essere in italiano.

Testo da migliorare:
"{{text}}"`,
});
const improveTextFlow = ai.defineFlow(
  { name: 'improveTextFlow', inputSchema: ImproveTextInputSchema, outputSchema: ImproveTextOutputSchema },
  async (input) => {
    const llmResponse = await improveTextPrompt(input);
    return JSON.parse(llmResponse.text);
  }
);


// Generate Text
const GenerateTextInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate text from.'),
});
const GenerateTextOutputSchema = z.object({
  generatedText: z.string().describe('The generated text.'),
});
export async function generateText(prompt: string): Promise<string> {
    const result = await generateTextFlow({ prompt });
    return result.generatedText;
}
const generateTextPrompt = ai.definePrompt({
  name: 'generateTextPrompt',
  input: { schema: GenerateTextInputSchema },
  output: { format: 'json' },
  prompt: `Genera del testo basato sul seguente prompt. Fornisci una risposta completa e ben formattata all'interno di un oggetto JSON valido. La risposta DEVE essere in italiano.

Prompt:
"{{prompt}}"`,
});
const generateTextFlow = ai.defineFlow(
  { name: 'generateTextFlow', inputSchema: GenerateTextInputSchema, outputSchema: GenerateTextOutputSchema },
  async (input) => {
    const llmResponse = await generateTextPrompt(input);
    return JSON.parse(llmResponse.text);
  }
);
