import React from 'react';
import {
  DialogImplementation,
  DialogTitleImplementation,
  DialogContentImplementation,
  DialogActionsImplementation,
  DialogContentTextImplementation,
} from '@/app/implementation/dialog';
import type {
  DialogProps,
  DialogTitleProps,
  DialogContentProps,
  DialogActionsProps,
  DialogContentTextProps,
} from '@/app/types/DialogProps';

export const Dialog: React.FC<DialogProps> = (props) => {
  return <DialogImplementation {...props} />;
};

export const DialogTitle: React.FC<DialogTitleProps> = (props) => {
  return <DialogTitleImplementation {...props} />;
};

export const DialogContent: React.FC<DialogContentProps> = (props) => {
  return <DialogContentImplementation {...props} />;
};

export const DialogActions: React.FC<DialogActionsProps> = (props) => {
  return <DialogActionsImplementation {...props} />;
};

export const DialogContentText: React.FC<DialogContentTextProps> = (props) => {
  return <DialogContentTextImplementation {...props} />;
};
