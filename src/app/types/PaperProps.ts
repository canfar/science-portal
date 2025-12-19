import { PaperProps as MuiPaperProps } from '@mui/material/Paper';

export interface PaperProps extends MuiPaperProps {
  /**
   * The elevation level of the paper (0-24)
   * @default 1
   */
  elevation?: number;
  /**
   * The variant to use
   * @default 'elevation'
   */
  variant?: 'elevation' | 'outlined';
  /**
   * If true, the component will not have rounded corners
   * @default false
   */
  square?: boolean;
  /**
   * The content of the component
   */
  children?: React.ReactNode;
}
