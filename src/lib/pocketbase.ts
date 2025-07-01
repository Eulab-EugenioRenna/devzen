import PocketBase from 'pocketbase';

if (!process.env.POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not set in the environment variables. Please add it to your .env file.');
}
if (!process.env.POCKETBASE_COLLECTION_BOOKMARKS) {
  throw new Error('POCKETBASE_COLLECTION_BOOKMARKS is not set in the environment variables. Please add it to your .env file.');
}

export const pb = new PocketBase(process.env.POCKETBASE_URL);
export const bookmarksCollectionName = process.env.POCKETBASE_COLLECTION_BOOKMARKS;
