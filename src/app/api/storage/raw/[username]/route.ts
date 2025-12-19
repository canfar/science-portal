/**
 * Storage Raw API Route
 *
 * GET /api/storage/raw/[username] - Get storage data for VOSpace
 * This endpoint fetches VOSpace XML and returns parsed JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS, API_TIMEOUTS } from '@/app/api/lib/http-constants';

interface StorageData {
  size: number;
  quota: number;
  date: string;
  usage: number;
}

/**
 * Parse VOSpace XML response to extract storage data
 */
function parseVOSpaceXML(xmlText: string): StorageData {
  // Simple regex-based parsing for server-side (no DOMParser in Node.js)
  let size = 0;
  let quota = 0;
  let date = new Date().toISOString();

  // Match property elements with their URIs and values
  const propertyRegex = /<vos:property[^>]*uri="([^"]*)"[^>]*>([\s\S]*?)<\/vos:property>/g;
  let match;

  while ((match = propertyRegex.exec(xmlText)) !== null) {
    const uri = match[1];
    const value = match[2].trim();

    if (uri.includes('vospace/core#length')) {
      size = parseInt(value, 10) || 0;
    } else if (uri.includes('vospace/core#quota')) {
      quota = parseInt(value, 10) || 0;
    } else if (uri.includes('vospace/core#date')) {
      date = value;
    }
  }

  const usage = quota > 0 ? (size / quota) * 100 : 0;

  return { size, quota, date, usage };
}

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  const authHeaders = await forwardAuthHeader(request);
  // Use mode-aware storage API (SRC Cavern for OIDC, CANFAR for CANFAR mode)
  const storageBaseUrl = serverApiConfig.storage.baseUrl;
  // Base URL already includes path, just append username
  const storageUrl = `${storageBaseUrl}${username}`;

  console.log('[Storage API] Fetching storage data:', {
    username,
    url: storageUrl,
    baseUrl: storageBaseUrl,
    mode: process.env.NEXT_USE_CANFAR !== 'true' ? 'OIDC' : 'CANFAR',
  });

  const response = await fetchExternalApi(
    storageUrl,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/xml',
      },
    },
    API_TIMEOUTS.DEFAULT
  );

  console.log('[Storage API] Fetch response:', {
    username,
    status: response.status,
    ok: response.ok,
    statusText: response.statusText,
  });

  if (!response.ok) {
    console.error('[Storage API] Failed to fetch storage data:', {
      username,
      status: response.status,
      statusText: response.statusText,
    });
    return errorResponse('Failed to fetch storage data', response.status);
  }

  const xmlText = await response.text();

  console.log('[Storage API] Raw XML response (first 500 chars):', {
    username,
    xmlPreview: xmlText.substring(0, 500),
    totalLength: xmlText.length,
  });

  // Parse the XML and extract storage data
  const storageData = parseVOSpaceXML(xmlText);

  console.log('[Storage API] Parsed storage data:', {
    username,
    data: storageData,
  });

  // Return JSON response
  return NextResponse.json(storageData, {
    status: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});
