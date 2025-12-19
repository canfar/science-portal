import React from 'react';
import { CanfarRangeProps } from '@/app/types/CanfarRangeProps';
import { CanfarRangeImpl } from '@/app/implementation/canfarRange';

export const CanfarRange = React.forwardRef<HTMLDivElement, CanfarRangeProps>(
  (props, ref) => {
    return <CanfarRangeImpl ref={ref} {...props} />;
  }
);

CanfarRange.displayName = 'CanfarRange';
