import type { SpaceItem } from '@/lib/types';
import { pb, bookmarksCollectionName } from '@/lib/pocketbase';
import { BookmarkDashboard } from '@/components/bookmark-dashboard';
import type { RecordModel } from 'pocketbase';

function recordToSpaceItem(record: RecordModel): SpaceItem {
  const toolData = (record as any).tool;
  const baseItem = {
    id: record.id,
    spaceId: toolData.spaceId,
    parentId: toolData.parentId,
  };

  if (toolData.type === 'folder') {
    return {
      ...baseItem,
      type: 'folder',
      name: toolData.name,
      items: [], // Populated on the client
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


async function getItems(): Promise<SpaceItem[]> {
  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
    });
    return records.map(recordToSpaceItem);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return [];
  }
}

export default async function HomePage() {
  const items = await getItems();
  return <BookmarkDashboard initialItems={items} />;
}
