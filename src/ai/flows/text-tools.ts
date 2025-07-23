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

import { getInitializedAI } from '@/ai/genkit';
import { z } from 'genkit';

// Correct Text
const CorrectTextInputSchema = z.object({
  text: z.string().describe('The text to correct.'),
});
const CorrectTextOutputSchema = z.object({
  correctedText: z.string().describe('The corrected text.'),
});
export async function correctText(text: string): Promise<string> {
  const ai = await getInitializedAI();
  const correctTextFlow = ai.defineFlow(
    { name: 'correctTextFlow', inputSchema: CorrectTextInputSchema, outputSchema: CorrectTextOutputSchema },
    async (input) => {
      const correctTextPrompt = ai.definePrompt({
        name: 'correctTextPrompt',
        input: { schema: CorrectTextInputSchema },
        output: { schema: CorrectTextOutputSchema },
        prompt: `Correggi eventuali errori di ortografia e grammatica nel seguente testo. Restituisci solo un oggetto JSON valido. Il valore del campo 'correctedText' DEVE essere in italiano, ma la chiave deve rimanere 'correctedText'.

Testo da correggere:
"{{text}}"`,
      });
      const { output } = await correctTextPrompt(input);
      return output!;
    }
  );
  const result = await correctTextFlow({ text });
  return result.correctedText;
}

// Summarize Text
const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The summarized text.'),
});
export async function summarizeText(text: string): Promise<string> {
  const ai = await getInitializedAI();
  const summarizeTextFlow = ai.defineFlow(
    { name: 'summarizeTextFlow', inputSchema: SummarizeTextInputSchema, outputSchema: SummarizeTextOutputSchema },
    async (input) => {
        const summarizeTextPrompt = ai.definePrompt({
            name: 'summarizeTextPrompt',
            input: { schema: SummarizeTextInputSchema },
            output: { schema: SummarizeTextOutputSchema },
            prompt: `Riassumi il seguente testo in modo conciso. Restituisci solo un oggetto JSON valido. Il valore del campo 'summary' DEVE essere in italiano, ma la chiave deve rimanere 'summary'.

Testo da riassumere:
"{{text}}"`,
        });
      const { output } = await summarizeTextPrompt(input);
      return output!;
    }
  );
  const result = await summarizeTextFlow({ text });
  return result.summary;
}

// Translate Text
const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "English", "Spanish").'),
});
const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export async function translateText(text: string, targetLanguage: string): Promise<string> {
    const ai = await getInitializedAI();
    const translateTextFlow = ai.defineFlow(
      { name: 'translateTextFlow', inputSchema: TranslateTextInputSchema, outputSchema: TranslateTextOutputSchema },
      async (input) => {
        const translateTextPrompt = ai.definePrompt({
            name: 'translateTextPrompt',
            input: { schema: TranslateTextInputSchema },
            output: { schema: TranslateTextOutputSchema },
            prompt: `Traduci il seguente testo in {{targetLanguage}}. Restituisci solo un oggetto JSON valido. Il valore del campo 'translatedText' DEVE essere in italiano, ma la chiave deve rimanere 'translatedText'.

Testo da tradurre:
"{{text}}"`,
        });
        const { output } = await translateTextPrompt(input);
        return output!;
      }
    );
    const result = await translateTextFlow({ text, targetLanguage });
    return result.translatedText;
}

// Improve Text
const ImproveTextInputSchema = z.object({
  text: z.string().describe('The text to improve.'),
});
const ImproveTextOutputSchema = z.object({
  improvedText: z.string().describe('The improved text.'),
});
export async function improveText(text: string): Promise<string> {
    const ai = await getInitializedAI();
    const improveTextFlow = ai.defineFlow(
      { name: 'improveTextFlow', inputSchema: ImproveTextInputSchema, outputSchema: ImproveTextOutputSchema },
      async (input) => {
        const improveTextPrompt = ai.definePrompt({
            name: 'improveTextPrompt',
            input: { schema: ImproveTextInputSchema },
            output: { schema: ImproveTextOutputSchema },
            prompt: `Migliora lo stile, la chiarezza e il tono del seguente testo, rendendolo più professionale e scorrevole. Restituisci solo un oggetto JSON valido. Il valore del campo 'improvedText' DEVE essere in italiano, ma la chiave deve rimanere 'improvedText'.

Testo da migliorare:
"{{text}}"`,
        });
        const { output } = await improveTextPrompt(input);
        return output!;
      }
    );
    const result = await improveTextFlow({ text });
    return result.improvedText;
}

// Generate Text
const GenerateTextInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate text from.'),
});
export async function generateText(prompt: string): Promise<string> {
    const ai = await getInitializedAI();
    const generateTextFlow = ai.defineFlow(
      {
        name: 'generateTextFlow',
        inputSchema: GenerateTextInputSchema,
        outputSchema: z.string()
      },
      async (input) => {
        const llmResponse = await ai.generate({
          prompt: `Continua, espandi o genera testo basato sul seguente prompt. Fornisci una risposta completa e ben formattata in italiano.\n\nPrompt:\n"${input.prompt}"`,
        });
        return llmResponse.text;
      }
    );
    return await generateTextFlow({ prompt });
}
