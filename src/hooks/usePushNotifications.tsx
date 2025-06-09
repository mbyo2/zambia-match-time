
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NotificationState {
  permission: NotificationPermission;
  registration: ServiceWorkerRegistration | null;
  subscription: PushSubscription | null;
  isSupported: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    registration: null,
    subscription: null,
    isSupported: false
  });

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: Notification.permission
    }));

    if (isSupported) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setState(prev => ({ ...prev, registration }));
      
      // Check for existing subscription
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setState(prev => ({ ...prev, subscription }));
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToPush();
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!state.registration || !user) return;

    try {
      const subscription = await state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY // You'll need to set this
      });

      setState(prev => ({ ...prev, subscription }));

      // Store subscription in database
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString()
        });

      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for new matches and messages",
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const unsubscribe = async () => {
    if (!state.subscription || !user) return;

    try {
      await state.subscription.unsubscribe();
      setState(prev => ({ ...prev, subscription: null }));

      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications",
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  const sendTestNotification = () => {
    if (state.permission === 'granted') {
      new Notification('MatchTime', {
        body: 'Test notification from MatchTime!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  return {
    ...state,
    requestPermission,
    subscribeToPush,
    unsubscribe,
    sendTestNotification,
    isEnabled: state.permission === 'granted' && state.subscription !== null
  };
};
