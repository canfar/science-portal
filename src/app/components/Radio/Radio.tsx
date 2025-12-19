// src/app/components/Radio/Radio.tsx
import { RadioProps } from '@/app/types/RadioProps';
import { RadioImpl } from '@/app/implementation/radio';
import React from 'react';

export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  (props, ref) => {
    return <RadioImpl ref={ref} {...props} />;
  }
);

Radio.displayName = 'Radio';
