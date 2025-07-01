import PocketBase from 'pocketbase';

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_BOOKMARKS) {
  throw new Error('POCKETBASE_COLLECTION_BOOKMARKS is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_SPACES) {
    throw new Error('POCKETBASE_COLLECTION_SPACES is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_MENU) {
    throw new Error('POCKETBASE_COLLECTION_MENU is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_TOOLS_AI) {
    throw new Error('POCKETBASE_COLLECTION_TOOLS_AI is not set in the environment variables. Please add it to your .env file.');
}


export const pb = new PocketBase(process.env.POCKETBASE_URL);
pb.autoCancellation(false);


export const bookmarksCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_BOOKMARKS;
export const spacesCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_SPACES;
export const menuCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_MENU;
export const toolsAiCollectionName = process.env.NEXT_PUBLIC_POCKETBASE_COLLECTION_TOOLS_AI;
export const menuRecordId = 'vph860h5ys84561';
