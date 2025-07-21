
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/pocketbase_server';
import { redirect } from 'next/navigation';

export async function handleLogout() {
  const pb = await createServerClient();
  pb.authStore.clear();
  cookies().delete('pb_auth');
  redirect('/login');
}

export async function setAuthCookieAction(cookieString: string) {
    if (cookieString) {
        cookies().set('pb_auth', cookieString);
    } else {
        cookies().delete('pb_auth');
    }
}
