'use server';

import { 
    summarizeBookmark,
    generateWorkspace,
    categorizeBookmark,
    smartSearch,
    analyzeSpace,
    chatInSpace,
    correctText,
    summarizeText,
    translateText,
    improveText,
    generateText,
    developIdea
} from '@/ai/flows';
import type { Bookmark, Folder, Space, AIWorkspace, AnalyzeSpaceInput, AnalyzeSpaceOutput, ChatInSpaceInput, ChatInSpaceOutput, ChatMessage, AISpace, AIBookmark, AISpaceItem, AIFolder, DevelopIdeaInput, DevelopIdeaOutput, IdeaPayload } from '@/lib/types';
import { addBookmarkFromLibraryAction } from './items';
import { createSpaceAction } from './spaces';
import { revalidateAndGetClient } from './utils';
import { bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { recordToSpace, recordToSpaceItem } from './utils';
import { format } from 'date-fns';

// ===== AI Workspace Generation Actions =====

export async function generateWorkspaceAction(prompt: string): Promise<AIWorkspace> {
    if (!prompt) {
        throw new Error("Il prompt non può essere vuoto.");
    }
    try {
        const json = JSON.parse(prompt);
        if (json.spaces) {
            return json as AIWorkspace;
        }
    } catch (e) {
        // Not a valid JSON
    }

    try {
        const result = await generateWorkspace({ prompt });
        return result;
    } catch (e) {
        console.error("Impossibile generare lo spazio di lavoro dal prompt", e);
        throw new Error("L'IA non è riuscita a generare uno spazio di lavoro. Prova un prompt diverso.");
    }
}

async function createBookmarkFromAI(aiBookmark: AIBookmark, spaceId: string, parentId: string | null): Promise<Bookmark> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    let summary = 'Segnalibro generato dall\'IA.';
    try {
        const result = await summarizeBookmark({ url: aiBookmark.url });
        summary = result.summary;
    } catch (e) {
        console.warn(`Impossibile generare il riassunto per ${aiBookmark.url}:`, e);
    }

    const bookmarkData = {
        tool: {
            type: 'bookmark',
            title: aiBookmark.title,
            url: aiBookmark.url,
            summary,
            icon: aiBookmark.icon,
            spaceId,
            parentId,
        },
        user: pb.authStore.model!.id,
    };
    const record = await pb.collection(bookmarksCollectionName).create(bookmarkData);
    const newBookmark = recordToSpaceItem(record);
    if (newBookmark?.type !== 'bookmark') {
      throw new Error("Failed to create bookmark from AI data");
    }
    return newBookmark;
}

export async function createWorkspaceFromJsonAction(workspace: AIWorkspace): Promise<{ newSpaces: Space[], newItems: (Bookmark | Folder)[] }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
    
    const newSpaces: Space[] = [];
    const newItems: (Bookmark|Folder)[] = [];

    for (const aiSpace of workspace.spaces) {
        const newSpace = await createSpaceAction({
            name: aiSpace.name,
            icon: aiSpace.icon,
        });
        newSpaces.push(newSpace);

        for (const aiItem of aiSpace.items) {
            if (aiItem.type === 'bookmark') {
                const newBookmark = await createBookmarkFromAI(aiItem, newSpace.id, null);
                newItems.push(newBookmark);
            } else if (aiItem.type === 'folder') {
                const folderData = {
                    tool: { type: 'folder', name: aiItem.name, spaceId: newSpace.id, parentId: null },
                    user: pb.authStore.model!.id,
                };
                const folderRecord = await pb.collection(bookmarksCollectionName).create(folderData);
                const newFolder = recordToSpaceItem(folderRecord) as Folder;
                newItems.push(newFolder);

                for (const aiBookmark of aiItem.items) {
                    const newBookmarkInFolder = await createBookmarkFromAI(aiBookmark, newSpace.id, newFolder.id);
                    newItems.push(newBookmarkInFolder);
                }
            }
        }
    }

    return { newSpaces, newItems };
}

export async function createWorkspaceFromIdeaAction(payload: IdeaPayload, conversation: ChatMessage[]): Promise<Space> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    // 1. Create the new space
    const newSpace = await createSpaceAction({
        name: payload.spaceName,
        icon: payload.spaceIcon,
        category: 'Idee Sviluppate'
    });

    // 2. Create the tasks note
    const tasksContent = `# Task per ${payload.spaceName}\n\n` + payload.tasks.map(task => `- [ ] ${task}`).join('\n');
    const taskNoteData = {
        tool: {
            type: 'bookmark',
            title: 'Piano d\'Azione e Task',
            url: `devzen:text-note:${Date.now()}-tasks`,
            summary: tasksContent,
            spaceId: newSpace.id,
            icon: 'ClipboardCheck',
        },
        user: pb.authStore.model!.id,
    };
    await pb.collection(bookmarksCollectionName).create(taskNoteData);
    
    // 3. Create the conversation note
    await saveChatAsNoteAction({ spaceId: newSpace.id, messages: conversation, titlePrefix: 'Brainstorming Idea' });

    // 4. Create bookmarks for suggested tools
    for (const tool of payload.suggestedTools) {
        await createBookmarkFromAI(tool, newSpace.id, null);
    }

    return newSpace;
}

export async function exportWorkspaceAction(spaceIds: string[]): Promise<string> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const workspace: AIWorkspace = { spaces: [] };

    for (const spaceId of spaceIds) {
        const spaceRecord = await pb.collection(spacesCollectionName).getOne(spaceId, { filter: `user = "${pb.authStore.model!.id}"` });
        const spaceItems = await pb.collection(bookmarksCollectionName).getFullList({
            filter: `user = "${pb.authStore.model!.id}" && tool.spaceId = "${spaceId}"`
        });

        const items: AISpaceItem[] = [];
        const foldersMap = new Map<string, AIFolder>();

        spaceItems.forEach(item => {
            if (item.tool.type === 'folder') {
                const folder: AIFolder = {
                    type: 'folder',
                    name: item.tool.name,
                    items: []
                };
                foldersMap.set(item.id, folder);
                if (!item.tool.parentId) {
                  items.push(folder);
                }
            }
        });
        
        spaceItems.forEach(item => {
            if (item.tool.type === 'bookmark') {
                const bookmark: AIBookmark = {
                    type: 'bookmark',
                    title: item.tool.title,
                    url: item.tool.url,
                    icon: item.tool.icon
                };
                if (item.tool.parentId && foldersMap.has(item.tool.parentId)) {
                    foldersMap.get(item.tool.parentId)!.items.push(bookmark);
                } else {
                    items.push(bookmark);
                }
            }
        });

        const aiSpace: AISpace = {
            name: spaceRecord.name,
            icon: spaceRecord.icon,
            items: items
        };
        workspace.spaces.push(aiSpace);
    }
    
    return JSON.stringify(workspace, null, 2);
}

// ===== AI Helper Actions =====

export async function suggestSpaceForUrlAction(url: string, spaces: Space[]): Promise<string> {
  if (!url || spaces.length === 0) {
    throw new Error('URL o spazi mancanti per la categorizzazione.');
  }
  const result = await categorizeBookmark({ url, spaces });
  return result.spaceId;
}

export async function smartSearchAction(query: string, bookmarks: Bookmark[]): Promise<string[]> {
    if (!query) return bookmarks.map(b => b.id);
    const result = await smartSearch({ query, bookmarks });
    return result.relevantBookmarkIds;
}

export async function analyzeSpaceAction(input: AnalyzeSpaceInput): Promise<AnalyzeSpaceOutput> {
    const result = await analyzeSpace(input);
    return result;
}

export async function chatInSpaceAction(input: ChatInSpaceInput): Promise<ChatInSpaceOutput> {
    const result = await chatInSpace(input);
    return result;
}

export async function saveChatAsNoteAction({ spaceId, messages, titlePrefix = 'Nota Chat' }: { spaceId: string, messages: ChatMessage[], titlePrefix?: string }): Promise<Bookmark> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const title = `${titlePrefix} - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
  const content = JSON.stringify(messages);
  const url = `devzen:note:${Date.now()}`;

  const data = {
    tool: {
      type: 'bookmark',
      title: title,
      url: url,
      summary: content,
      spaceId: spaceId,
      icon: 'FileText',
    },
    user: pb.authStore.model!.id,
  };

  try {
    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newNote = recordToSpaceItem(record);
    if (!newNote || newNote.type !== 'bookmark') {
      throw new Error('Impossibile creare o mappare la nota dal nuovo record.');
    }
    return newNote as Bookmark;
  } catch (e) {
    console.error('Impossibile creare la nota in PocketBase', e);
    throw new Error('Impossibile salvare la nota della chat.');
  }
}

// ===== Text Editor AI Actions =====
export async function correctTextAction(text: string): Promise<string> {
    return await correctText(text);
}
export async function summarizeTextAction(text: string): Promise<string> {
    return await summarizeText(text);
}
export async function translateTextAction(text: string, language: string): Promise<string> {
    return await translateText(text, language);
}
export async function improveTextAction(text: string): Promise<string> {
    return await improveText(text);
}
export async function generateTextAction(prompt: string): Promise<string> {
    return await generateText(prompt);
}

// ===== Idea Development AI Action =====
export async function developIdeaAction(input: DevelopIdeaInput): Promise<DevelopIdeaOutput> {
    return await developIdea(input);
}


// ===== Sharing Actions =====
export async function sendWebhookAction(url: string, data: any): Promise<{ success: boolean }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2),
    });

    if (!response.ok) {
      throw new Error(`La richiesta al Webhook è fallita con stato ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Errore invio Webhook:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Si è verificato un errore sconosciuto durante l\'invio del webhook.');
  }
}
