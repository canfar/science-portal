import { ListProps as MuiListProps } from '@mui/material/List';

export interface ListProps extends MuiListProps {
  /** Whether the list should have dense padding */
  dense?: boolean;
  /** Whether to disable padding on the list */
  disablePadding?: boolean;
  /** Custom variant for CANFAR-specific styling */
  variant?: 'default' | 'file-browser' | 'doi' | 'sessions';
}
