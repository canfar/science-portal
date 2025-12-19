import React from 'react';
import { AlertImplementation } from '@/app/implementation/alert';
import { AlertProps } from '@/app/types/AlertProps';

export const Alert: React.FC<AlertProps> = (props) => {
  return <AlertImplementation {...props} />;
};
