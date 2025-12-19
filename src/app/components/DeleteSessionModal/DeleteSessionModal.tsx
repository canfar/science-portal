import { DeleteSessionModalImpl } from '@/app/implementation/deleteSessionModal';
import { DeleteSessionModalProps } from '@/app/types/DeleteSessionModalProps';

export const DeleteSessionModal = (props: DeleteSessionModalProps) => {
  return <DeleteSessionModalImpl {...props} />;
};
