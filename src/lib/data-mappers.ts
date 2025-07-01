import type { RecordModel } from 'pocketbase';
import type { SpaceItem, ToolsAi } from '@/lib/types';

export function recordToSpaceItem(record: RecordModel): SpaceItem {
  const toolData = (record as any).tool;
  const baseItem = {
    id: record.id,
    spaceId: toolData.spaceId,
    parentId: toolData.parentId,
    backgroundColor: toolData.backgroundColor,
    textColor: toolData.textColor,
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

export function recordToToolAi(record: RecordModel): ToolsAi {
    return {
        id: record.id,
        name: record.name,
        link: record.link,
        category: record.category,
        source: record.source,
        summary: record.summary, // PocketBase SDK automatically parses JSON fields
        deleted: record.deleted,
        brand: record.brand,
    };
}
