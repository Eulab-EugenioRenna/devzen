'use server';

/**
 * @fileOverview A Genkit flow to guide a user in developing an idea into a structured workspace.
 * 
 * - developIdea - A conversational function that helps flesh out an idea.
 */

import { ai } from '@/ai/genkit';
import { getToolsAiAction } from '@/app/actions/data';
import { AIBookmarkSchema, ChatMessageSchema } from '@/lib/types';
import { z } from 'genkit';

const DevelopIdeaInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
  prompt: z.string().describe('The latest user input.'),
});
export type DevelopIdeaInput = z.infer<typeof DevelopIdeaInputSchema>;

const FinalPayloadSchema = z.object({
    spaceName: z.string().describe("Il nome per il nuovo spazio di lavoro."),
    spaceIcon: z.string().describe("Un'icona pertinente da lucide-react per lo spazio."),
    tasks: z.array(z.string()).describe("Un elenco di task concreti per sviluppare l'idea."),
    suggestedTools: z.array(AIBookmarkSchema).describe("Un elenco di segnalibri/strumenti utili."),
}).nullable();

const DevelopIdeaOutputSchema = z.object({
    response: z.string().describe("La risposta dell'AI per continuare la conversazione."),
    isFinished: z.boolean().describe("Indica se la conversazione di sviluppo dell'idea è terminata."),
    finalPayload: FinalPayloadSchema.describe("I dati finali per la creazione dello spazio di lavoro, popolati solo quando isFinished è true."),
});
export type DevelopIdeaOutput = z.infer<typeof DevelopIdeaOutputSchema>;

export async function developIdea(input: DevelopIdeaInput): Promise<DevelopIdeaOutput> {
  return developIdeaFlow(input);
}

const getLibraryTools = ai.defineTool(
    {
        name: 'getLibraryToolsForIdea',
        description: 'Ottieni un elenco di strumenti AI curati dalla libreria per un determinato argomento o categoria, da suggerire per lo sviluppo di un\'idea.',
        inputSchema: z.object({
            query: z.string().describe('Una categoria o parola chiave per la ricerca, ad es. "marketing" o "sviluppo web".'),
        }),
        outputSchema: z.array(z.object({
            title: z.string(),
            url: z.string().url(),
            icon: z.string().optional(),
        })),
    },
    async (input) => {
        const allTools = await getToolsAiAction();
        const lowerCaseQuery = input.query.toLowerCase();
        return allTools
            .filter(tool => 
                tool.name.toLowerCase().includes(lowerCaseQuery) ||
                tool.category.toLowerCase().includes(lowerCaseQuery) ||
                tool.summary.summary.toLowerCase().includes(lowerCaseQuery) ||
                tool.summary.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
            )
            .map(tool => ({ title: tool.name, url: tool.link, icon: tool.brand }))
            .slice(0, 5); // Limit to 5 tools
    }
);

const developIdeaPrompt = ai.definePrompt({
  name: 'developIdeaPrompt',
  input: { schema: DevelopIdeaInputSchema },
  output: { schema: DevelopIdeaOutputSchema },
  tools: [getLibraryTools],
  prompt: `Sei un esperto consulente di strategia e product manager. Il tuo compito è aiutare un utente a trasformare un'idea vaga in un piano d'azione concreto. Comunichi in italiano.

Ecco il flusso della conversazione:
1.  **Introduzione**: Se la cronologia è vuota, presentati e chiedi all'utente quale idea vuole sviluppare.
2.  **Approfondimento**: Poni domande mirate per capire meglio l'idea. Chiedi del target, degli obiettivi, delle funzionalità principali. Sii incoraggiante e curioso.
3.  **Proposta di Strutturazione**: Una volta che l'idea sembra abbastanza chiara, proponi di trasformarla in un piano. Chiedi: "L'idea mi sembra chiara. Ti andrebbe se provassi a strutturarla in uno spazio di lavoro con task principali e una lista di strumenti utili?".
4.  **Generazione del Piano**: Se l'utente accetta, analizza l'intera conversazione.
    - Crea un nome significativo per lo spazio di lavoro.
    - Scegli un'icona adatta da lucide-react.
    - Definisci 3-5 task di alto livello necessari per realizzare l'idea.
    - Usa lo strumento 'getLibraryToolsForIdea' per trovare strumenti pertinenti. Se non trovi nulla, non inventare.
    - Imposta 'isFinished' su 'true' e popola 'finalPayload' con tutti questi dati. La tua 'response' finale dovrebbe essere un riepilogo di ciò che hai preparato.
5.  **Conversazione Continua**: Se l'utente non è pronto per la strutturazione o vuole discutere ulteriormente, continua la conversazione in modo naturale. Mantieni 'isFinished' su 'false' e 'finalPayload' su 'null'.

CRONOLOGIA DELLA CHAT:
{{#each history}}
- {{this.role}}: {{this.content}}
{{/each}}
- user: {{prompt}}

Istruzioni importanti:
- Non impostare MAI 'isFinished' su 'true' a meno che tu non abbia ricevuto un'esplicita conferma dall'utente per procedere con la strutturazione del piano.
- La tua risposta deve essere sempre un singolo oggetto JSON che corrisponde allo schema di output.`,
});

const developIdeaFlow = ai.defineFlow(
  {
    name: 'developIdeaFlow',
    inputSchema: DevelopIdeaInputSchema,
    outputSchema: DevelopIdeaOutputSchema,
  },
  async (input) => {
    const { output } = await developIdeaPrompt(input);
    return output!;
  }
);
