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
        name: username,
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

  const cookie = pb.authStore.exportToCookie();
  cookies().set('pb_auth', cookie);
  redirect('/dashboard');
}
