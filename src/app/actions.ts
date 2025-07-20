
'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import { generateWorkspace } from '@/ai/flows/generate-workspace';
import { categorizeBookmark } from '@/ai/flows/categorize-bookmark';
import { smartSearch } from '@/ai/flows/smart-search';
import { analyzeSpace } from '@/ai/flows/analyze-space';
import { chatInSpace } from '@/ai/flows/chat-in-space';
import { discernInput } from '@/ai/flows/discern-input';
import {
    correctText,
    summarizeText,
    translateText,
    improveText,
    generateText,
} from '@/ai/flows/text-tools';
import type { Bookmark, Folder, Space, SpaceItem, AppInfo, ToolsAi, AIWorkspace, AIBookmark, AnalyzeSpaceInput, AnalyzeSpaceOutput, AISpace, AIFolder, AISpaceItem, SpaceLink, ChatInSpaceInput, ChatInSpaceOutput, ChatMessage } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName, menuCollectionName, toolsAiCollectionName, usersCollectionName } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';
import { recordToSpaceItem, recordToToolAi } from '@/lib/data-mappers';
import { format } from 'date-fns';
import { cookies } from 'next/headers';

async function revalidateAndGetClient() {
    const cookie = cookies().get('pb_auth');
    if (cookie) {
        pb.authStore.loadFromCookie(cookie.value);
    }
    if (!pb.authStore.isValid && cookie) {
        pb.authStore.clear();
    }
    return pb;
}


// ===== Data Fetching Actions =====

function recordToSpace(record: RecordModel): Space {
    return {
        id: record.id,
        name: record.name,
        icon: record.icon,
        category: record.category,
        isLink: record.isLink || false,
    };
}

export async function getSpacesAction(): Promise<Space[]> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) return [];
  try {
    const records = await pb.collection(spacesCollectionName).getFullList({
      sort: 'created',
      filter: `user = "${pb.authStore.model!.id}"`,
    });
    return records.map(recordToSpace);
  } catch (error: any) {
    console.error('Failed to fetch spaces:', error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${spacesCollectionName}" was not found. You can create some via the UI.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}

export async function getItemsAction(): Promise<SpaceItem[]> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) return [];
  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
      filter: `user = "${pb.authStore.model!.id}"`,
    });
    return records.map(recordToSpaceItem).filter((item): item is SpaceItem => item !== null);
  } catch (error: any) {
    console.error('Failed to fetch items:', error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${bookmarksCollectionName}" was not found in your PocketBase instance. Please create it to store bookmarks and folders.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}


// ===== Bookmark & Folder Actions =====
export async function addBookmarkOrNoteAction({
  text,
  spaceId,
  parentId,
}: {
  text: string;
  spaceId: string;
  parentId?: string | null;
}): Promise<Bookmark> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  if (!text || !spaceId) {
    throw new Error('Campi obbligatori mancanti');
  }

  const inputType = await discernInput(text);

  if (inputType === 'url') {
    // It's a URL, create a bookmark
    let url = text;
    if (!/^(https?:\/\/)/i.test(url)) {
      url = `https://${url}`;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error('URL fornito non valido.');
    }

    let summary: string;
    let title: string = '';
    try {
      const result = await summarizeBookmark({ url: parsedUrl.href });
      // The model we are using for summarization can also extract the title
      const pageInfo = await ai.generate({
          prompt: `Estrai il titolo dalla pagina web a questo URL: ${parsedUrl.href}. Restituisci solo il testo del titolo.`,
      });
      title = pageInfo.text;
      summary = result.summary;
    } catch (e) {
      console.error('Impossibile creare segnalibro con riassunto', e);
      summary = 'Impossibile generare un riassunto per questo URL.';
      title = parsedUrl.hostname; // Fallback title
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
      user: pb.authStore.model!.id,
    };

    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newBookmark = recordToSpaceItem(record);
    if (!newBookmark || newBookmark.type !== 'bookmark') {
      throw new Error('Impossibile creare o mappare il segnalibro dal nuovo record.');
    }
    return newBookmark as Bookmark;
  } else {
    // It's a Note, create a text note
    const lines = text.trim().split('\n');
    const title = lines[0];
    const content = lines.slice(1).join('\n');
    const url = `devzen:text-note:${Date.now()}`;

    const data = {
      tool: {
        type: 'bookmark',
        title: title,
        url: url,
        summary: content, // The markdown content is stored in the summary
        spaceId: spaceId,
        icon: 'NotebookPen',
      },
      user: pb.authStore.model!.id,
    };
    
    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newNote = recordToSpaceItem(record);
    if (!newNote || newNote.type !== 'bookmark') {
      throw new Error('Impossibile creare o mappare la nota dal nuovo record.');
    }
    return newNote as Bookmark;
  }
}


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
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

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
    user: pb.authStore.model!.id,
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
  summary,
}: {
  id: string;
  title: string;
  url: string;
  summary?: string;
}): Promise<Bookmark> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
  
  const record = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
  
  let newSummary = summary ?? record.tool.summary;
  
  const isNote = record.tool.url.startsWith('devzen:');
  if(!isNote && record.tool.url !== url) {
     try {
        const result = await summarizeBookmark({ url });
        newSummary = result.summary;
      } catch (e) {
        console.error('Impossibile aggiornare il riassunto', e);
        newSummary = 'Impossibile generare un riassunto per questo nuovo URL.';
      }
  } else if (isNote) {
    // For notes, the summary is the content passed from the editor.
    newSummary = summary ?? record.tool.summary;
  }


  const data = {
    tool: {
      ...record.tool,
      title,
      url,
      summary: newSummary,
    },
    user: pb.authStore.model!.id,
  };

  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  const updatedBookmark = recordToSpaceItem(updatedRecord);
  if (!updatedBookmark || updatedBookmark.type !== 'bookmark') {
    throw new Error('Impossibile aggiornare o mappare il segnalibro dal record.');
  }
  return updatedBookmark as Bookmark;
}

export async function deleteItemAction({ id }: { id: string }): Promise<{ success: boolean }> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const itemToDelete = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
  const toolData = itemToDelete.tool as any;

  if (toolData.type === 'folder') {
    // If it's a folder, find all children and move them to the root of the space
    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${id}"`,
    });

    const updatePromises = childBookmarks.map(async (bm) => {
      const recordToUpdate = await pb.collection(bookmarksCollectionName).getOne(bm.id);
      const newToolData = { ...recordToUpdate.tool, parentId: null };
      return pb.collection(bookmarksCollectionName).update(recordToUpdate.id, { tool: newToolData, user: pb.authStore.model!.id });
    });
    
    await Promise.all(updatePromises);
  } else if (toolData.type === 'space-link' && toolData.linkedSpaceId) {
    // If it's a space link, update the original space to no longer be a link
    try {
        await pb.collection(spacesCollectionName).update(toolData.linkedSpaceId, { isLink: false, user: pb.authStore.model!.id });
    } catch (e) {
        console.error(`Failed to update original space ${toolData.linkedSpaceId} when deleting link ${id}. It might already be deleted.`, e);
        // We can continue to delete the link itself even if the original space is gone.
    }
  }
  
  // Finally, delete the item itself
  await pb.collection(bookmarksCollectionName).delete(id);
  return { success: true };
}

export async function createFolderAction({ spaceId, initialBookmarkIds }: { spaceId: string, initialBookmarkIds: string[] }): Promise<{ folder: Folder, bookmarks: Bookmark[] }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const folderData = {
        tool: {
            type: 'folder',
            name: 'Nuova Cartella',
            spaceId: spaceId,
            parentId: null,
        },
        user: pb.authStore.model!.id,
    };

    const folderRecord = await pb.collection(bookmarksCollectionName).create(folderData);
    const newFolderUnchecked = recordToSpaceItem(folderRecord);

    if (!newFolderUnchecked || newFolderUnchecked.type !== 'folder') {
        await pb.collection(bookmarksCollectionName).delete(folderRecord.id).catch(e => console.error("Impossibile pulire il record della cartella non valido dopo l'errore di creazione.", e));
        throw new Error('Impossibile creare o mappare la nuova cartella dal record.');
    }
    const newFolder = newFolderUnchecked as Folder;

    const updatePromises = initialBookmarkIds.map(async (bookmarkId) => {
        const recordToUpdate = await pb.collection(bookmarksCollectionName).getOne(bookmarkId);
        const newToolData = { ...recordToUpdate.tool, parentId: newFolder.id };
        return pb.collection(bookmarksCollectionName).update(bookmarkId, { tool: newToolData, user: pb.authStore.model!.id });
    });

    const updatedRecords = await Promise.all(updatePromises);
    const updatedBookmarks = updatedRecords
        .map(recordToSpaceItem)
        .filter((item): item is Bookmark => !!item && item.type === 'bookmark');

    return { folder: newFolder, bookmarks: updatedBookmarks };
}


export async function updateFolderNameAction({ id, name }: { id: string, name: string }): Promise<Folder> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const record = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
  const data = { tool: { ...record.tool, name }, user: pb.authStore.model!.id };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  const updatedFolder = recordToSpaceItem(updatedRecord);
  if (!updatedFolder || updatedFolder.type !== 'folder') {
      throw new Error('Impossibile aggiornare il nome della cartella o mappare il record.');
  }
  return updatedFolder as Folder;
}


export async function moveItemAction({ id, newSpaceId, newParentId }: { id: string, newSpaceId?: string, newParentId?: string | null }): Promise<SpaceItem> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const record = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
  
  const toolChanges: any = {};

  if (newSpaceId) {
    toolChanges.spaceId = newSpaceId;
    // When moving to a new space, always reset the parent folder.
    toolChanges.parentId = null;
    
    // If the item being moved is a folder, also move all its children.
    if (record.tool.type === 'folder') {
      const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${id}"`,
      });

      const updatePromises = childBookmarks.map(async (bm) => {
        const recordToUpdate = await pb.collection(bookmarksCollectionName).getOne(bm.id);
        const newToolData = { ...recordToUpdate.tool, spaceId: newSpaceId };
        return pb.collection(bookmarksCollectionName).update(bm.id, { tool: newToolData, user: pb.authStore.model!.id });
      });
      await Promise.all(updatePromises);
    }
  }
  
  if (newParentId !== undefined) {
    toolChanges.parentId = newParentId;
  }
  
  const updatedTool = { ...record.tool, ...toolChanges };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, { tool: updatedTool, user: pb.authStore.model!.id });
  const updatedItem = recordToSpaceItem(updatedRecord);
  if (!updatedItem) {
    throw new Error('Impossibile spostare o mappare l\'elemento.');
  }
  return updatedItem;
}

export async function customizeItemAction({ id, backgroundColor, textColor, icon, iconUrl, iconColor }: { id: string, backgroundColor: string, textColor: string, icon?: string, iconUrl?: string, iconColor?: string }): Promise<SpaceItem> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
    
    const record = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
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

    const data = { tool, user: pb.authStore.model!.id };
    const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
    const updatedItem = recordToSpaceItem(updatedRecord);
    if (!updatedItem) {
        throw new Error('Impossibile personalizzare o mappare l\'elemento.');
    }
    return updatedItem;
}

// ===== Azioni Spazio =====

export async function createSpaceAction(data: { name: string, icon: string, category?: string }): Promise<Space> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const spaceData = { ...data, user: pb.authStore.model!.id };
    const record = await pb.collection(spacesCollectionName).create(spaceData);
    return recordToSpace(record);
}

export async function updateSpaceAction({ id, data }: { id: string, data: { name: string, icon: string, category?: string, isLink?: boolean } }): Promise<Space> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const record = await pb.collection(spacesCollectionName).update(id, { ...data, user: pb.authStore.model!.id });
    return recordToSpace(record);
}

export async function deleteSpaceAction({ id }: { id: string }): Promise<{ success: boolean }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    // 1. Find and delete any space-links that point TO this space
    const incomingLinks = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.type = "space-link" && tool.linkedSpaceId = "${id}"`,
    });
    const deleteIncomingLinksPromises = incomingLinks.map(item => pb.collection(bookmarksCollectionName).delete(item.id));
    await Promise.all(deleteIncomingLinksPromises);

    // 2. Find all items WITHIN this space, handle any outgoing space-links, and then delete all items.
    const itemsInSpace = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.spaceId = "${id}"`,
    });
    
    // 2a. Find any outgoing space-links and restore the original space by setting isLink=false
    const restoreSpacePromises = itemsInSpace
        .filter(item => item.tool.type === 'space-link' && item.tool.linkedSpaceId)
        .map(item => pb.collection(spacesCollectionName).update(item.tool.linkedSpaceId, { isLink: false, user: pb.authStore.model!.id }));
    await Promise.all(restoreSpacePromises);

    // 2b. Delete all items within the space
    const deleteItemsInSpacePromises = itemsInSpace.map(item => pb.collection(bookmarksCollectionName).delete(item.id));
    await Promise.all(deleteItemsInSpacePromises);

    // 3. Delete the space itself
    await pb.collection(spacesCollectionName).delete(id);

    return { success: true };
}

export async function createSpaceLinkAction(space: Space, targetSpaceId: string): Promise<SpaceLink> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
  
  const linkData = {
    tool: {
      type: 'space-link',
      name: space.name,
      icon: space.icon,
      linkedSpaceId: space.id,
      spaceId: targetSpaceId,
    },
    user: pb.authStore.model!.id,
  };
  
  const record = await pb.collection(bookmarksCollectionName).create(linkData);
  await pb.collection(spacesCollectionName).update(space.id, { isLink: true, user: pb.authStore.model!.id });

  const newLink = recordToSpaceItem(record);
  if (!newLink || newLink.type !== 'space-link') {
    throw new Error('Failed to create space link.');
  }
  return newLink as SpaceLink;
}

export async function unlinkSpaceAction({ id, linkedSpaceId }: { id: string, linkedSpaceId: string }): Promise<{ success: boolean }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    await pb.collection(bookmarksCollectionName).delete(id);
    await pb.collection(spacesCollectionName).update(linkedSpaceId, { isLink: false, user: pb.authStore.model!.id });
    return { success: true };
}

export async function duplicateItemAction(item: SpaceItem): Promise<SpaceItem> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  if (item.type === 'bookmark') {
    const newBookmarkData = {
      tool: {
        ...item,
        title: `${item.title} (Copia)`,
        id: undefined, // Let PB generate new ID
      },
      user: pb.authStore.model!.id,
    };
    delete newBookmarkData.tool.id;
    const record = await pb.collection(bookmarksCollectionName).create(newBookmarkData);
    return recordToSpaceItem(record)!;
  }

  if (item.type === 'folder' || item.type === 'space-link') {
    const newFolderData = {
      tool: {
        ...item,
        name: `${item.name} (Copia)`,
        id: undefined,
      },
      user: pb.authStore.model!.id,
    };
    delete newFolderData.tool.id;
    
    // For space-links, duplication just creates another link, it doesn't duplicate the space.
    if (newFolderData.tool.type === 'space-link') {
        const record = await pb.collection(bookmarksCollectionName).create(newFolderData);
        return recordToSpaceItem(record)!;
    }

    const folderRecord = await pb.collection(bookmarksCollectionName).create(newFolderData);
    const newFolder = recordToSpaceItem(folderRecord) as Folder;

    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${item.id}"`,
    });

    for (const bookmark of childBookmarks) {
      const newBookmarkData = {
        tool: {
          ...bookmark.tool,
          title: bookmark.tool.title,
          parentId: newFolder.id,
        },
        user: pb.authStore.model!.id,
      };
      await pb.collection(bookmarksCollectionName).create(newBookmarkData);
    }
    
    return newFolder;
  }
  
  throw new Error("Tipo di elemento non supportato per la duplicazione");
}


// ===== Azioni Info App =====

function recordToAppInfo(record: RecordModel): AppInfo {
    const logoUrl = record.logo ? pb.files.getUrl(record, record.logo) : '';
    return {
        id: record.id,
        title: record.title,
        logo: record.logo ? logoUrl : 'Logo', // Fallback to 'Logo' if no file is uploaded
    };
}

export async function getAppInfoAction(): Promise<AppInfo> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) {
      return { id: '', title: 'DevZen', logo: 'Logo' };
    }

    try {
        const records = await pb.collection(menuCollectionName).getFullList({
            filter: `user = "${pb.authStore.model!.id}"`,
            sort: '-created',
        });

        if (records.length > 0) {
            return recordToAppInfo(records[0]);
        }
        // If no record found for the user, return default.
        return { id: '', title: 'DevZen', logo: 'Logo' };
    } catch (e: any) {
        console.error('Impossibile recuperare le info dell\'app:', e);
        if (e.status === 404) {
             console.warn(`La collezione "${menuCollectionName}" non è stata trovata. Ritorno ai valori predefiniti.`);
        } else if (e?.originalError) {
           console.error('Errore di connessione sottostante:', e.originalError);
        }
        return { id: '', title: 'DevZen', logo: 'Logo' };
    }
}

export async function updateAppInfoAction(id: string, formData: FormData): Promise<AppInfo> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const data = formData;
    data.append('user', pb.authStore.model!.id);

    try {
      if (id) {
        // If an ID is provided, update the existing record
        const record = await pb.collection(menuCollectionName).update(id, data);
        return recordToAppInfo(record);
      } else {
        // If no ID, create a new record for this user
        const record = await pb.collection(menuCollectionName).create(data);
        return recordToAppInfo(record);
      }
    } catch (e) {
        console.error("Impossibile salvare le info dell'app", e);
        throw new Error("Impossibile salvare le impostazioni dell'app.");
    }
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
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

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
    user: pb.authStore.model!.id,
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
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
    
    const newSpaces: Space[] = [];
    const newItems: SpaceItem[] = [];

    for (const aiSpace of workspace.spaces) {
        const spaceRecord = await pb.collection(spacesCollectionName).create({
            name: aiSpace.name,
            icon: aiSpace.icon,
            user: pb.authStore.model!.id,
        });
        const newSpace = recordToSpace(spaceRecord);
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
    return recordToSpaceItem(record) as Bookmark;
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

export async function chatInSpaceAction(input: ChatInSpaceInput): Promise<ChatInSpaceOutput> {
    const result = await chatInSpace(input);
    return result;
}

export async function saveChatAsNoteAction({ spaceId, messages }: { spaceId: string, messages: ChatMessage[] }): Promise<Bookmark> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const title = `Nota Chat - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
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

export async function regenerateSummaryAction(id: string): Promise<Bookmark> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const record = await pb.collection(bookmarksCollectionName).getOne(id, { filter: `user = "${pb.authStore.model!.id}"` });
    if (!record || record.tool.type !== 'bookmark' || record.tool.url.startsWith('devzen:')) {
        throw new Error("Elemento non valido o non è un segnalibro valido per la rigenerazione.");
    }

    let summary: string;
    try {
        const result = await summarizeBookmark({ url: record.tool.url });
        summary = result.summary;
    } catch (e) {
        console.error('Impossibile rigenerare il riassunto', e);
        throw new Error('Impossibile generare un nuovo riassunto per questo URL.');
    }

    const data = {
        tool: {
            ...record.tool,
            summary: summary,
        },
        user: pb.authStore.model!.id,
    };

    const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
    const updatedBookmark = recordToSpaceItem(updatedRecord);
    if (!updatedBookmark || updatedBookmark.type !== 'bookmark') {
        throw new Error('Impossibile aggiornare o mappare il segnalibro dal record.');
    }
    return updatedBookmark as Bookmark;
}


// ===== Azioni AI per Editor di Testo =====
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

// ===== Azioni di Condivisione =====
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

    

    