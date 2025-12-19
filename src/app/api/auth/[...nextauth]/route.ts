import { handlers } from '@/auth';

/**
 * NextAuth API Route Handler
 *
 * This handles all NextAuth routes: /api/auth/signin, /api/auth/callback, etc.
 * Only active when NEXT_USE_CANFAR=false (OIDC mode)
 */

export const { GET, POST } = handlers;
