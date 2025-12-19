// src/components/Card/CardActions.tsx
import { CardActionsProps } from '@/app/types/CardProps';
import { CardActionsImpl } from '@/app/implementation/card';
import React from 'react';

export const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  (props, ref) => {
    return <CardActionsImpl ref={ref} {...props} />;
  }
);

CardActions.displayName = 'CardActions';
