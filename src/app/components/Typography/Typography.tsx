import { TypographyProps } from '@/app/types/TypographyProps';
import { TypographyImpl } from '@/app/implementation/typography';
import React from 'react';

export const Typography: React.FC<TypographyProps> = (props) => {
  return <TypographyImpl {...props} />;
};
