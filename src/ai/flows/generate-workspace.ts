'use server';

/**
 * @fileOverview A Genkit flow to generate a workspace structure from a text prompt.
 * 
 * - generateWorkspace - A function that takes a user prompt and returns a JSON structure for a workspace.
 * - GenerateWorkspaceInput - The input type for the generateWorkspace function.
 * - GenerateWorkspaceOutput - The return type for the generateWorkspace function.
 */

import { ai } from '@/ai/genkit';
import { getToolsAiAction } from '@/app/actions';
import { z } from 'genkit';

// Input Schema
const GenerateWorkspaceInputSchema = z.object({
  prompt: z.string().describe('A text description of the desired workspace, including spaces, folders, and bookmarks.'),
});
export type GenerateWorkspaceInput = z.infer<typeof GenerateWorkspaceInputSchema>;

// Output Schema
const AIBookmarkSchema = z.object({
  type: z.literal('bookmark'),
  title: z.string().describe('The title of the bookmark.'),
  url: z.string().url().describe('The full URL of the bookmark.'),
  icon: z.string().optional().describe("A relevant slug from simple-icons.org, e.g., 'nextdotjs' or 'react'.")
});

const AIFolderSchema = z.object({
    type: z.literal('folder'),
    name: z.string().describe('The name of the folder.'),
    items: z.array(AIBookmarkSchema).describe('A list of bookmarks within this folder.')
});

const AISpaceItemSchema = z.union([AIBookmarkSchema, AIFolderSchema]);

const AISpaceSchema = z.object({
  name: z.string().describe('The name of the space.'),
  icon: z.string().describe("A single, relevant icon name from lucide-react, e.g., 'Code' or 'Briefcase'. Use a valid icon name."),
  items: z.array(AISpaceItemSchema).describe('A list of bookmarks and folders for this space.'),
});

const GenerateWorkspaceOutputSchema = z.object({
  spaces: z.array(AISpaceSchema).describe('An array of spaces that make up the workspace.'),
});
export type GenerateWorkspaceOutput = z.infer<typeof GenerateWorkspaceOutputSchema>;

// The wrapper function that will be called from the frontend
export async function generateWorkspace(input: GenerateWorkspaceInput): Promise<GenerateWorkspaceOutput> {
  return generateWorkspaceFlow(input);
}

// Tool to get tools from the library
const getLibraryTools = ai.defineTool(
    {
        name: 'getLibraryTools',
        description: 'Get a list of curated AI tools from the library based on a category or keyword.',
        inputSchema: z.object({
            query: z.string().describe('A category or keyword to search for, e.g., "marketing" or "development".'),
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
  prompt: `Sei un esperto organizzatore di spazi di lavoro. In base al prompt dell'utente, crea uno spazio di lavoro strutturato con spazi, cartelle e segnalibri pertinenti. **Tutta la tua risposta deve essere in italiano.**

  Prompt utente:
  "{{prompt}}"
  
  Istruzioni:
  - Crea spazi che rappresentino le categorie principali dal prompt (es. Marketing, Sviluppo, Design). I nomi devono essere in italiano.
  - Per ogni spazio, scegli un'icona pertinente dalla libreria lucide-react (es. 'Code', 'Database', 'Book', 'PenTool', 'Globe').
  - **Usa lo strumento 'getLibraryTools' per trovare segnalibri pertinenti per le categorie che identifichi.** Ad esempio, se l'utente chiede uno spazio 'marketing', usa lo strumento con la query 'marketing' per trovare strumenti da aggiungere come segnalibri.
  - Se non riesci a trovare strumenti pertinenti nella libreria per una categoria, puoi trovare altri URL appropriati e validi per i segnalibri.
  - Se possibile, suggerisci uno slug di icona pertinente da simple-icons.org per ogni segnalibro.
  - Restituisci l'intera struttura come un singolo oggetto JSON che corrisponda allo schema di output.`,
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
