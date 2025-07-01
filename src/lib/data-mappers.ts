import type { RecordModel } from 'pocketbase';
import type { SpaceItem, ToolsAi, ToolsAiSummary } from '@/lib/types';

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
