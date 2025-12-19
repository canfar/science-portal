import { AlertProps as MuiAlertProps } from '@mui/material/Alert';

export interface AlertProps extends Omit<MuiAlertProps, 'severity'> {
  severity: 'error' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
}
