import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pb, usersCollectionName } from '@/lib/pocketbase';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth cookie
  const cookie = cookies().get('pb_auth');
  
  // If there's a cookie, load it into PocketBase
  if (cookie) {
    try {
      pb.authStore.loadFromCookie(cookie.value);
      // Verify token
      await pb.collection(usersCollectionName).authRefresh();
    } catch (_) {
      // Clear invalid cookie
      pb.authStore.clear();
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('pb_auth');
      return response;
    }
  }

  const isAuthenticated = pb.authStore.isValid;

  // If user is trying to access auth pages but is already logged in, redirect to dashboard
  if (isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is trying to access a protected route without being authenticated, redirect to login
  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher to run middleware on specific paths
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
