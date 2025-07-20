import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pb } from '@/lib/pocketbase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = cookies().get('pb_auth');

  if (cookie) {
    pb.authStore.loadFromCookie(cookie.value);
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
