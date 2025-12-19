import { CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import { FormControlLabelProps } from '@mui/material/FormControlLabel';

export interface CheckboxProps extends Omit<MuiCheckboxProps, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>;
}
