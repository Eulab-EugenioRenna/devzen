import * as React from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/pocketbase_server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pb = await createServerClient();

  if (!pb.authStore.isValid) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  );
}
