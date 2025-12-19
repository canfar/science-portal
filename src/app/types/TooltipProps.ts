import { TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

export interface TooltipProps extends Omit<MuiTooltipProps, 'onClick'> {
  onClick?: () => void;
  clickable?: boolean;
}
