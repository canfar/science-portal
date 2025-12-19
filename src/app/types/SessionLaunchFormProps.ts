export type SessionType =
  | 'notebook'
  | 'desktop'
  | 'carta'
  | 'contributed'
  | 'firefly';

export interface SessionFormData {
  type: SessionType;
  project: string;
  containerImage: string;
  sessionName: string;
  memory: number;
  cores: number;
  gpus?: number; // GPU cores (optional)
  resourceType?: 'flexible' | 'fixed'; // Track if resources are flexible or fixed
  // Advanced tab fields
  repositoryHost?: string;
  image?: string;
  repositoryAuthUsername?: string;
  repositoryAuthSecret?: string;
}

export interface SessionSettings {
  cores: number;
  memory: number;
}

import type { ImagesByTypeAndProject, Session } from '@/lib/api/skaha';

export interface SessionLaunchFormProps {
  onLaunch?: (data: SessionFormData) => void | Promise<void>;
  onReset?: () => void;
  onSessionTypeChange?: (sessionType: string) => void;
  imagesByType?: ImagesByTypeAndProject;
  repositoryHosts?: string[];
  memoryOptions?: number[];
  coreOptions?: number[];
  gpuOptions?: number[];
  defaultValues?: Partial<SessionFormData>;
  isLoading?: boolean;
  errorMessage?: string | null;
  activeSessions?: Session[];
}
