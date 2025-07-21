import PocketBase from 'pocketbase';

// This instance is now primarily for client-side usage, 
// where the authStore is persisted in localStorage.
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// This is disabled to prevent client-side navigation from cancelling
// server-side actions. It's particularly important in Next.js.
pb.autoCancellation(false);

export const usersCollectionName = 'devzen_users';
export const bookmarksCollectionName = 'devzen_tools';
export const spacesCollectionName = 'devzen_spaces';
export const menuCollectionName = 'devzen_menu';
export const toolsAiCollectionName = 'tools_ai';

export const menuRecordId = 'vph860h5ys84561';
