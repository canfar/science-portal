import { NextResponse } from 'next/server';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * Public, non-secret deployment config for the browser.
 * Prefer reading from the root layout on first paint; this endpoint is for
 * diagnostics and optional client refresh patterns.
 */
export async function GET() {
  return NextResponse.json(getPublicRuntimeConfigFromEnv());
}
