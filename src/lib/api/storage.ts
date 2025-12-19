/**
 * Storage Service API Client
 *
 * Handles all interactions with the CANFAR storage service (Cavern).
 * Uses Bearer token authentication from token storage.
 */

import { getAuthHeader } from '@/lib/auth/token-storage';

export interface UserStorageQuota {
  name: string;
  quota: number;
  used: number;
  available: number;
  unit: 'bytes' | 'GB';
}

export interface StorageNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
}

/**
 * Get user storage quota information
 */
export async function getUserStorageQuota(username: string): Promise<UserStorageQuota> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`/api/storage/quota/${username}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch storage quota: ${response.status}`);
  }

  return response.json();
}

/**
 * List files and directories in a path
 */
export async function listStorageNodes(
  username: string,
  path: string = ''
): Promise<StorageNode[]> {
  const authHeaders = getAuthHeader();
  const url = `/api/storage/files/${username}${path ? `?path=${encodeURIComponent(path)}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to list storage nodes: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  username: string,
  path: string,
  file: File
): Promise<void> {
  const authHeaders = getAuthHeader();
  const url = `/api/storage/files/${username}${path ? `?path=${encodeURIComponent(path)}` : ''}`;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders, // Don't include Content-Type for FormData, browser will set it
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status}`);
  }
}

/**
 * Delete a file or directory
 */
export async function deleteStorageNode(
  username: string,
  path: string
): Promise<void> {
  const authHeaders = getAuthHeader();
  const url = `/api/storage/files/${username}?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...authHeaders },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete storage node: ${response.status}`);
  }
}

/**
 * Create a directory
 */
export async function createDirectory(
  username: string,
  path: string
): Promise<void> {
  const authHeaders = getAuthHeader();
  const url = `/api/storage/files/${username}?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,
    },
    credentials: 'include',
    body: JSON.stringify({ type: 'directory' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create directory: ${response.status}`);
  }
}
