// src/app/components/Checkbox/Checkbox.tsx
import { CheckboxProps } from '@/app/types/CheckboxProps';
import { CheckboxImpl } from '@/app/implementation/checkbox';
import React from 'react';

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (props, ref) => {
    return <CheckboxImpl ref={ref} {...props} />;
  }
);

Checkbox.displayName = 'Checkbox';
