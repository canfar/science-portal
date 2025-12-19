import React from 'react';
import { PaperImplementation } from '@/app/implementation/paper';
import { PaperProps } from '@/app/types/PaperProps';

export const Paper = React.forwardRef<HTMLDivElement, PaperProps>(
  (props, ref) => {
    return <PaperImplementation ref={ref} {...props} />;
  }
);

Paper.displayName = 'Paper';
