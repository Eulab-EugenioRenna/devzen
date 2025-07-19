export type SpaceItem = Bookmark | Folder;

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

export interface Space {
  id:string;
  name: string;
  icon: string;
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
export interface AIBookmark {
    type: 'bookmark';
    title: string;
    url: string;
    icon?: string;
}

export interface AIFolder {
    type: 'folder';
    name: string;
    items: AIBookmark[];
}

export type AISpaceItem = AIBookmark | AIFolder;

export interface AISpace {
    name: string;
    icon: string;
    items: AISpaceItem[];
}

export interface AIWorkspace {
    spaces: AISpace[];
}


// Types for Analyze Space
const BookmarkSchemaForAnalysis = {
  title: '',
  summary: '',
};
export type AnalyzeSpaceInput = {
    spaceName: string;
    bookmarks: Array<typeof BookmarkSchemaForAnalysis>;
};
export type AnalyzeSpaceOutput = {
    analysis: string;
    keyThemes: string[];
    suggestions: string[];
};
