import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';
import { usersCollectionName } from '@/lib/pocketbase';

/**
 * @deprecated Use createClient() instead for Server Actions.
 * This function is kept for compatibility but createClient is preferred.
 */
export async function revalidateAndGetClient() {
    const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    const cookie = cookies().get('pb_auth');

    if (cookie) {
        client.authStore.loadFromCookie(cookie.value, false);
    } else {
        client.authStore.clear();
        return client;
    }

    try {
        if (client.authStore.isValid) {
            await client.collection(usersCollectionName).authRefresh();
        }
    } catch (_) {
        client.authStore.clear();
    }

    return client;
}
