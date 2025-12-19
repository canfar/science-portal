import { TextFieldProps } from '@/app/types/TextFieldProps';
import { TextFieldImpl } from '@/app/implementation/textField';
import React from 'react';

export const TextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  (props, ref) => {
    return <TextFieldImpl ref={ref} {...props} />;
  }
);

TextField.displayName = 'TextField';
