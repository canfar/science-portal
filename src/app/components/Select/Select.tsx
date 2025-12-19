import { SelectProps } from '@/app/types/SelectProps';
import { SelectImpl } from '@/app/implementation/select';
import React from 'react';

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (props, ref) => {
    return <SelectImpl ref={ref} {...props} />;
  }
);

Select.displayName = 'Select';
