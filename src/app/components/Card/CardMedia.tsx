// src/components/Card/CardMedia.tsx
import { CardMediaProps } from '@/app/types/CardProps';
import { CardMediaImpl } from '@/app/implementation/card';
import React from 'react';

export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  (props, ref) => {
    return <CardMediaImpl ref={ref} {...props} />;
  }
);

CardMedia.displayName = 'CardMedia';
