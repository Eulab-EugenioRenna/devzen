import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import type { Space, AppInfo } from '@/lib/types';

/**
 * Creates a new PocketBase instance for a server-side request.
 * This is essential for Server Actions, as it isolates the authentication
 * state for each request, preventing context bleed.
 * @returns A PocketBase instance authenticated with the current user's cookie.
 */
export function createClient(): PocketBase {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('pb_auth');

  // Create a new instance for every request
  const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

  // Load the auth store from the cookie
  if (authCookie) {
    client.authStore.loadFromCookie(authCookie.value, false);
  } else {
    client.authStore.clear();
  }
  
  // It's crucial to disable auto-cancellation for server-side operations
  client.autoCancellation(false);

  return client;
}

export { revalidateAndGetClient } from './revalidate';
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
