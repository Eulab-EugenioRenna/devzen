
import { z } from 'zod';

export type SpaceItem = Bookmark | Folder | SpaceLink;

interface BaseItem {
  id: string;
  spaceId: string;
  parentId?: string | null;
  backgroundColor?: string;
  textColor?: string;
}

export interface Bookmark extends BaseItem {
  type: 'bookmark';
  title: string;
  url: string;
  summary?: string;
  icon?: string;
  iconUrl?: string;
  iconColor?: string;
}

export interface Folder extends BaseItem {
  type: 'folder';
  name: string;
  items: Bookmark[];
}

export interface SpaceLink extends BaseItem {
    type: 'space-link';
    name: string;
    icon: string;
    linkedSpaceId: string;
}

export interface Space {
  id:string;
  name: string;
  icon: string;
  category?: string;
  isLink?: boolean;
}

export interface AppInfo {
  id: string;
  title: string;
  logo: string;
}

export interface ToolsAiSummary {
  apiAvailable: boolean;
  category: string;
  concepts: string[];
  derivedLink: string;
  name: string;
  summary: string;
  tags: string[];
  useCases: string[];
}

export interface ToolsAi {
  id: string;
  name: string;
  link: string;
  category: string;
  source: string;
  summary: ToolsAiSummary;
  deleted: boolean;
  brand: string;
}

// Types for AI Workspace Generation
export const AIBookmarkSchema = z.object({
  type: z.literal('bookmark'),
  title: z.string().describe('Il titolo del segnalibro.'),
  url: z.string().url().describe("L'URL completo del segnalibro."),
  icon: z.string().optional().describe("Uno slug pertinente da simple-icons.org, es. 'nextdotjs' o 'react'.")
});
export type AIBookmark = z.infer<typeof AIBookmarkSchema>;

export const AIFolderSchema = z.object({
    type: z.literal('folder'),
    name: z.string().describe('Il nome della cartella.'),
    items: z.array(AIBookmarkSchema).describe('Un elenco di segnalibri all\'interno di questa cartella.')
});
export type AIFolder = z.infer<typeof AIFolderSchema>;

export const AISpaceItemSchema = z.union([AIBookmarkSchema, AIFolderSchema]);
export type AISpaceItem = z.infer<typeof AISpaceItemSchema>;

export const AISpaceSchema = z.object({
  name: z.string().describe('Il nome dello spazio.'),
  icon: z.string().describe("Un nome di icona singolo e pertinente da lucide-react, es. 'Code' o 'Briefcase'. Usa un nome di icona valido."),
  items: z.array(AISpaceItemSchema).describe('Un elenco di segnalibri e cartelle per questo spazio.'),
});
export type AISpace = z.infer<typeof AISpaceSchema>;

export const AIWorkspaceSchema = z.object({
  spaces: z.array(AISpaceSchema).describe('Un array di spazi che compongono lo spazio di lavoro.'),
});
export type AIWorkspace = z.infer<typeof AIWorkspaceSchema>;


export const GenerateWorkspaceInputSchema = z.object({
  prompt: z.string(),
});
export type GenerateWorkspaceInput = z.infer<typeof GenerateWorkspaceInputSchema>;

export const GenerateWorkspaceOutputSchema = AIWorkspaceSchema;
export type GenerateWorkspaceOutput = z.infer<typeof GenerateWorkspaceOutputSchema>;


// Types for Analyze Space
export const BookmarkSchemaForAnalysis = z.object({
  title: z.string(),
  summary: z.string().optional(),
});

export const AnalyzeSpaceInputSchema = z.object({
  spaceName: z.string().describe('Il nome dello spazio da analizzare.'),
  bookmarks: z.array(BookmarkSchemaForAnalysis).describe('Elenco dei segnalibri nello spazio.'),
});
export type AnalyzeSpaceInput = z.infer<typeof AnalyzeSpaceInputSchema>;

export const AnalyzeSpaceOutputSchema = z.object({
  analysis: z.string().describe('Un\'analisi dettagliata in formato Markdown.'),
  keyThemes: z.array(z.string()).describe('I temi o le tecnologie chiave identificati.'),
  suggestions: z.array(z.string()).describe('Suggerimenti per argomenti correlati o strumenti mancanti.'),
});
export type AnalyzeSpaceOutput = z.infer<typeof AnalyzeSpaceOutputSchema>;


// Types for Categorize Bookmark
export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  category: z.string().optional(),
  isLink: z.boolean().optional(),
});

export const CategorizeBookmarkInputSchema = z.object({
  url: z.string().url().describe('L\'URL del segnalibro da categorizzare.'),
  spaces: z.array(SpaceSchema).describe('Un elenco di possibili spazi in cui inserire il segnalibro.'),
});
export type CategorizeBookmarkInput = z.infer<typeof CategorizeBookmarkInputSchema>;

export const CategorizeBookmarkOutputSchema = z.object({
  spaceId: z.string().describe("L'ID dello spazio suggerito più pertinente per il segnalibro."),
});
export type CategorizeBookmarkOutput = z.infer<typeof CategorizeBookmarkOutputSchema>;

// Types for Smart Search
export const BookmarkSearchSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  summary: z.string().optional(),
});

export const SmartSearchInputSchema = z.object({
  query: z.string().describe('La query di ricerca in linguaggio naturale dell\'utente.'),
  bookmarks: z.array(BookmarkSearchSchema).describe('L\'elenco dei segnalibri in cui cercare.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

export const SmartSearchOutputSchema = z.object({
  relevantBookmarkIds: z.array(z.string()).describe('Un array di ID dei segnalibri che corrispondono alla query.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

    