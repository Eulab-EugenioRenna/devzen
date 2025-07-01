'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import type { Bookmark } from '@/lib/types';
import { pb, bookmarksCollectionName } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

function recordToBookmark(record: RecordModel): Bookmark {
  return {
    id: record.id,
    title: (record as any).tool.title,
    url: (record as any).tool.url,
    summary: (record as any).tool.summary,
    spaceId: (record as any).tool.spaceId,
  };
}

export async function addBookmarkAction({
  title,
  url,
  spaceId,
}: {
  title: string;
  url: string;
  spaceId: string;
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
      title,
      url: parsedUrl.href,
      summary,
      spaceId,
    },
  };

  try {
    const record = await pb.collection(bookmarksCollectionName).create(data);
    return recordToBookmark(record);
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
  // If URL changed, re-summarize
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
  return recordToBookmark(updatedRecord);
}

export async function deleteBookmarkAction({ id }: { id: string }): Promise<{ success: boolean }> {
  try {
    await pb.collection(bookmarksCollectionName).delete(id);
    return { success: true };
  } catch (e) {
    console.error('Failed to delete bookmark in PocketBase', e);
    throw new Error('Failed to delete bookmark.');
  }
}

export async function moveBookmarkAction({
  id,
  newSpaceId,
}: {
  id: string;
  newSpaceId: string;
}): Promise<Bookmark> {
  const record = await pb.collection(bookmarksCollectionName).getOne(id);
  const data = {
    tool: {
      ...record.tool,
      spaceId: newSpaceId,
    },
  };

  const updatedRecord = await pb.collection(bookmarksCollectionName).update(id, data);
  return recordToBookmark(updatedRecord);
}
