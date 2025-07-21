import PocketBase from 'pocketbase';

// This instance is for client-side usage only ('use client' components),
// where the authStore is persisted in localStorage.
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// This is disabled to prevent client-side navigation from cancelling
// server-side actions. It's particularly important in Next.js.
pb.autoCancellation(false);
