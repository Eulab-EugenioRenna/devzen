import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pb, usersCollectionName } from '@/lib/pocketbase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = cookies().get('pb_auth');

  if (cookie) {
    pb.authStore.loadFromCookie(cookie.value);
    try {
      // This will also auto-refresh the token if needed
      if(pb.authStore.isValid) {
        await pb.collection(usersCollectionName).authRefresh();
      }
    } catch (_) {
      // Clear cookie to prevent infinite redirect loop
      pb.authStore.clear();
      cookies().delete('pb_auth');
    }
  }

  if (!pb.authStore.isValid) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  );
}