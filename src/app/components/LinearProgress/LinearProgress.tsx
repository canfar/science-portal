import React from 'react';
import { LinearProgressProps } from '../../types/LinearProgressProps';
import { LinearProgressImpl } from '../../implementation/linearProgress';

/**
 * LinearProgress component for displaying loading progress
 *
 * Features:
 * - Indeterminate progress by default for loading states
 * - Customizable color variants using theme colors
 * - Consistent styling with rounded corners
 * - Supports all Material-UI LinearProgress variants
 *
 * @example
 * ```tsx
 * <LinearProgress />
 * <LinearProgress color="success" />
 * <LinearProgress variant="determinate" value={50} />
 * ```
 */
export const LinearProgress: React.FC<LinearProgressProps> = (props) => {
  return <LinearProgressImpl {...props} />;
};
