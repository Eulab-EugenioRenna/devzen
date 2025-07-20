import PocketBase from 'pocketbase';

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not set in the environment variables. Please add it to your .env file.');
}

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// This is disabled to prevent client-side navigation from cancelling
// server-side actions. It's particularly important in Next.js.
pb.autoCancellation(false);

export const usersCollectionName = 'devzen_users';
export const bookmarksCollectionName = 'bookmarks';
export const spacesCollectionName = 'spaces';
export const menuCollectionName = 'menu';
export const toolsAiCollectionName = 'tools_ai';
export const menuRecordId = 'vph860h5ys84561';
