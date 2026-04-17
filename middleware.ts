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
     * - api/auth (NextAuth / Auth.js — must not run auth() middleware here or OAuth
     *   state/PKCE cookies can break on the callback)
     *
     * With next.config basePath, pathname in middleware excludes the basePath prefix,
     * so exclude "api/auth" not "/science-portal/api/auth".
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
