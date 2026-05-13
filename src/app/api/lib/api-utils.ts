/**
 * API Route Utilities
 *
 * Shared utilities for Next.js API routes including error handling,
 * response formatting, and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isOIDCAuth } from '@/lib/config/auth-config';
import { HTTP_STATUS, HTTP_STATUS_NAMES, API_TIMEOUTS } from './http-constants';

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: getErrorName(status),
      message,
      status,
      details,
    },
    { status },
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse<T> {
  // Handle 204 No Content - must not have a body
  if (status === HTTP_STATUS.NO_CONTENT) {
    return new NextResponse(null, {
      status: HTTP_STATUS.NO_CONTENT,
    }) as NextResponse<T>;
  }
  return NextResponse.json(data, { status });
}

/**
 * Gets error name from status code
 */
function getErrorName(status: number): string {
  return HTTP_STATUS_NAMES[status] || 'Error';
}

/**
 * Validates HTTP method
 */
export function validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * Extracts and validates JSON body from request
 */
export async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Fetches from external API with error handling and logging
 */
export async function fetchExternalApi(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUTS.DEFAULT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Log the outgoing request to external API
  const method = options.method || 'GET';
  console.log('\n' + '🔵'.repeat(40));
  console.log(`🌐 SKAHA API REQUEST: ${method} ${url}`);
  console.log('🔵'.repeat(40));
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  // Log headers (mask sensitive data)
  if (options.headers) {
    console.log('\n📋 Request Headers:');
    const headers = options.headers as Record<string, string>;
    const sanitizedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (key.toLowerCase() === 'authorization') {
        sanitizedHeaders[key] = value ? `Bearer ${value.substring(7, 27)}...` : '<empty>';
      } else {
        sanitizedHeaders[key] = value;
      }
    });
    console.log(JSON.stringify(sanitizedHeaders, null, 2));
  }

  // Log request body if present
  if (options.body) {
    console.log('\n📦 Request Body:');
    try {
      const bodyData = JSON.parse(options.body as string);
      console.log(JSON.stringify(bodyData, null, 2));
    } catch {
      console.log(options.body);
    }
  }
  console.log('🔵'.repeat(40) + '\n');

  const startTime = Date.now();

  try {
    // Don't send credentials (cookies) in OIDC mode - only Bearer tokens
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: isOIDCAuth() ? 'omit' : 'include', // omit cookies in OIDC mode
    });

    clearTimeout(timeoutId);

    // Clone the response so we can read the body for logging without consuming it
    const clonedResponse = response.clone();
    const duration = Date.now() - startTime;
    const statusIcon = response.ok ? '✅' : '❌';

    console.log('\n' + '🟢'.repeat(40));
    console.log(`${statusIcon} API RESPONSE: ${method} ${url}`);
    console.log('🟢'.repeat(40));
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Duration: ${duration}ms`);

    // Try to parse and log the response payload
    try {
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const payload = await clonedResponse.json();
        console.log('\n📦 Response Payload:');

        // For arrays, show count and first few items
        if (Array.isArray(payload)) {
          console.log(`   Array with ${payload.length} item(s)`);
          if (payload.length > 0) {
            console.log('   First item(s):');
            console.log(JSON.stringify(payload.slice(0, 3), null, 2));
            if (payload.length > 3) {
              console.log(`   ... and ${payload.length - 3} more item(s)`);
            }
          }
        } else {
          console.log(JSON.stringify(payload, null, 2));
        }
      } else if (contentType?.includes('text/')) {
        const text = await clonedResponse.text();
        console.log('\n📦 Response Text:');
        console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      }
    } catch {
      // If we can't parse, just skip logging the body
      console.log('\n📦 Response body: (unable to parse)');
    }

    console.log('🟢'.repeat(40) + '\n');

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Log the error
    console.log('\n' + '🔴'.repeat(40));
    console.log(`❌ SKAHA API ERROR: ${method} ${url}`);
    console.log('🔴'.repeat(40));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log('🔴'.repeat(40) + '\n');

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`External API timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Forwards the incoming `Cookie` header onto an outbound upstream request.
 * Used by CANFAR mode so the upstream (ws-cadc.canfar.net) can verify the
 * `.canfar.net`-scoped `CADC_SSO` cookie.
 */
export function forwardCookies(clientRequest: NextRequest): HeadersInit {
  const cookieHeader = clientRequest.headers.get('cookie');
  return cookieHeader ? { Cookie: cookieHeader } : {};
}

/**
 * Build auth headers to forward to the upstream service.
 *
 * - OIDC mode: extracts the NextAuth session's access token and returns
 *   `Authorization: Bearer <jwt>`.
 * - CANFAR mode: returns both the client's `Authorization` header (if any —
 *   sessionStorage Bearer fallback used in local dev) **and** the client's
 *   `Cookie` header (the actual production SSO signal: `.canfar.net`-scoped
 *   `CADC_SSO`). Either one is sufficient for upstream to authenticate the
 *   caller; the cookie path is what unlocks single-sign-on across CANFAR apps.
 */
export async function forwardAuthHeader(clientRequest: NextRequest): Promise<HeadersInit> {
  if (isOIDCAuth()) {
    // In OIDC mode, get the JWT from NextAuth session (server-side)
    const { auth } = await import('@/auth');
    const session = await auth();

    if (session?.accessToken) {
      return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
  }

  // CANFAR mode: forward both auth signals. Upstream will use whichever it
  // recognises. Cookie is the SSO path (Set-Cookie issued by the access
  // service on `.canfar.net`); Authorization is the sessionStorage fallback
  // still useful for local dev where `.canfar.net` cookies can't reach
  // localhost.
  const authHeader = clientRequest.headers.get('authorization');
  const cookieHeaders = forwardCookies(clientRequest);
  return {
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...cookieHeaders,
  };
}

/**
 * In OIDC mode, Skaha calls require a Bearer from the NextAuth session. When it is missing,
 * return 401 instead of calling upstream unauthenticated (which often returns non-JSON and
 * becomes a misleading 500 after `response.json()`).
 */
export function oidcBearerAuthMissingResponse(authHeaders: HeadersInit): NextResponse | null {
  if (!isOIDCAuth()) {
    return null;
  }
  const authorization = (authHeaders as Record<string, string>).Authorization;
  if (authorization?.startsWith('Bearer ') && authorization.length > 7) {
    return null;
  }
  return errorResponse(
    'Authentication required: no access token in session',
    HTTP_STATUS.UNAUTHORIZED,
  );
}

/**
 * Parse a fetch Response body as JSON after success; avoids throwing on HTML/plain errors.
 */
export async function parseSuccessJsonBody<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Extracts Bearer token from Authorization header
 *
 * @returns The token string or null if not found
 */
export function getBearerToken(clientRequest: NextRequest): string | null {
  const authHeader = clientRequest.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Copies cookies from external API response to client response
 */
export function copyCookies(
  externalResponse: Response,
  clientResponse: NextResponse,
): NextResponse {
  const setCookieHeaders = externalResponse.headers.get('set-cookie');
  if (setCookieHeaders) {
    clientResponse.headers.set('set-cookie', setCookieHeaders);
  }
  return clientResponse;
}

/**
 * Handles method not allowed
 */
export function methodNotAllowed(allowedMethods: string[]): NextResponse {
  return errorResponse(
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    HTTP_STATUS.METHOD_NOT_ALLOWED,
  );
}

/**
 * Wraps API route handler with error handling
 */
export function withErrorHandling<TContext = { params: Promise<Record<string, string>> }>(
  handler: (request: NextRequest, context: TContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: TContext): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Route Error:', error);

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          return errorResponse('Request timeout', HTTP_STATUS.GATEWAY_TIMEOUT, error.message);
        }
        if (error.message.includes('Invalid JSON')) {
          return errorResponse('Invalid request body', HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return errorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      return errorResponse('An unexpected error occurred', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}
