export interface SessionRenewModalProps {
  open: boolean;
  sessionName?: string;
  sessionId?: string;
  onClose: () => void;
  onConfirm?: (hours: number) => void | Promise<void>;
  isRenewing?: boolean;
}
