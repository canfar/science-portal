/**
 * TanStack Query hooks for User Storage
 *
 * Provides hooks for managing user storage, files, and directories.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  getUserStorageQuota,
  listStorageNodes,
  uploadFile,
  deleteStorageNode,
  createDirectory,
  type UserStorageQuota,
  type StorageNode,
} from '@/lib/api/storage';

/**
 * Query keys for storage
 */
export const storageKeys = {
  all: ['storage'] as const,
  quotas: () => [...storageKeys.all, 'quota'] as const,
  quota: (username: string) => [...storageKeys.quotas(), username] as const,
  nodes: () => [...storageKeys.all, 'nodes'] as const,
  nodeList: (username: string, path: string) =>
    [...storageKeys.nodes(), username, path] as const,
};

/**
 * Get user storage quota
 *
 * @param username - The username to fetch quota for
 * @param isAuthenticated - Whether the user is authenticated (optional)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: quota } = useUserStorageQuota('janedoe', authStatus?.authenticated);
 * ```
 */
export function useUserStorageQuota(
  username: string,
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<UserStorageQuota>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: storageKeys.quota(username),
    queryFn: () => getUserStorageQuota(username),
    // Only enable if username is provided and user is authenticated
    enabled: !!username && isAuthenticated !== false,
    // Refresh storage quota every 5 minutes
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * List storage nodes (files and directories)
 *
 * @example
 * ```tsx
 * const { data: files } = useStorageNodes('janedoe', '/data');
 * ```
 */
export function useStorageNodes(
  username: string,
  path: string = '',
  options?: Omit<UseQueryOptions<StorageNode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: storageKeys.nodeList(username, path),
    queryFn: () => listStorageNodes(username, path),
    enabled: !!username,
    ...options,
  });
}

/**
 * Upload a file
 *
 * @example
 * ```tsx
 * const { mutate: upload, isPending } = useUploadFile();
 *
 * upload({
 *   username: 'janedoe',
 *   path: '/data/analysis.csv',
 *   file: selectedFile,
 * });
 * ```
 */
export function useUploadFile(
  options?: UseMutationOptions<
    void,
    Error,
    { username: string; path: string; file: File }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, path, file }) => uploadFile(username, path, file),
    onSuccess: (_, { username, path }) => {
      // Extract directory path from file path
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      // Invalidate the directory listing
      queryClient.invalidateQueries({
        queryKey: storageKeys.nodeList(username, dirPath),
      });
      // Invalidate quota to show updated usage
      queryClient.invalidateQueries({
        queryKey: storageKeys.quota(username),
      });
    },
    ...options,
  });
}

/**
 * Delete a file or directory
 *
 * @example
 * ```tsx
 * const { mutate: deleteNode } = useDeleteStorageNode();
 *
 * deleteNode({
 *   username: 'janedoe',
 *   path: '/data/old-file.csv',
 * });
 * ```
 */
export function useDeleteStorageNode(
  options?: UseMutationOptions<void, Error, { username: string; path: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, path }) => deleteStorageNode(username, path),
    onSuccess: (_, { username, path }) => {
      // Extract directory path
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      // Invalidate the directory listing
      queryClient.invalidateQueries({
        queryKey: storageKeys.nodeList(username, dirPath),
      });
      // Invalidate quota to show updated usage
      queryClient.invalidateQueries({
        queryKey: storageKeys.quota(username),
      });
    },
    ...options,
  });
}

/**
 * Create a directory
 *
 * @example
 * ```tsx
 * const { mutate: createDir } = useCreateDirectory();
 *
 * createDir({
 *   username: 'janedoe',
 *   path: '/data/new-folder',
 * });
 * ```
 */
export function useCreateDirectory(
  options?: UseMutationOptions<void, Error, { username: string; path: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, path }) => createDirectory(username, path),
    onSuccess: (_, { username, path }) => {
      // Extract parent directory path
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      // Invalidate the parent directory listing
      queryClient.invalidateQueries({
        queryKey: storageKeys.nodeList(username, parentPath),
      });
    },
    ...options,
  });
}
