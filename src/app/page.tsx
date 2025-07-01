import type { AppInfo, Space, SpaceItem } from '@/lib/types';
import { pb, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { BookmarkDashboard } from '@/components/bookmark-dashboard';
import type { RecordModel } from 'pocketbase';
import { getAppInfoAction } from './actions';
import { recordToSpaceItem } from '@/lib/data-mappers';

async function getItems(): Promise<SpaceItem[]> {
  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
    });
    return records.map(recordToSpaceItem);
  } catch (error: any) {
    console.error('Failed to fetch items:', error.response || error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${bookmarksCollectionName}" was not found in your PocketBase instance. Please create it to store bookmarks and folders.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
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
  } catch (error: any) {
    console.error('Failed to fetch spaces:', error.response || error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${spacesCollectionName}" was not found. You can create some via the UI.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
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
