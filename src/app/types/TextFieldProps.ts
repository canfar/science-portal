import { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField';

export interface TextFieldProps
  extends Omit<MuiTextFieldProps, 'size' | 'variant'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'standard';
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
}
