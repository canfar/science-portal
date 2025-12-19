import React from 'react';
import { ListImplementation } from '@/app/implementation/list';
import { ListProps } from '@/app/types/ListProps';

export const List: React.FC<ListProps> = (props) => {
  return <ListImplementation {...props} />;
};
