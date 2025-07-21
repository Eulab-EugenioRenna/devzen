import PocketBase from 'pocketbase';

/**
 * @deprecated This server-side instance is deprecated.
 * Use `createServerClient` from `@/lib/pocketbase_server` for server-side operations.
 * Use `pb_client` from `@/lib/pocketbase_client` for client-side operations.
 */
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false);


export const usersCollectionName = 'devzen_users';
export const bookmarksCollectionName = 'devzen_tools';
export const spacesCollectionName = 'devzen_spaces';
export const menuCollectionName = 'devzen_menu';
export const toolsAiCollectionName = 'tools_ai';
