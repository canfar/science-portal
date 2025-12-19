import { DialogProps as MuiDialogProps } from '@mui/material/Dialog';
import { DialogContentTextProps as MuiDialogContentTextProps } from '@mui/material/DialogContentText';
import { ReactNode } from 'react';

export interface DialogProps
  extends Omit<MuiDialogProps, 'children' | 'title'> {
  /**
   * Dialog title content
   */
  title?: ReactNode;
  /**
   * Dialog content
   */
  children: ReactNode;
  /**
   * Dialog action buttons
   */
  actions?: ReactNode;
  /**
   * If true, the dialog will be displayed fullscreen on mobile devices
   * @default false
   */
  fullScreenMobile?: boolean;
  /**
   * Callback fired when the component requests to be closed
   */
  onClose?: (
    event: React.SyntheticEvent | Event,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => void;
  /**
   * If true, the dialog is open
   */
  open: boolean;
  /**
   * The size of the dialog
   * @default 'sm'
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  /**
   * The id(s) of the element(s) that describe the dialog.
   */
  'aria-describedby'?: string;
  /**
   * The id(s) of the element(s) that label the dialog.
   */
  'aria-labelledby'?: string;
}

export interface DialogTitleProps {
  /**
   * The content of the title
   */
  children: ReactNode;
  /**
   * If true, shows a close button
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Callback fired when the close button is clicked
   */
  onClose?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface DialogContentProps {
  /**
   * The content to display
   */
  children: ReactNode;
  /**
   * If true, the content will include dividers
   * @default false
   */
  dividers?: boolean;
}

export interface DialogActionsProps {
  /**
   * The action buttons
   */
  children: ReactNode;
  /**
   * If true, the actions will be disabled and show a loading state
   * @default false
   */
  disableSpacing?: boolean;
}

export interface DialogContentTextProps extends MuiDialogContentTextProps {
  /**
   * The text content
   */
  children: ReactNode;
}
