import { RadioProps as MuiRadioProps } from '@mui/material/Radio';
import { RadioGroupProps as MuiRadioGroupProps } from '@mui/material/RadioGroup';
import { FormControlLabelProps } from '@mui/material/FormControlLabel';

export interface RadioProps extends Omit<MuiRadioProps, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>;
}

export interface RadioGroupProps extends MuiRadioGroupProps {
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  size?: 'sm' | 'md' | 'lg';
}
