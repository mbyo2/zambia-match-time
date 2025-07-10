import { supabase } from '@/integrations/supabase/client';

export const cleanupFakeUsers = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_fake_users');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cleaning up fake users:', error);
    throw error;
  }
};

export const getAppStatistics = async () => {
  try {
    const { data, error } = await supabase.rpc('get_app_statistics');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting app statistics:', error);
    throw error;
  }
};

export const makeUserAdmin = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('make_user_admin', { user_email: email });
    if (error) throw error;
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
};