import { SelectProps as MuiSelectProps } from '@mui/material/Select';
import { FormControlProps } from '@mui/material/FormControl';

export interface SelectProps extends Omit<MuiSelectProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  formControlProps?: Partial<FormControlProps>;
}
