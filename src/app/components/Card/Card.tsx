// src/components/Card/Card.tsx
import { CardProps } from '@/app/types/CardProps';
import { CardImpl } from '@/app/implementation/card';
import React from 'react';

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    return <CardImpl ref={ref} {...props} />;
  }
);

Card.displayName = 'Card';
