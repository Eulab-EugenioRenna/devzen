
import { pb } from '@/lib/pocketbase';
import { cookies } from 'next/headers';
import type { RecordModel } from 'pocketbase';
import type { SpaceItem, ToolsAi, ToolsAiSummary, Bookmark, Folder, SpaceLink, Space, AppInfo } from '@/lib/types';
import { usersCollectionName } from '@/lib/pocketbase';

export async function revalidateAndGetClient() {
    const cookie = cookies().get('pb_auth');
    if (cookie) {
        pb.authStore.loadFromCookie(cookie.value, false);
    }
    try {
      if(pb.authStore.isValid) {
        await pb.collection(usersCollectionName).authRefresh();
      }
    } catch (_) {
      pb.authStore.clear();
    }
    return pb;
}

// Mappers

export function recordToSpaceItem(record: RecordModel): SpaceItem | null {
  try {
    const toolData = (record as any).tool;

    if (typeof toolData !== 'object' || toolData === null || !toolData.type || !toolData.spaceId) {
      console.warn(`Skipping item with invalid or malformed tool data. Record ID: ${record.id}`);
      return null;
    }

    const baseItem = {
      id: record.id,
      spaceId: toolData.spaceId,
      parentId: toolData.parentId ?? null,
      backgroundColor: toolData.backgroundColor,
      textColor: toolData.textColor,
    };

    if (toolData.type === 'folder') {
      if (typeof toolData.name !== 'string') {
          console.warn(`Skipping folder with invalid name. Record ID: ${record.id}`);
          return null;
      }
      const folder: Folder = {
        ...baseItem,
        type: 'folder',
        name: toolData.name,
        items: [],
      };
      return folder;
    }

    if (toolData.type === 'bookmark') {
      if (typeof toolData.title !== 'string' || typeof toolData.url !== 'string') {
          console.warn(`Skipping bookmark with invalid title or url. Record ID: ${record.id}`);
          return null;
      }
      const bookmark: Bookmark = {
        ...baseItem,
        type: 'bookmark',
        title: toolData.title,
        url: toolData.url,
        summary: toolData.summary,
        icon: toolData.icon,
        iconUrl: toolData.iconUrl,
        iconColor: toolData.iconColor,
      };
      return bookmark;
    }
    
    if (toolData.type === 'space-link') {
      if (typeof toolData.name !== 'string' || typeof toolData.linkedSpaceId !== 'string') {
        console.warn(`Skipping space-link with invalid data. Record ID: ${record.id}`);
        return null;
      }
      const spaceLink: SpaceLink = {
        ...baseItem,
        type: 'space-link',
        name: toolData.name,
        icon: toolData.icon,
        linkedSpaceId: toolData.linkedSpaceId
      };
      return spaceLink;
    }

    console.warn(`Skipping item with unknown type "${toolData.type}". Record ID: ${record.id}`);
    return null;
  } catch (error) {
      console.error(`Error processing record to space item. Record ID: ${record.id}`, error);
      return null;
  }
}

function isValidToolsAiSummary(obj: any): obj is ToolsAiSummary {
    return (
        obj &&
        typeof obj.summary === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t: any) => typeof t === 'string')
    );
}

export function recordToToolAi(record: RecordModel): ToolsAi | null {
    if (typeof record.summary !== 'object' || record.summary === null || !isValidToolsAiSummary(record.summary)) {
        console.warn(`Skipping tool with invalid or malformed summary data. Record ID: ${record.id}, Name: "${record.name}"`);
        return null;
    }
    
    return {
        id: record.id,
        name: record.name,
        link: record.link,
        category: record.category,
        source: record.source,
        summary: record.summary as ToolsAiSummary,
        deleted: record.deleted,
        brand: record.brand,
    };
}

export function recordToSpace(record: RecordModel): Space {
    return {
        id: record.id,
        name: record.name,
        icon: record.icon,
        category: record.category,
        isLink: record.isLink || false,
    };
}

export function recordToAppInfo(record: RecordModel): AppInfo {
    const logoUrl = record.logo ? pb.files.getUrl(record, record.logo) : '';
    return {
        id: record.id,
        title: record.title,
        logo: record.logo ? logoUrl : 'Logo',
    };
}
