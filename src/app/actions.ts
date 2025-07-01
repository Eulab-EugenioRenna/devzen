'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import type { Bookmark, Folder, Space, SpaceItem } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

function recordToSpaceItem(record: RecordModel): SpaceItem {
  const toolData = (record as any).tool;
  const baseItem = {
    id: record.id,
    spaceId: toolData.spaceId,
    parentId: toolData.parentId,
    backgroundColor: toolData.backgroundColor,
    textColor: toolData.textColor,
  };

  if (toolData.type === 'folder') {
    return {
      ...baseItem,
      type: 'folder',
      name: toolData.name,
      items: [], // This will be populated on the client side
    };
  }

  return {
    ...baseItem,
    type: 'bookmark',
    title: toolData.title,
    url: toolData.url,
    summary: toolData.summary,
  };
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
  if (!title || !url || !spaceId) {
    throw new Error('Missing required fields');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error('Invalid URL provided.');
  }

  let summary: string;
  try {
    const result = await summarizeBookmark({ url: parsedUrl.href });
    summary = result.summary;
  } catch (e) {
    console.error('Failed to create bookmark with summary', e);
    summary = 'Could not generate summary for this URL.';
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
    return recordToSpaceItem(record) as Bookmark;
  } catch (e) {
    console.error('Failed to create bookmark in PocketBase', e);
    throw new Error('Failed to save bookmark.');
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
        console.error('Failed to update summary', e);
        summary = 'Could not generate summary for this new URL.';
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
  return recordToSpaceItem(updatedRecord) as Bookmark;
}

export async function deleteItemAction({ id }: { id: string }): Promise<{ success: boolean, updatedBookmarks?: Bookmark[] }> {
  const itemToDelete = await pb.collection(bookmarksCollectionName).getOne(id);

  if (itemToDelete.tool.type === 'folder') {
    const childBookmarks = await pb.collection(bookmarksCollectionName).getFullList({
      filter: `tool.parentId = "${id}"`,
    });

    const updatePromises = childBookmarks.map(bm => {
      const data = { tool: { ...bm.tool, parentId: null } };
      return pb.collection(bookmarksCollectionName).update(bm.id, data);
    });
    
    const updatedRecords = await Promise.all(updatePromises);
    const updatedBookmarks = updatedRecords.map(recordToSpaceItem).filter(item => item.type === 'bookmark') as Bookmark[];
    
    await pb.collection(bookmarksCollectionName).delete(id);
    return { success: true, updatedBookmarks };

  } else {
    await pb.collection(bookmarksCollectionName).delete(id);
    return { success: true };
  }
}

export async function createFolderAction({ spaceId, initialBookmarkIds }: { spaceId: string, initialBookmarkIds: string[] }): Promise<{ folder: Folder, bookmarks: Bookmark[] }> {
  const folderData = {
    tool: {
      type: 'folder',
      name: 'New Folder',
      spaceId: spaceId,
      parentId: null,
    },
  };

  const folderRecord = await pb.collection(bookmarksCollectionName).create(folderData);
  const newFolder = recordToSpaceItem(folderRecord) as Folder;

  const updatePromises = initialBookmarkIds.map(async (bookmarkId) => {
    const record = await pb.collection(bookmarksCollectionName).getOne(bookmarkId);
    const data = { tool: { ...record.tool, parentId: newFolder.id } };
    return pb.collection(bookmarksCollectionName).update(bookmarkId, data);
  });
  
  const updatedRecords = await Promise.all(updatePromises);
  const updatedBookmarks = updatedRecords.map(recordToSpaceItem) as Bookmark[];

  return { folder: newFolder, bookmarks: updatedBookmarks };
}

export async function updateFolderNameAction({ id, name }: { id: string, name: string }): Promise<Folder> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  const data = { tool: { ...record.tool, name } };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  return recordToSpaceItem(updatedRecord) as Folder;
}


export async function moveItemAction({ id, newSpaceId, newParentId }: { id: string, newSpaceId?: string, newParentId?: string | null }): Promise<SpaceItem> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  const tool = { ...record.tool };

  if (newSpaceId) {
    tool.spaceId = newSpaceId;
    tool.parentId = null; // moving space resets parent
  }
  
  if (newParentId !== undefined) {
    tool.parentId = newParentId;
  }
  
  const data = { tool };
  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  return recordToSpaceItem(updatedRecord);
}

export async function updateItemColorsAction({ id, backgroundColor, textColor }: { id: string, backgroundColor: string, textColor: string }): Promise<SpaceItem> {
    const record = await pb.collection(bookmarksCollectionName).getOne(id);
    const data = { tool: { ...record.tool, backgroundColor, textColor } };
    const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
    return recordToSpaceItem(updatedRecord);
}

// ===== Space Actions =====

function recordToSpace(record: RecordModel): Space {
    return {
        id: record.id,
        name: record.name,
        icon: record.icon,
    };
}

export async function createSpaceAction(data: { name: string, icon: string }): Promise<Space> {
    const record = await pb.collection(spacesCollectionName).create(data);
    return recordToSpace(record);
}

export async function updateSpaceAction({ id, data }: { id: string, data: { name: string, icon: string } }): Promise<Space> {
    const record = await pb.collection(spacesCollectionName).update(id, data);
    return recordToSpace(record);
}

export async function deleteSpaceAction({ id }: { id: string }): Promise<{ success: boolean }> {
    // First, find all bookmarks and folders in this space
    const itemsInSpace = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `tool.spaceId = "${id}"`,
    });

    // Delete all of them
    const deletePromises = itemsInSpace.map(item => pb.collection(bookmarksCollectionName).delete(item.id));
    await Promise.all(deletePromises);

    // Finally, delete the space itself
    await pb.collection(spacesCollectionName).delete(id);

    return { success: true };
}
