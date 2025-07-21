'use server';

import { cookies } from 'next/headers';
import { pb } from '@/lib/pocketbase';
import { redirect } from 'next/navigation';

export async function handleLogout() {
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
