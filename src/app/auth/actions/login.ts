
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { usersCollectionName } from '@/lib/pocketbase';
import { createServerClient } from '@/lib/pocketbase_server';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function handleLogin(formData: FormData) {
    const pb = await createServerClient();
    const values = Object.fromEntries(formData.entries());
    const validated = loginSchema.safeParse(values);

    if (!validated.data) {
        return { error: 'Email o password non validi.' };
    }

    const { email, password } = validated.data;

    try {
        await pb.collection(usersCollectionName).authWithPassword(email, password);
    } catch (e) {
        console.error(e);
        return { error: 'Credenziali di accesso non valide.' };
    }

    const cookie = pb.authStore.exportToCookie();
    cookies().set('pb_auth', cookie);
    redirect('/dashboard');
}
