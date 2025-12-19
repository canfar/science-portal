// src/components/SessionCard/SessionCard.tsx
import { SessionCardProps } from '@/app/types/SessionCardProps';
import { SessionCardImpl } from '@/app/implementation/sessionCard';
import React from 'react';

export const SessionCard = React.forwardRef<HTMLDivElement, SessionCardProps>(
  (props, ref) => {
    return <SessionCardImpl ref={ref} {...props} />;
  }
);

SessionCard.displayName = 'SessionCard';
