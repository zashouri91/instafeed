"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, AuthError } from '@supabase/supabase-js';
import { getAuthErrorMessage } from '@/lib/utils/error-handler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error checking session:', error);
        setError(getAuthErrorMessage(error));
      } else if (session) {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('AuthProvider - Attempting sign in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('AuthProvider - Sign in result:', { 
        user: data.user ? 'User exists' : 'No user', 
        error 
      });
      
      if (error) {
        console.error('AuthProvider - Sign in error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('AuthProvider - No user returned after sign in');
        throw new Error('No user returned after sign in');
      }
      
      // Additional verification of user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthProvider - Current session:', session ? 'Active' : 'No session');
      
    } catch (error) {
      console.error('AuthProvider - Catch block error:', error);
      const message = getAuthErrorMessage(error);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      clearError();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      signIn, 
      signOut,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};