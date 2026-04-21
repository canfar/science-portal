import { handlers } from '@/auth';
import type { NextRequest } from 'next/server';

import { patchNextAuthResponse } from '@/lib/auth/patch-providers-response';

/**
 * NextAuth API Route Handler
 *
 * This handles all NextAuth routes: /api/auth/signin, /api/auth/callback, etc.
 * Only active when NEXT_USE_CANFAR=false (OIDC mode)
 */

export async function GET(request: NextRequest) {
  const res = await handlers.GET(request);
  return patchNextAuthResponse(request, res);
}

export async function POST(request: NextRequest) {
  const res = await handlers.POST(request);
  return patchNextAuthResponse(request, res);
}
