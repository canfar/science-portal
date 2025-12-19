export interface DeleteSessionModalProps {
  open: boolean;
  sessionName: string;
  sessionId: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}
