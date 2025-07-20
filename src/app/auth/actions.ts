
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { pb, usersCollectionName } from '@/lib/pocketbase';
import { redirect } from 'next/navigation';

const signupSchema = z
  .object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
  });

export async function handleSignup(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validated = signupSchema.safeParse(values);

  if (!validated.data) {
    return { error: 'Dati inseriti non validi.' };
  }

  const { email, password, username } = validated.data;
  
  try {
    const data = {
        username: username,
        email: email,
        emailVisibility: true,
        password: password,
        passwordConfirm: password,
        name: username, // Set name to username by default
    };

    await pb.collection(usersCollectionName).create(data);
    await pb.collection(usersCollectionName).authWithPassword(email, password);

  } catch (e: any) {
    console.error(e);
    if (e.response?.data?.data?.email?.message) {
      return { error: 'Questa email è già in uso.' };
    }
     if (e.response?.data?.data?.username?.message) {
      return { error: 'Questo username è già in uso.' };
    }
    return { error: 'Impossibile creare l\'account. Riprova.' };
  }

  // Set auth cookie
  const cookie = pb.authStore.exportToCookie();
  cookies().set('pb_auth', cookie);
}


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
    } catch (e) {
        console.error(e);
        return { error: 'Credenziali di accesso non valide.' };
    }

    const cookie = pb.authStore.exportToCookie();
    cookies().set('pb_auth', cookie);
}


export async function handleLogout() {
  pb.authStore.clear();
  cookies().delete('pb_auth');
  redirect('/login');
}
