import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pb, usersCollectionName } from '@/lib/pocketbase';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  pb.authStore.clear();

  const cookie = cookies().get('pb_auth');
  
  if (cookie) {
    pb.authStore.loadFromCookie(cookie.value);
    try {
      // Verify/refresh the token if it's valid
      if (pb.authStore.isValid) {
        await pb.collection(usersCollectionName).authRefresh();
      }
    } catch (_) {
      // If verification fails, clear the invalid cookie and auth store
      pb.authStore.clear();
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('pb_auth');
      return response;
    }
  }

  // Check if the user is authenticated (a valid model exists in the auth store)
  const isAuthenticated = pb.authStore.isValid && !!pb.authStore.model;

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
