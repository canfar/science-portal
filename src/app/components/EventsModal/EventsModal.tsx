import { EventsModalImpl } from '@/app/implementation/eventsModal';
import type { EventsModalProps } from '@/app/types/EventsModalProps';

/**
 * EventsModal component for displaying container startup logs
 *
 * This component shows Kubernetes events for a session in a modal dialog,
 * including container pulling, creation, and startup events.
 *
 * @example
 * ```tsx
 * <EventsModal
 *   open={showEvents}
 *   sessionId="session-abc123"
 *   sessionName="notebook1"
 *   onClose={() => setShowEvents(false)}
 * />
 * ```
 */
export const EventsModal = (props: EventsModalProps) => {
  return <EventsModalImpl {...props} />;
};
