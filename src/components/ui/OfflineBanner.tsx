import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Please check your internet connection. Some features may not work.
      </AlertDescription>
    </Alert>
  );
};
