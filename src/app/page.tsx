import type { Bookmark } from '@/lib/types';
import { pb, bookmarksCollectionName } from '@/lib/pocketbase';
import { BookmarkDashboard } from '@/components/bookmark-dashboard';

async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
    });

    return records.map(
      (record): Bookmark => ({
        id: record.id,
        title: (record as any).tool.title,
        url: (record as any).tool.url,
        summary: (record as any).tool.summary,
        spaceId: (record as any).tool.spaceId,
      })
    );
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    return [];
  }
}

export default async function HomePage() {
  const bookmarks = await getBookmarks();
  return <BookmarkDashboard initialBookmarks={bookmarks} />;
}
