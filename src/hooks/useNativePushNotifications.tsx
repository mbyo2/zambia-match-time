import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NativePushState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  permission: 'prompt' | 'granted' | 'denied';
}

export const useNativePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<NativePushState>({
    isSupported: false,
    isRegistered: false,
    token: null,
    permission: 'prompt'
  });

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));
    checkPermissions();
    setupListeners();

    return () => {
      removeListeners();
    };
  }, [isNative]);

  const checkPermissions = async () => {
    if (!isNative) return;

    try {
      const result = await PushNotifications.checkPermissions();
      setState(prev => ({ 
        ...prev, 
        permission: result.receive as 'prompt' | 'granted' | 'denied'
      }));
    } catch (error) {
      console.error('Error checking push permissions:', error);
    }
  };

  const setupListeners = () => {
    if (!isNative) return;

    // On registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({ 
        ...prev, 
        isRegistered: true, 
        token: token.value 
      }));

      // Save token to database
      if (user) {
        await saveTokenToDatabase(token.value);
      }
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      toast({
        title: "Notification Setup Failed",
        description: "Could not register for push notifications",
        variant: "destructive",
      });
    });

    // On notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      
      // Show in-app toast for foreground notifications
      toast({
        title: notification.title || 'New Notification',
        description: notification.body || '',
      });
    });

    // On notification action performed (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      
      // Handle navigation based on notification data
      const data = action.notification.data;
      if (data?.type === 'match') {
        window.location.href = '/matches';
      } else if (data?.type === 'message') {
        window.location.href = `/matches?chat=${data.conversationId}`;
      }
    });
  };

  const removeListeners = async () => {
    if (!isNative) return;
    await PushNotifications.removeAllListeners();
  };

  const saveTokenToDatabase = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: { 
            type: 'native',
            token,
            platform: Capacitor.getPlatform()
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      toast({
        title: "Not Available",
        description: "Native push notifications require the mobile app",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        setState(prev => ({ ...prev, permission: 'granted' }));
        await register();
        return true;
      } else {
        setState(prev => ({ ...prev, permission: 'denied' }));
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your device settings",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  }, [isNative, toast]);

  const register = useCallback(async () => {
    if (!isNative) return;

    try {
      await PushNotifications.register();
    } catch (error) {
      console.error('Error registering for push:', error);
    }
  }, [isNative]);

  const unregister = useCallback(async () => {
    if (!isNative || !user) return;

    try {
      // Remove token from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      setState(prev => ({ 
        ...prev, 
        isRegistered: false, 
        token: null 
      }));

      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications",
      });
    } catch (error) {
      console.error('Error unregistering push:', error);
    }
  }, [isNative, user, toast]);

  // Auto-register when user logs in and permission is granted
  useEffect(() => {
    if (user && isNative && state.permission === 'granted' && !state.isRegistered) {
      register();
    }
  }, [user, isNative, state.permission, state.isRegistered, register]);

  return {
    ...state,
    isNative,
    requestPermission,
    register,
    unregister,
    isEnabled: state.permission === 'granted' && state.isRegistered
  };
};
