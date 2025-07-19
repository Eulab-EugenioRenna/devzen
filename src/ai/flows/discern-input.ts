'use server';
/**
 * @fileOverview A Genkit flow to determine if an input string is a URL or a note.
 *
 * - discernInput - Determines the type of input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiscernInputSchema = z.object({
  text: z.string(),
});

const DiscernOutputSchema = z.object({
  type: z.enum(['url', 'note']).describe('The discerned type of the input text.'),
});

export async function discernInput(text: string): Promise<'url' | 'note'> {
  const result = await discernInputFlow({ text });
  return result.type;
}

const discernInputPrompt = ai.definePrompt({
  name: 'discernInputPrompt',
  input: { schema: DiscernInputSchema },
  output: { schema: DiscernOutputSchema },
  prompt: `Analizza il seguente testo e determina se è un URL/dominio o un testo semplice (nota).

- Se sembra un URL o un nome di dominio (es. 'example.com', 'http://google.it', 'www.figma.com/file'), restituisci 'url'.
- Per qualsiasi altra cosa, come una frase, una frase o più righe di testo, restituisci 'note'.

Testo da analizzare:
"{{text}}"`,
});

const discernInputFlow = ai.defineFlow(
  {
    name: 'discernInputFlow',
    inputSchema: DiscernInputSchema,
    outputSchema: DiscernOutputSchema,
  },
  async (input) => {
    // Basic check to avoid unnecessary AI calls for obvious cases
    if (input.text.includes('\n') || input.text.split(' ').length > 3) {
      return { type: 'note' };
    }
    try {
        new URL(input.text.includes('://') ? input.text : `https://${input.text}`);
        return { type: 'url' };
    } catch (e) {
        // Not a simple URL, let AI decide
    }

    const { output } = await discernInputPrompt(input);
    return output!;
  }
);
