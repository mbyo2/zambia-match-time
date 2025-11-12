
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null); // Critical for token refresh
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setting up auth listener
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.error('Error getting session:', error);
        } else {
          // Initial session loaded
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        logger.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes (never use async functions here to prevent deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      // Cleaning up auth listener
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    // Signing up user
    // CRITICAL: Always set emailRedirectTo to prevent auth issues
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: redirectUrl // Required for proper auth flow
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    // Signing in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // Signing out user
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Requesting password reset
    const redirectUrl = `${window.location.origin}/update-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { data, error };
  };

  const updateUserPassword = async (password: string) => {
    // Updating user password
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  };

  return {
    user,
    session, // Expose session for token management
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserPassword,
  };
};
