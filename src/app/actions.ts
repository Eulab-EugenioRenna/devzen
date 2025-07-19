'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import { generateWorkspace } from '@/ai/flows/generate-workspace';
import { categorizeBookmark } from '@/ai/flows/categorize-bookmark';
import { smartSearch } from '@/ai/flows/smart-search';
import { analyzeSpace } from '@/ai/flows/analyze-space';
import type { Bookmark, Folder, Space, SpaceItem, AppInfo, ToolsAi, AIWorkspace, AIBookmark, AnalyzeSpaceInput, AnalyzeSpaceOutput, AISpace, AIFolder, AISpaceItem } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName, menuCollectionName, menuRecordId, toolsAiCollectionName } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';
import { recordToSpaceItem, recordToToolAi } from '@/lib/data-mappers';

// ===== Data Fetching Actions =====

function recordToSpace(record: RecordModel): Space {
    return {
        id: record.id,
        name: record.name,
        icon: record.icon,
    };
}

export async function getSpacesAction(): Promise<Space[]> {
  try {
    const records = await pb.collection(spacesCollectionName).getFullList({
      sort: 'created',
    });
    return records.map(recordToSpace);
  } catch (error: any) {
    console.error('Failed to fetch spaces:', error.response || error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${spacesCollectionName}" was not found. You can create some via the UI.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}

export async function getItemsAction(): Promise<SpaceItem[]> {
  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
    });
    return records.map(recordToSpaceItem).filter((item): item is SpaceItem => item !== null);
  } catch (error: any) {
    console.error('Failed to fetch items:', error.response || error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${bookmarksCollectionName}" was not found in your PocketBase instance. Please create it to store bookmarks and folders.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}


// ===== Bookmark & Folder Actions =====

export async function addBookmarkAction({
  title,
  url,
  spaceId,
  parentId,
}: {
  title: string;
  url: string;
  spaceId: string;
  parentId?: string | null;
}): Promise<Bookmark> {
  if (!title || !url || !spaceId) {
    throw new Error('Campi obbligatori mancanti');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error('URL fornito non valido.');
  }

  let summary: string;
  try {
    const result = await summarizeBookmark({ url: parsedUrl.href });
    summary = result.summary;
  } catch (e) {
    console.error('Impossibile creare segnalibro con riassunto', e);
    summary = 'Impossibile generare un riassunto per questo URL.';
  }

  const data = {
    tool: {
      type: 'bookmark',
      title,
      url: parsedUrl.href,
      summary,
      spaceId,
      parentId: parentId ?? null,
    },
  };

  try {
    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newBookmark = recordToSpaceItem(record);
    if (!newBookmark || newBookmark.type !== 'bookmark') {
      throw new Error('Impossibile creare o mappare il segnalibro dal nuovo record.');
    }
    return newBookmark as Bookmark;
  } catch (e) {
    console.error('Impossibile creare segnalibro in PocketBase', e);
    throw new Error('Impossibile salvare il segnalibro.');
  }
}

export async function updateBookmarkAction({
  id,
  title,
  url,
}: {
  id: string;
  title: string;
  url: string;
}): Promise<Bookmark> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  
  let summary = record.tool.summary;
  if(record.tool.url !== url) {
     try {
        const result = await summarizeBookmark({ url });
        summary = result.summary;
      } catch (e) {
        console.error('Impossibile aggiornare il riassunto', e);
        summary = 'Impossibile generare un riassunto per questo nuovo URL.';
      }
  }

  const data = {
    tool: {
      ...record.tool,
      title,
      url,
      summary,
    },
  };

  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  const updatedBookmark = recordToSpaceItem(updatedRecord);
  if (!updatedBookmark || updatedBookmark.type !== 'bookmark') {
    throw new Error('Impossibile aggiornare o mappare il segnalibro dal record.');
  }
  return updatedBookmark as Bookmark;
}

export async function deleteItemAction({ id }: { id: string }): Promise<{ success: boolean }> {
  const itemToDelete = await pb.collection(bookmarksCollectionName).getOne(id);

  if (itemToDelete.tool.type === 'folder') {
    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `tool.parentId = "${id}"`,
    });

    const updatePromises = childBookmarks.map(bm => {
      const data = { tool: { ...bm.tool, parentId: null } };
      return pb.collection(bookmarksCollectionName).update(bm.id, data);
    });
    
    await Promise.all(updatePromises);
  }
  
  await pb.collection(bookmarksCollectionName).delete(id);
  return { success: true };
}

export async function createFolderAction({ spaceId, initialBookmarkIds }: { spaceId: string, initialBookmarkIds: string[] }): Promise<{ folder: Folder, bookmarks: Bookmark[] }> {
  const folderData = {
    tool: {
      type: 'folder',
      name: 'Nuova Cartella',
      spaceId: spaceId,
      parentId: null,
    },
  };

  const folderRecord = await pb.collection(bookmarksCollectionName).create(folderData);
  const newFolderUnchecked = recordToSpaceItem(folderRecord);

  if (!newFolderUnchecked || newFolderUnchecked.type !== 'folder') {
    await pb.collection(bookmarksCollectionName).delete(folderRecord.id).catch(e => console.error("Impossibile pulire il record della cartella non valido dopo l'errore di creazione.", e));
    throw new Error('Impossibile creare o mappare la nuova cartella dal record.');
  }
  const newFolder = newFolderUnchecked as Folder;

  const updatePromises = initialBookmarkIds.map(async (bookmarkId) => {
    const record = await pb.collection(bookmarksCollectionName).getOne(bookmarkId);
    const data = { tool: { ...record.tool, parentId: newFolder.id } };
    return pb.collection(bookmarksCollectionName).update(bookmarkId, data);
  });
  
  const updatedRecords = await Promise.all(updatePromises);
  const updatedBookmarks = updatedRecords
    .map(recordToSpaceItem)
    .filter((item): item is Bookmark => !!item && item.type === 'bookmark');

  return { folder: newFolder, bookmarks: updatedBookmarks };
}

export async function updateFolderNameAction({ id, name }: { id: string, name: string }): Promise<Folder> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  const data = { tool: { ...record.tool, name } };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  const updatedFolder = recordToSpaceItem(updatedRecord);
  if (!updatedFolder || updatedFolder.type !== 'folder') {
      throw new Error('Impossibile aggiornare il nome della cartella o mappare il record.');
  }
  return updatedFolder as Folder;
}


export async function moveItemAction({ id, newSpaceId, newParentId }: { id: string, newSpaceId?: string, newParentId?: string | null }): Promise<SpaceItem> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  const tool = { ...record.tool };

  if (newSpaceId) {
    tool.spaceId = newSpaceId;
    tool.parentId = null; 
  }
  
  if (newParentId !== undefined) {
    tool.parentId = newParentId;
  }
  
  const data = { tool };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  const updatedItem = recordToSpaceItem(updatedRecord);
  if (!updatedItem) {
    throw new Error('Impossibile spostare o mappare l\'elemento.');
  }
  return updatedItem;
}

export async function customizeItemAction({ id, backgroundColor, textColor, icon, iconUrl, iconColor }: { id: string, backgroundColor: string, textColor: string, icon?: string, iconUrl?: string, iconColor?: string }): Promise<SpaceItem> {
    const record = await pb.collection(bookmarksCollectionName).getOne(id);
    const tool = { ...record.tool, backgroundColor, textColor };

    if (icon !== undefined) {
      (tool as any).icon = icon;
    }
    if (iconUrl !== undefined) {
        (tool as any).iconUrl = iconUrl;
    }
    if (iconColor !== undefined) {
        (tool as any).iconColor = iconColor;
    }

    const data = { tool };
    const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
    const updatedItem = recordToSpaceItem(updatedRecord);
    if (!updatedItem) {
        throw new Error('Impossibile personalizzare o mappare l\'elemento.');
    }
    return updatedItem;
}

// ===== Azioni Spazio =====

export async function createSpaceAction(data: { name: string, icon: string }): Promise<Space> {
    const record = await pb.collection(spacesCollectionName).create(data);
    return recordToSpace(record);
}

export async function updateSpaceAction({ id, data }: { id: string, data: { name: string, icon: string } }): Promise<Space> {
    const record = await pb.collection(spacesCollectionName).update(id, data);
    return recordToSpace(record);
}

export async function deleteSpaceAction({ id }: { id: string }): Promise<{ success: boolean }> {
    const itemsInSpace = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `tool.spaceId = "${id}"`,
    });

    const deletePromises = itemsInSpace.map(item => pb.collection(bookmarksCollectionName).delete(item.id));
    await Promise.all(deletePromises);

    await pb.collection(spacesCollectionName).delete(id);

    return { success: true };
}

// ===== Azioni Info App =====

function recordToAppInfo(record: RecordModel): AppInfo {
    const logoUrl = record.logo ? pb.files.getUrl(record, record.logo) : '';
    return {
        id: record.id,
        title: record.title,
        logo: logoUrl,
    };
}

export async function getAppInfoAction(): Promise<AppInfo> {
    try {
        const record = await pb.collection(menuCollectionName).getOne(menuRecordId);
        return recordToAppInfo(record);
    } catch (e: any) {
        if (e.status === 404) {
             console.warn(`Record info app con ID "${menuRecordId}" non trovato nella collezione "${menuCollectionName}". Assicurati che questo record esista. Ritorno ai valori predefiniti.`);
        } else {
             console.error('Impossibile recuperare le info dell\'app:', e.response || e);
             if (e?.originalError) {
                console.error('Errore di connessione sottostante:', e.originalError);
           }
        }
        return { id: menuRecordId, title: 'DevZen', logo: 'Logo' };
    }
}

export async function updateAppInfoAction(id: string, formData: FormData): Promise<AppInfo> {
    const record = await pb.collection(menuCollectionName).update(id, formData);
    return recordToAppInfo(record);
}

// ===== Azioni Libreria Strumenti AI =====

export async function getToolsAiAction(): Promise<ToolsAi[]> {
  try {
    const records = await pb.collection(toolsAiCollectionName).getFullList({
      filter: 'deleted = false',
    });
    return records.map(recordToToolAi).filter((tool): tool is ToolsAi => tool !== null);
  } catch (error) {
    console.error("Impossibile recuperare la libreria di strumenti AI sul server:", error);
    return [];
  }
}

export async function addBookmarkFromLibraryAction({
  toolId,
  spaceId,
}: {
  toolId: string;
  spaceId: string;
}): Promise<Bookmark> {
  if (!toolId || !spaceId) {
    throw new Error('Campi obbligatori mancanti');
  }

  const toolRecord = await pb.collection(toolsAiCollectionName).getOne(toolId);
  
  const tool: ToolsAi | null = recordToToolAi(toolRecord);
  if (!tool) {
    throw new Error('Lo strumento di libreria selezionato ha dati non validi.');
  }

  const data = {
    tool: {
      type: 'bookmark',
      title: tool.name,
      url: tool.link,
      summary: tool.summary.summary,
      spaceId: spaceId,
      parentId: null,
    },
  };

  try {
    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newBookmark = recordToSpaceItem(record);
    if (!newBookmark || newBookmark.type !== 'bookmark') {
      throw new Error('Impossibile creare o mappare il segnalibro dallo strumento di libreria.');
    }
    return newBookmark as Bookmark;
  } catch (e) {
    console.error('Impossibile creare segnalibro dalla libreria in PocketBase', e);
    throw new Error('Impossibile salvare il segnalibro dalla libreria.');
  }
}

// ===== Azioni Generazione Spazio di Lavoro AI =====

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

export async function createWorkspaceFromJsonAction(workspace: AIWorkspace): Promise<{ newSpaces: Space[], newItems: SpaceItem[] }> {
    const newSpaces: Space[] = [];
    const newItems: SpaceItem[] = [];

    for (const aiSpace of workspace.spaces) {
        const spaceRecord = await pb.collection(spacesCollectionName).create({
            name: aiSpace.name,
            icon: aiSpace.icon,
        });
        const newSpace = recordToSpace(spaceRecord);
        newSpaces.push(newSpace);

        for (const aiItem of aiSpace.items) {
            if (aiItem.type === 'bookmark') {
                const newBookmark = await createBookmarkFromAI(aiItem, newSpace.id, null);
                newItems.push(newBookmark);
            } else if (aiItem.type === 'folder') {
                const folderData = {
                    tool: { type: 'folder', name: aiItem.name, spaceId: newSpace.id, parentId: null }
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

async function createBookmarkFromAI(aiBookmark: AIBookmark, spaceId: string, parentId: string | null): Promise<Bookmark> {
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
    };
    const record = await pb.collection(bookmarksCollectionName).create(bookmarkData);
    return recordToSpaceItem(record) as Bookmark;
}


export async function exportWorkspaceAction(spaceIds: string[]): Promise<string> {
    const workspace: AIWorkspace = { spaces: [] };

    for (const spaceId of spaceIds) {
        const spaceRecord = await pb.collection(spacesCollectionName).getOne(spaceId);
        const spaceItems = await pb.collection(bookmarksCollectionName).getFullList({
            filter: `tool.spaceId = "${spaceId}"`
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
                items.push(folder);
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
            items: items.filter(item => !(item.type === 'folder' && item.items.length === 0) || items.some(i => i.type === 'bookmark' && !i.parentId))
        };
        workspace.spaces.push(aiSpace);
    }
    
    return JSON.stringify(workspace, null, 2);
}

// ===== Nuove Azioni AI =====

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
