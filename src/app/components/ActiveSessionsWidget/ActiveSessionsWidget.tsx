import { ActiveSessionsWidgetProps } from '@/app/types/ActiveSessionsWidgetProps';
import { ActiveSessionsWidgetImpl } from '@/app/implementation/activeSessionsWidget';

export function ActiveSessionsWidget(props: ActiveSessionsWidgetProps) {
  return <ActiveSessionsWidgetImpl {...props} />;
}
