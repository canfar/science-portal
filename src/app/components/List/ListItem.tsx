import React from 'react';
import { ListItemImplementation } from '@/app/implementation/list';
import { ListItemProps } from '@/app/types/ListItemProps';

export const ListItem: React.FC<ListItemProps> = (props) => {
  return <ListItemImplementation {...props} />;
};
