
'use server';

import { bookmarksCollectionName, spacesCollectionName, menuCollectionName, toolsAiCollectionName } from '@/lib/pocketbase';
import { recordToSpaceItem, recordToToolAi, recordToSpace, recordToAppInfo } from './utils';
import { createServerClient } from '@/lib/pocketbase_server';
import type { Space, SpaceItem, AppInfo, ToolsAi } from '@/lib/types';

export async function getSpacesAction(): Promise<Space[]> {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) return [];
  
  try {
    const records = await pb.collection(spacesCollectionName).getFullList({
      sort: 'created',
      filter: `user = "${pb.authStore.model!.id}"`,
    });
    return records.map(recordToSpace);
  } catch (error: any) {
    console.error('Failed to fetch spaces:', error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${spacesCollectionName}" was not found. You can create some via the UI.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}

export async function getItemsAction(): Promise<SpaceItem[]> {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) return [];

  try {
    const records = await pb.collection(bookmarksCollectionName).getFullList({
      sort: '-created',
      filter: `user = "${pb.authStore.model!.id}"`,
    });
    return records.map(recordToSpaceItem).filter((item): item is SpaceItem => item !== null);
  } catch (error: any) {
    console.error('Failed to fetch items:', error);
    if (error?.status === 404) {
        console.warn(`Warning: The collection "${bookmarksCollectionName}" was not found in your PocketBase instance. Please create it to store bookmarks and folders.`);
    } else if (error?.originalError) {
        console.error('Underlying connection error:', error.originalError);
    }
    return [];
  }
}

export async function getAppInfoAction(): Promise<AppInfo> {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return { id: '', title: 'DevZen', logo: 'Logo' };
    }

    try {
        const records = await pb.collection(menuCollectionName).getFullList({
            filter: `user = "${pb.authStore.model!.id}"`,
            sort: '-created',
        });

        if (records.length > 0) {
            return recordToAppInfo(records[0]);
        }
        return { id: '', title: 'DevZen', logo: 'Logo' };
    } catch (e: any) {
        console.error('Impossibile recuperare le info dell\'app:', e);
        if (e.status === 404) {
             console.warn(`La collezione "${menuCollectionName}" non è stata trovata. Ritorno ai valori predefiniti.`);
        } else if (e?.originalError) {
           console.error('Errore di connessione sottostante:', e.originalError);
        }
        return { id: '', title: 'DevZen', logo: 'Logo' };
    }
}

export async function getToolsAiAction(): Promise<ToolsAi[]> {
  const pb = await createServerClient();
  try {
    const records = await pb.collection(toolsAiCollectionName).getFullList({
      filter: 'deleted = false',
    });
    return records.map(recordToToolAi).filter((tool): tool is ToolsAi => tool !== null);
  } catch (error) {
    console.error("Impossibile recuperare la libreria di strumenti AI sul server:", error);
    return [];
  }
}
