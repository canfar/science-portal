import { LaunchFormWidgetProps } from '@/app/types/LaunchFormWidgetProps';
import { LaunchFormWidgetImpl } from '@/app/implementation/launchFormWidget';

export function LaunchFormWidget(props: LaunchFormWidgetProps) {
  return <LaunchFormWidgetImpl {...props} />;
}
