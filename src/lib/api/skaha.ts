/**
 * Skaha Platform API Client
 *
 * Handles all interactions with the Skaha platform for managing sessions,
 * retrieving platform load, and working with container images.
 * Uses Bearer token authentication from token storage.
 */

import { getAuthHeader } from '@/lib/auth/token-storage';
import type { ImagesByTypeAndProject } from '@/lib/utils/image-parser';

export type SessionType = 'notebook' | 'desktop' | 'headless' | 'carta' | 'contributed' | 'firefly' | 'contributednotebook' | 'contributeddesktop';
export type SessionStatus = 'Running' | 'Pending' | 'Terminating' | 'Error' | 'Failed' | 'Unknown';

// SKAHA API raw response format
export interface SkahaSessionResponse {
  id: string;
  userid: string;
  runAsUID: string;
  runAsGID: string;
  supplementalGroups?: number[];
  image: string;
  type: string;
  status: string;
  name: string;
  startTime: string;
  expiryTime: string;
  connectURL: string;
  requestedRAM?: string;
  requestedCPUCores?: string; // Note: API uses "requestedCPUCores" not "requestedCPU"
  requestedGPUCores?: string;
  ramInUse?: string;
  cpuCoresInUse?: string;
  isFixedResources?: boolean;
}

// Normalized session interface for internal use
export interface Session {
  id: string;
  sessionId?: string;
  sessionType: SessionType;
  sessionName: string;
  status: SessionStatus;
  containerImage: string;
  startedTime: string;
  expiresTime: string;
  memoryUsage?: string;
  memoryAllocated: string;
  cpuUsage?: string;
  cpuAllocated: string;
  gpuAllocated?: string;
  isFixedResources?: boolean;
  connectUrl?: string;
  requestedRAM?: string;
  requestedCPU?: string;
  requestedGPU?: string;
}

// SKAHA Stats API Response - raw format from /v1/session?view=stats
export interface SkahaStatsResponse {
  instances: {
    session: number;
    desktopApp: number;
    headless: number;
    total: number;
  };
  cores: {
    requestedCPUCores: number;
    cpuCoresAvailable: number;
    maxCPUCores: {
      cpuCores: number;
      withRam: string;
    };
  };
  ram: {
    requestedRAM: string;
    ramAvailable: string;
    maxRAM: {
      ram: string;
      withCPUCores: number;
    };
  };
}

export interface PlatformLoadMetric {
  name: string;
  used: number;
  free: number;
  headless?: number;
  [key: string]: number | string | undefined;
}

export interface PlatformLoad {
  cpu: PlatformLoadMetric;
  ram: PlatformLoadMetric;
  instances: PlatformLoadMetric;
  maxValues: {
    cpu: number;
    ram: number;
    instances: number;
  };
  lastUpdate: string | Date; // Support both string (from API) and Date for backward compatibility
}

export interface ContainerImage {
  id: string;
  name: string;
  types: SessionType[];
}

// Re-export image parser types for convenience
export type {
  ParsedImage,
  ImagesByProject,
  ImagesByTypeAndProject,
  RawImage
} from '@/lib/utils/image-parser';

export interface ImageRepository {
  host: string;
  hostname?: string;
  [key: string]: string | undefined;
}

export interface ContextResponse {
  cores: {
    default: number;
    defaultRequest: number;
    defaultLimit: number;
    defaultHeadless: number;
    options: number[];
  };
  memoryGB: {
    default: number;
    defaultRequest: number;
    defaultLimit: number;
    defaultHeadless: number;
    options: number[];
  };
  gpus: {
    options: number[];
  };
}

export interface SessionLaunchParams {
  sessionType: SessionType;
  sessionName: string;
  containerImage: string;
  cores?: number; // Optional - only for fixed resources
  ram?: number; // Optional - only for fixed resources
  gpus?: number; // Optional - only for fixed resources
  env?: Record<string, string>;
  cmd?: string;
  // Registry authentication for private/unknown images (Advanced tab)
  registryUsername?: string;
  registrySecret?: string;
}

/**
 * Transform SKAHA API response to normalized Session format
 */
function transformSkahaSession(skahaSession: SkahaSessionResponse): Session {
  return {
    id: skahaSession.id,
    sessionId: skahaSession.id,
    sessionType: skahaSession.type as SessionType,
    sessionName: skahaSession.name,
    status: skahaSession.status as SessionStatus,
    containerImage: skahaSession.image,
    startedTime: skahaSession.startTime,
    expiresTime: skahaSession.expiryTime,
    memoryUsage: skahaSession.ramInUse,
    memoryAllocated: skahaSession.requestedRAM || 'N/A',
    cpuUsage: skahaSession.cpuCoresInUse,
    cpuAllocated: skahaSession.requestedCPUCores || 'N/A',
    gpuAllocated: skahaSession.requestedGPUCores || '0',
    isFixedResources: skahaSession.isFixedResources,
    connectUrl: skahaSession.connectURL,
    requestedRAM: skahaSession.requestedRAM,
    requestedCPU: skahaSession.requestedCPUCores,
    requestedGPU: skahaSession.requestedGPUCores,
  };
}

/**
 * Get all active sessions for the current user
 */
export async function getSessions(): Promise<Session[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }

  const skahaResponse: SkahaSessionResponse[] = await response.json();
  return skahaResponse.map(transformSkahaSession);
}

/**
 * Get details for a specific session
 */
export async function getSession(sessionId: string): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session ${sessionId}: ${response.status}`);
  }

  const skahaResponse: SkahaSessionResponse = await response.json();
  return transformSkahaSession(skahaResponse);
}

/**
 * Launch a new session
 */
export async function launchSession(params: SessionLaunchParams): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Try to parse the error as JSON to extract a clean message
    try {
      const errorJson = JSON.parse(errorText);
      // Prefer details, then message, then error field
      const errorMessage = errorJson.details?.trim() || errorJson.message || errorJson.error || errorText;
      throw new Error(errorMessage);
    } catch (parseError) {
      // If JSON parsing fails (and it's not our thrown Error), use the raw text
      if (parseError instanceof Error && parseError.message !== errorText) {
        throw new Error(errorText || `Failed to launch session: ${response.status}`);
      }
      // Re-throw our clean error message
      throw parseError;
    }
  }

  const result = await response.json();

  // Return MINIMAL session info with only what API gave us
  // Polling will fetch full details after 30 seconds
  if (result.sessionId || result.id) {
    const sessionId = (result.sessionId || result.id).trim(); // Remove any whitespace/newlines
    return {
      id: sessionId,
      sessionId: sessionId,
      sessionType: params.sessionType,
      sessionName: result.sessionName || params.sessionName,
      status: 'Pending' as SessionStatus,
      // Leave everything else empty - will be populated by polling
      containerImage: '',
      startedTime: '',
      expiresTime: '',
      memoryAllocated: '',
      cpuAllocated: '',
      connectUrl: undefined,
    };
  }

  throw new Error('No session ID returned from API');
}

/**
 * Delete/terminate a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete session ${sessionId}: ${response.status}`);
  }
}

/**
 * Get platform load statistics
 */
export async function getPlatformLoad(): Promise<PlatformLoad> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/platform-load', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch platform load: ${response.status}`);
  }

  return response.json();
}

/**
 * Get available container images grouped by type and project
 */
export async function getContainerImages(): Promise<ImagesByTypeAndProject> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/images', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch container images: ${response.status}`);
  }

  return response.json();
}

/**
 * Get image repository hosts
 */
export async function getImageRepositories(): Promise<ImageRepository[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/repository', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image repositories: ${response.status}`);
  }

  return response.json();
}

/**
 * Get context information (available CPU cores and RAM for the user)
 */
export async function getContext(): Promise<ContextResponse> {
  const authHeaders = getAuthHeader();
  const response = await fetch('/api/sessions/context', {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch context: ${response.status}`);
  }

  return response.json();
}

/**
 * Get session logs
 */
export async function getSessionLogs(sessionId: string): Promise<string> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/logs`, {
    method: 'GET',
    headers: { 'Accept': 'text/plain', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs for session ${sessionId}: ${response.status}`);
  }

  return response.text();
}

/**
 * Get session events
 */
export async function getSessionEvents(sessionId: string): Promise<any[]> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/events`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events for session ${sessionId}: ${response.status}`);
  }

  return response.json();
}

/**
 * Extend session expiry time
 *
 * Note: SKAHA API uses the configured expiry time in skaha.sessionexpiry
 * The hours parameter is optional and currently not used by SKAHA
 */
export async function renewSession(
  sessionId: string,
  additionalHours?: number
): Promise<Session> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/sessions/${sessionId}/renew`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    },
    credentials: 'include',
    body: JSON.stringify({ hours: additionalHours }),
  });

  if (!response.ok) {
    throw new Error(`Failed to renew session ${sessionId}: ${response.status}`);
  }

  // Transform SKAHA response to normalized Session format
  const skahaResponse: SkahaSessionResponse = await response.json();
  return transformSkahaSession(skahaResponse);
}
