import { SessionRenewModalImpl } from '@/app/implementation/sessionRenewModal';
import { SessionRenewModalProps } from '@/app/types/SessionRenewModalProps';

export const SessionRenewModal = (props: SessionRenewModalProps) => {
  return <SessionRenewModalImpl {...props} />;
};
