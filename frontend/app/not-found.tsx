import { ErrorScreen } from '@/components/shared/error-screen';

export default function NotFound() {
  return (
    <ErrorScreen
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to the home page."
      showRetry={false}
      showHome={true}
    />
  );
}
