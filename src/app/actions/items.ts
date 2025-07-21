
'use server';

import { ai } from '@/ai/genkit';
import { summarizeBookmark, discernInput } from '@/ai/flows';
import { pb, bookmarksCollectionName, spacesCollectionName, toolsAiCollectionName } from '@/lib/pocketbase';
import type { Bookmark, Folder, SpaceItem, ToolsAi } from '@/lib/types';
import { revalidateAndGetClient } from './utils';
import { recordToSpaceItem, recordToToolAi } from './utils';

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
      const pageInfo = await ai.generate({
          prompt: `Estrai il titolo dalla pagina web a questo URL: ${parsedUrl.href}. Restituisci solo il testo del titolo.`,
      });
      title = pageInfo.text;
      summary = result.summary;
    } catch (e) {
      console.error('Impossibile creare segnalibro con riassunto', e);
      summary = 'Impossibile generare un riassunto per questo URL.';
      title = parsedUrl.hostname;
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
    const lines = text.trim().split('\n');
    const title = lines[0];
    const content = lines.slice(1).join('\n');
    const url = `devzen:text-note:${Date.now()}`;

    const data = {
      tool: {
        type: 'bookmark',
        title: title,
        url: url,
        summary: content,
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

  if (itemToDelete.tool.type === 'folder') {
    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${id}"`,
    });

    for (const bm of childBookmarks) {
      const recordToUpdate = await pb.collection(bookmarksCollectionName).getOne(bm.id);
      const newToolData = { ...recordToUpdate.tool, parentId: null };
      await pb.collection(bookmarksCollectionName).update(recordToUpdate.id, { tool: newToolData, user: pb.authStore.model!.id });
    }
  } else if (itemToDelete.tool.type === 'space-link' && itemToDelete.tool.linkedSpaceId) {
    try {
        await pb.collection(spacesCollectionName).update(itemToDelete.tool.linkedSpaceId, { isLink: false, user: pb.authStore.model!.id });
    } catch (e) {
        console.error(`Failed to update original space ${itemToDelete.tool.linkedSpaceId} when deleting link ${id}. It might already be deleted.`, e);
    }
  }
  
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
        await pb.collection(bookmarksCollectionName).delete(folderRecord.id).catch(e => console.error("Failed to cleanup invalid folder record.", e));
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
    toolChanges.parentId = null;
    
    if (record.tool.type === 'folder') {
      const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${id}"`,
      });

      for (const bm of childBookmarks) {
        const recordToUpdate = await pb.collection(bookmarksCollectionName).getOne(bm.id);
        const newToolData = { ...recordToUpdate.tool, spaceId: newSpaceId };
        await pb.collection(bookmarksCollectionName).update(bm.id, { tool: newToolData, user: pb.authStore.model!.id });
      }
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
    const tool = { ...record.tool, backgroundColor, textColor, icon, iconUrl, iconColor };

    const data = { tool, user: pb.authStore.model!.id };
    const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
    const updatedItem = recordToSpaceItem(updatedRecord);
    if (!updatedItem) {
        throw new Error('Impossibile personalizzare o mappare l\'elemento.');
    }
    return updatedItem;
}

export async function duplicateItemAction(item: SpaceItem): Promise<SpaceItem> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

  const newToolData = { ...item };
  if ('title' in newToolData) newToolData.title = `${newToolData.title} (Copia)`;
  if ('name' in newToolData) newToolData.name = `${newToolData.name} (Copia)`;
  delete newToolData.id;

  const dataToCreate = {
      tool: newToolData,
      user: pb.authStore.model!.id,
  };

  if (item.type === 'folder') {
    const folderRecord = await pb.collection(bookmarksCollectionName).create(dataToCreate);
    const newFolder = recordToSpaceItem(folderRecord) as Folder;

    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `user = "${pb.authStore.model!.id}" && tool.parentId = "${item.id}"`,
    });

    for (const bookmark of childBookmarks) {
      const newBookmarkData = {
        tool: {
          ...bookmark.tool,
          parentId: newFolder.id,
        },
        user: pb.authStore.model!.id,
      };
      await pb.collection(bookmarksCollectionName).create(newBookmarkData);
    }
    return newFolder;
  }

  if (item.type === 'bookmark' || item.type === 'space-link') {
    const record = await pb.collection(bookmarksCollectionName).create(dataToCreate);
    return recordToSpaceItem(record)!;
  }
  
  throw new Error("Tipo di elemento non supportato per la duplicazione");
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

// ===== AI Tool Library Actions =====

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

export async function batchImportToolsAction(tools: { name: string; link: string }[]): Promise<{ success: boolean; count: number }> {
  try {
    const response = await fetch('https://ai-tool.eulab.cloud/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tools }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`La richiesta API è fallita con stato ${response.status}: ${errorData}`);
    }
    
    const result = await response.json();
    return { success: true, count: result.count || tools.length };
  } catch (error) {
    console.error('Errore durante l\'importazione batch degli strumenti:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Si è verificato un errore sconosciuto durante l\'importazione.');
  }
}
