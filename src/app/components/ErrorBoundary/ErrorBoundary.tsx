import { ErrorBoundaryProps } from '@/app/types/ErrorBoundaryProps';
import { ErrorBoundaryImplementation } from '@/app/implementation/errorBoundary';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryImplementation {...props} />;
}
