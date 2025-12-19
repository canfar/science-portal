import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Middleware for authentication
 *
 * This middleware runs on every request and handles:
 * - NextAuth session management (when in OIDC mode)
 * - Protected route enforcement (can be extended)
 */

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Allow all requests for now
  // Add protected route logic here if needed
  // Example:
  // if (pathname.startsWith('/protected') && !isAuthenticated) {
  //   return NextResponse.redirect(new URL('/science-portal', req.url));
  // }

  return NextResponse.next();
});

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
