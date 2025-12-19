import { GridProps } from '@/app/types/GridProps';
import { GridImpl } from '@/app/implementation/grid';
import React from 'react';

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (props, ref) => {
    return <GridImpl ref={ref} {...props} />;
  }
);

Grid.displayName = 'Grid';
