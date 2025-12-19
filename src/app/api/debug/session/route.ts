/**
 * Debug Session Endpoint
 *
 * Displays the current NextAuth session and token information
 * REMOVE THIS IN PRODUCTION!
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  return NextResponse.json({
    session: session || null,
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    accessTokenPrefix: session?.accessToken?.substring(0, 50),
    user: session?.user,
    error: session?.error,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
