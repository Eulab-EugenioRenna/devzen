import PocketBase from 'pocketbase';

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_USERS) throw new Error('NEXT_PUBLIC_POCKETBASE_COLLECTION_USERS is not set');
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_BOOKMARKS) throw new Error('NEXT_PUBLIC_POCKETBASE_COLLECTION_BOOKMARKS is not set');
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_SPACES) throw new Error('NEXT_PUBLIC_POCKETBASE_COLLECTION_SPACES is not set');
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_MENU) throw new Error('NEXT_PUBLIC_POCKETBASE_COLLECTION_MENU is not set');
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_TOOLS_AI) throw new Error('NEXT_PUBLIC_POCKETBASE_COLLECTION_TOOLS_AI is not set');


export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// This is disabled to prevent client-side navigation from cancelling
// server-side actions. It's particularly important in Next.js.
pb.autoCancellation(false);

export const usersCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_USERS;
export const bookmarksCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_BOOKMARKS;
export const spacesCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_SPACES;
export const menuCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_MENU;
export const toolsAiCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_TOOLS_AI;

export const menuRecordId = 'vph860h5ys84561';