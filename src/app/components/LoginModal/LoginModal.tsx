import { LoginModalProps } from '@/app/types/LoginModalProps';
import { LoginModalImpl } from '@/app/implementation/loginModal';
import React from 'react';

export const LoginModal = React.forwardRef<HTMLDivElement, LoginModalProps>(
  (props, ref) => {
    return <LoginModalImpl ref={ref} {...props} />;
  }
);

LoginModal.displayName = 'LoginModal';
