'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import { generateWorkspace } from '@/ai/flows/generate-workspace';
import type { Bookmark, Folder, Space, SpaceItem, AppInfo, ToolsAi, AIWorkspace, AISpace, AISpaceItem, AIBookmark } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName, menuCollectionName, menuRecordId, toolsAiCollectionName } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';
import { recordToSpaceItem, recordToToolAi } from '@/lib/data-mappers';

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
    const newBookmark = recordToSpaceItem(record);
    if (!newBookmark || newBookmark.type !== 'bookmark') {
      throw new Error('Failed to create or map bookmark from new record.');
    }
    return newBookmark as Bookmark;
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
  const updatedBookmark = recordToSpaceItem(updatedRecord);
  if (!updatedBookmark || updatedBookmark.type !== 'bookmark') {
    throw new Error('Failed to update or map bookmark from record.');
  }
  return updatedBookmark as Bookmark;
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
    const updatedBookmarks = updatedRecords
        .map(recordToSpaceItem)
        .filter((item): item is Bookmark => !!item && item.type === 'bookmark');
    
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
  const newFolderUnchecked = recordToSpaceItem(folderRecord);

  if (!newFolderUnchecked || newFolderUnchecked.type !== 'folder') {
    // Attempt to clean up the invalid record that was just created
    await pb.collection(bookmarksCollectionName).delete(folderRecord.id).catch(e => console.error("Failed to clean up invalid folder record after creation error.", e));
    throw new Error('Failed to create or map new folder from record.');
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
      throw new Error('Failed to update folder name or map record.');
  }
  return updatedFolder as Folder;
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
  const updatedItem = recordToSpaceItem(updatedRecord);
  if (!updatedItem) {
    throw new Error('Failed to move or map item.');
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
        throw new Error('Failed to customize or map item.');
    }
    return updatedItem;
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

// ===== App Info Actions =====

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
             console.warn(`App info record with ID "${menuRecordId}" not found in collection "${menuCollectionName}". Please ensure this record exists. Falling back to default values.`);
        } else {
             console.error('Failed to fetch app info:', e.response || e);
             if (e?.originalError) {
                console.error('Underlying connection error:', e.originalError);
           }
        }
        // Return a static default to prevent crashing the app
        return { id: menuRecordId, title: 'DevZen', logo: 'Logo' };
    }
}

export async function updateAppInfoAction(id: string, formData: FormData): Promise<AppInfo> {
    const record = await pb.collection(menuCollectionName).update(id, formData);
    return recordToAppInfo(record);
}

// ===== AI Tools Library Actions =====

export async function getToolsAiAction(): Promise<ToolsAi[]> {
  try {
    const records = await pb.collection(toolsAiCollectionName).getFullList({
      filter: 'deleted = false',
    });
    return records.map(recordToToolAi).filter((tool): tool is ToolsAi => tool !== null);
  } catch (error) {
    console.error("Failed to fetch AI tools library on server:", error);
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
    throw new Error('Missing required fields');
  }

  const toolRecord = await pb.collection(toolsAiCollectionName).getOne(toolId);
  
  const tool: ToolsAi | null = recordToToolAi(toolRecord);
  if (!tool) {
    throw new Error('The selected library tool has invalid data.');
  }

  const data = {
    tool: {
      type: 'bookmark',
      title: tool.name,
      url: tool.link,
      summary: tool.summary.summary, // using the summary from the JSON
      spaceId: spaceId,
      parentId: null,
    },
  };

  try {
    const record = await pb.collection(bookmarksCollectionName).create(data);
    const newBookmark = recordToSpaceItem(record);
    if (!newBookmark || newBookmark.type !== 'bookmark') {
      throw new Error('Failed to create or map bookmark from library tool.');
    }
    return newBookmark as Bookmark;
  } catch (e) {
    console.error('Failed to create bookmark from library in PocketBase', e);
    throw new Error('Failed to save bookmark from library.');
  }
}

// ===== AI Workspace Generation Actions =====

export async function generateWorkspaceAction(prompt: string): Promise<AIWorkspace> {
    if (!prompt) {
        throw new Error("Prompt cannot be empty.");
    }
    // For JSON import, we parse it directly. Otherwise, we call the AI.
    try {
        const json = JSON.parse(prompt);
        if (json.spaces) {
            // Basic validation to see if it looks like our workspace structure
            return json as AIWorkspace;
        }
    } catch (e) {
        // Not a valid JSON, so we treat it as a text prompt for the AI
    }

    try {
        const result = await generateWorkspace({ prompt });
        return result;
    } catch (e) {
        console.error("Failed to generate workspace from prompt", e);
        throw new Error("The AI failed to generate a workspace. Please try a different prompt.");
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
    let summary = 'AI-generated bookmark.';
    try {
        const result = await summarizeBookmark({ url: aiBookmark.url });
        summary = result.summary;
    } catch (e) {
        console.warn(`Could not generate summary for ${aiBookmark.url}:`, e);
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

        // Create folders first
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
        
        // Then add bookmarks to folders or root
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
