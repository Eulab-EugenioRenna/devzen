import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';
import { usersCollectionName } from './pocketbase';

export async function createServerClient() {
    const cookieStore = cookies();
    const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

    const authCookie = cookieStore.get('pb_auth');
    if (authCookie) {
        client.authStore.loadFromCookie(authCookie.value);
        try {
            if (client.authStore.isValid) {
                await client.collection(usersCollectionName).authRefresh();
            }
        } catch (_) {
            client.authStore.clear();
        }
    }
    
    // It's crucial to disable auto-cancellation for server-side operations
    client.autoCancellation(false);
    
    return client;
}
