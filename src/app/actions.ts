'use server';

import { summarizeBookmark } from '@/ai/flows/summarize-bookmark';
import type { Bookmark } from '@/lib/types';

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

  try {
    const { summary } = await summarizeBookmark({ url: parsedUrl.href });

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      title,
      url: parsedUrl.href,
      summary,
      spaceId,
    };

    // In a real app, you would save this to a persistent database.
    console.log('New bookmark created with AI summary:', newBookmark);

    return newBookmark;
  } catch (e) {
    console.error('Failed to create bookmark with summary', e);
    // Fallback to creating a bookmark without an AI summary on error
    const newBookmarkWithoutSummary: Bookmark = {
      id: crypto.randomUUID(),
      title,
      url: parsedUrl.href,
      summary: 'Could not generate summary for this URL.',
      spaceId,
    };
    return newBookmarkWithoutSummary;
  }
}
