'use server';

/**
 * @fileOverview A Genkit flow to generate a workspace structure from a text prompt.
 * 
 * - generateWorkspace - A function that takes a user prompt and returns a JSON structure for a workspace.
 */

import { ai } from '@/ai/genkit';
import { getToolsAiAction } from '@/app/actions';
import { z } from 'genkit';
import { GenerateWorkspaceInputSchema, GenerateWorkspaceOutputSchema, type GenerateWorkspaceInput, type GenerateWorkspaceOutput } from '@/lib/types';


// The wrapper function that will be called from the frontend
export async function generateWorkspace(input: GenerateWorkspaceInput): Promise<GenerateWorkspaceOutput> {
  return generateWorkspaceFlow(input);
}

// Tool to get tools from the library
const getLibraryTools = ai.defineTool(
    {
        name: 'getLibraryTools',
        description: 'Ottieni un elenco di strumenti AI curati dalla libreria in base a una categoria o parola chiave.',
        inputSchema: z.object({
            query: z.string().describe('Una categoria o parola chiave per la ricerca, ad es. "marketing" o "sviluppo".'),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            link: z.string().url(),
        })),
    },
    async (input) => {
        const allTools = await getToolsAiAction();
        const lowerCaseQuery = input.query.toLowerCase();
        return allTools.filter(tool => 
            tool.name.toLowerCase().includes(lowerCaseQuery) ||
            tool.category.toLowerCase().includes(lowerCaseQuery) ||
            tool.summary.summary.toLowerCase().includes(lowerCaseQuery) ||
            tool.summary.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
        ).map(tool => ({ name: tool.name, link: tool.link }));
    }
);


// The Genkit Prompt
const generateWorkspacePrompt = ai.definePrompt({
  name: 'generateWorkspacePrompt',
  input: { schema: GenerateWorkspaceInputSchema },
  output: { schema: GenerateWorkspaceOutputSchema },
  tools: [getLibraryTools],
  prompt: `Sei un esperto organizzatore di spazi di lavoro. In base al prompt dell'utente, crea uno spazio di lavoro strutturato con spazi, cartelle e segnalibri pertinenti. **Tutta la tua risposta DEVE essere in italiano.**

  Prompt utente:
  "{{prompt}}"
  
  Istruzioni:
  - Crea spazi che rappresentino le categorie principali dal prompt (es. Marketing, Sviluppo, Design). I nomi devono essere in italiano.
  - Per ogni spazio, scegli un'icona pertinente dalla libreria lucide-react (es. 'Code', 'Database', 'Book', 'PenTool', 'Globe').
  - **Usa lo strumento 'getLibraryTools' per trovare segnalibri pertinenti per le categorie che identifichi.** Ad esempio, se l'utente chiede uno spazio 'marketing', usa lo strumento con la query 'marketing' per trovare strumenti da aggiungere come segnalibri.
  - Se non riesci a trovare strumenti pertinenti nella libreria per una categoria, puoi trovare altri URL appropriati e validi per i segnalibri.
  - Se possibile, suggerisci uno slug di icona pertinente da simple-icons.org per ogni segnalibro.
  - Restituisci l'intera struttura come un singolo oggetto JSON che corrisponda allo schema di output. Assicurati che tutti i nomi e le descrizioni siano in italiano.`,
});


// The Genkit Flow
const generateWorkspaceFlow = ai.defineFlow(
  {
    name: 'generateWorkspaceFlow',
    inputSchema: GenerateWorkspaceInputSchema,
    outputSchema: GenerateWorkspaceOutputSchema,
  },
  async (input) => {
    const { output } = await generateWorkspacePrompt(input);
    return output!;
  }
);
