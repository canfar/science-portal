import { LinearProgressProps as MuiLinearProgressProps } from '@mui/material/LinearProgress';

/**
 * Props for the LinearProgress component
 * Extends Material-UI LinearProgressProps with sensible defaults for indeterminate progress
 */
export interface LinearProgressProps extends MuiLinearProgressProps {
  /**
   * The variant of the progress indicator
   * @default 'indeterminate'
   */
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';

  /**
   * The color of the progress indicator
   * @default 'primary'
   */
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | 'inherit';
}
