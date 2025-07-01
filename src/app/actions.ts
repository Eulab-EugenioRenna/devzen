'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import type { Bookmark } from '@/lib/types';
import { pb, bookmarksCollectionName } from '@/lib/pocketbase';

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
    // Fallback to creating a bookmark without an AI summary on error
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

    const newBookmark: Bookmark = {
      id: record.id,
      title: (record as any).tool.title,
      url: (record as any).tool.url,
      summary: (record as any).tool.summary,
      spaceId: (record as any).tool.spaceId,
    };

    console.log('New bookmark created in PocketBase:', newBookmark);
    return newBookmark;
  } catch (e) {
    console.error('Failed to create bookmark in PocketBase', e);
    throw new Error('Failed to save bookmark.');
  }
}
