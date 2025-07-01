import type { AppInfo, Space, SpaceItem } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { BookmarkDashboard } from '@/components/bookmark-dashboard';
import type { RecordModel } from 'pocketbase';
import { getAppInfoAction } from './actions';

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

function recordToSpace(record: RecordModel): Space {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
  };
}

async function getSpaces(): Promise<Space[]> {
  try {
    const records = await pb.collection(spacesCollectionName).getFullList({
      sort: 'created',
    });
    return records.map(recordToSpace);
  } catch (error) {
    console.error('Failed to fetch spaces:', error);
    if ((error as any).status === 404) {
        console.warn('Spaces collection not found or empty. You can create some via the UI.');
    }
    return [];
  }
}


export default async function HomePage() {
  const [items, spaces, appInfo] = await Promise.all([
      getItems(), 
      getSpaces(),
      getAppInfoAction(),
    ]);
  return <BookmarkDashboard initialItems={items} initialSpaces={spaces} initialAppInfo={appInfo} />;
}
