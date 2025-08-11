import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await (supabase as any).rpc('is_super_admin', {
          user_id: user.id,
        });
        if (error) {
          console.error('Error checking super admin:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(!!data);
        }
      } catch (err) {
        console.error('Error checking super admin:', err);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user?.id]);

  return { isSuperAdmin, loading };
};
