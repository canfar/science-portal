import React from 'react';
import { ResourceFieldProps } from '@/app/types/ResourceFieldProps';
import { ResourceFieldImpl } from '@/app/implementation/resourceField';

export const ResourceField = React.forwardRef<HTMLDivElement, ResourceFieldProps>((props, ref) => {
  return <ResourceFieldImpl ref={ref} {...props} />;
});

ResourceField.displayName = 'ResourceField';
