'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { pb, usersCollectionName } from '@/lib/pocketbase';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function handleLogin(formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validated = loginSchema.safeParse(values);

    if (!validated.data) {
        return { error: 'Email o password non validi.' };
    }

    const { email, password } = validated.data;

    try {
        await pb.collection(usersCollectionName).authWithPassword(email, password);
        console.log("--- CHECKPOINT 1 [handleLogin] ---");
        console.log("User authenticated on server. isValid:", pb.authStore.isValid);
        console.log("User model:", pb.authStore.model?.id);
    } catch (e) {
        console.error(e);
        return { error: 'Credenziali di accesso non valide.' };
    }

    const cookie = pb.authStore.exportToCookie();
    cookies().set('pb_auth', cookie);
    redirect('/dashboard');
}
