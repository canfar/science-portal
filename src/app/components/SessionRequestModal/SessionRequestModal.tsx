import { SessionRequestModalImpl } from '../../implementation/sessionRequestModal';
import { SessionRequestModalProps } from '../../types/SessionRequestModalProps';

/**
 * Modal component that displays session request progress and feedback
 *
 * @component
 * @example
 * ```tsx
 * <SessionRequestModal
 *   open={isRequesting}
 *   sessionName="notebook1"
 *   sessionType="notebook"
 *   onClose={() => setIsRequesting(false)}
 *   status="requesting"
 * />
 * ```
 */
export const SessionRequestModal = (props: SessionRequestModalProps) => {
  return <SessionRequestModalImpl {...props} />;
};
