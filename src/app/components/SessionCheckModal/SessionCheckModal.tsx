import { SessionCheckModalImpl } from '@/app/implementation/sessionCheckModal';
import { SessionCheckModalProps } from '@/app/types/SessionCheckModalProps';

export const SessionCheckModal = (props: SessionCheckModalProps) => {
  return <SessionCheckModalImpl {...props} />;
};
