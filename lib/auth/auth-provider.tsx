'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          // Only redirect if we're not already on the login page
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          router.push('/chats');
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setUser(data.user);
      toast.success('Signed in successfully');
      router.push('/chats');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Invalid email or password');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}