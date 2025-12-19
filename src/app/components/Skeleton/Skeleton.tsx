// src/app/components/Skeleton/Skeleton.tsx
import React from 'react';
import { SkeletonProps } from '@/app/types/SkeletonProps';
import { SkeletonImpl } from '@/app/implementation/skeleton';

/**
 * Skeleton component for displaying loading placeholders
 *
 * Features:
 * - Multiple variants: text, circular, rectangular, rounded
 * - Customizable dimensions and animation
 * - Smooth pulse or wave animations
 * - Theme-aware coloring
 * - Accessible loading states
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" width="80%" height={20} />
 *
 * // Avatar skeleton
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * // Card skeleton
 * <Skeleton variant="rounded" width="100%" height={200} />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = (props) => {
  return <SkeletonImpl {...props} />;
};
