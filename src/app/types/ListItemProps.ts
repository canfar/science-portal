import { ListItemProps as MuiListItemProps } from '@mui/material/ListItem';

export interface ListItemProps extends MuiListItemProps {
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether to show a divider after this item */
  divider?: boolean;
  /** Custom variant for CANFAR-specific styling */
  variant?: 'default' | 'file' | 'doi' | 'session';
  /** Whether the item should be clickable */
  button?: boolean;
  /** Click handler for the item */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
}
