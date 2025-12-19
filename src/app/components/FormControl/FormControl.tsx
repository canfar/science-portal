// src/app/components/FormControl/FormControl.tsx
import { FormControlProps } from '@/app/types/FormControlProps';
import { FormControlImpl } from '@/app/implementation/formControl';
import React from 'react';

export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  (props, ref) => {
    return <FormControlImpl ref={ref} {...props} />;
  }
);

FormControl.displayName = 'FormControl';
