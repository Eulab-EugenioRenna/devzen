
import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type { Space, AppInfo } from '@/lib/types';
import { createServerClient } from '@/lib/pocketbase_server';

export * from '../../lib/data-mappers';

// Mappers moved here from the deleted mappers.ts file
export function recordToSpace(record: RecordModel): Space {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    category: record.category,
    isLink: record.isLink,
  };
}

export function recordToAppInfo(record: RecordModel): AppInfo {
    const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const logoUrl = record.logo ? client.files.getUrl(record, record.logo) : '';
    return {
        id: record.id,
        title: record.title,
        logo: record.logo ? logoUrl : 'Logo',
    };
}
