/**
 * Container Images API Route
 *
 * Handles retrieving available container images.
 * GET - Get available container images grouped by type and project
 */

import { NextRequest } from 'next/server';
import * as convert from 'xml-js';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { groupImagesByTypeAndProject, type RawImage } from '@/lib/utils/image-parser';

// An in-memory cache for images, preloaded at server startup
let imageCache: any = null;

async function preload() {
  const query = "select soft.uri, soft.status, soft.description, soft.release_date, res.min_memory, res.requires_gpu, art.cpu_architecture, art.location, art.supported_modes from sdm.software soft join sdm.resource_requirements res on soft.id = res.software_id join sdm.artifact art on soft.id = art.software_id";
  const params = new URLSearchParams();
  params.append("QUERY", query);
  params.append("LANG", "ADQL");
  params.append("RESPONSEFORMAT", "votable");

  const res = await fetch(`${serverApiConfig.softwareDiscovery.baseUrl}/sync`, {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const discoveryXML = await res.text();

  // Convert VOTable XML String to a JSON string with options
  const jsonDataString = convert.xml2json(discoveryXML, {
    compact: true, // Use compact format
    spaces: 4    // Indent the output JSON string with 4 spaces
  });

  // Navigate through the JSON structure to extract the relevant data
  const tableData = JSON.parse(jsonDataString)?.VOTABLE?.RESOURCE?.TABLE;
  if (!tableData) {
    console.error('Failed to parse software discovery data: Missing TABLE element');
    return;
  }

  // This might be an array or a single object depending on the number of rows, so we need to handle both cases
  const rows = tableData.DATA?.TABLEDATA?.TR;
  if (!rows) {
    console.error('Failed to parse software discovery data: Missing TABLEDATA/TR elements');
    return;
  }

  // Single values return as one object. Multiple values return as an array. Normalize to array.
  const rowArray = Array.isArray(rows) ? rows : [rows]; // Ensure rows is an array

  // Transform the rows into a more usable format (array of objects)
  const images = rowArray.map((row: any) => {
    const cells = row.TD;
    const arch = cells[6]._text
    const supportedModes = cells[8]._text
    const locationURL = URL.parse(cells[7]._text)
    const uriValue = cells[0]._text;
    const name = uriValue.split(':').slice(1).join('/').replace('@', ':'); // Extract the name from the URI (everything after the first colon)
    // const name = `${locationURL?.hostname}${locationURL?.pathname}`;
    return {
      uri: uriValue,
      status: cells[1]._text,
      description: cells[2]._text,
      release_date: cells[3]._text,
      min_memory: cells[4]._text,
      requires_gpu: cells[5]._text,
      cpu_architecture: arch ? arch.replace(/[\{\}]/g, '').split(',').map((arch: string) => arch.toLowerCase().trim()) : [],
      location: locationURL,
      name: name,
      supported_modes: supportedModes ? supportedModes.replace(/[\{\}]/g, '').split(',').map((mode: string) => mode.toLowerCase().trim()) : [],
    };
  });

  // Store the transformed data in the in-memory cache
  imageCache = images;
}

await preload();

/**
 * GET /api/sessions/images
 * Get available container images grouped by type and project
 *
 * Returns images in the format:
 * {
 *   [sessionType]: {
 *     [projectName]: [
 *       {
 *         id: string,
 *         registry: string,
 *         project: string,
 *         name: string,
 *         imageName: string,
 *         version: string,
 *         label: string
 *       }
 *     ]
 *   }
 * }
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const rawImages: RawImage[] = imageCache.map((img: any) => {
    return {
      id: img.name,
      types: img.supported_modes
    }
  });

  // Transform the raw images into grouped structure
  const groupedImages = groupImagesByTypeAndProject(rawImages);

  return successResponse(groupedImages);
});
