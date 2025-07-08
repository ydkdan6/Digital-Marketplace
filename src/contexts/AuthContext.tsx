import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserProfile, getUserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id);
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      console.log('Profile refreshed:', userProfile);
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Clear any localStorage auth data to ensure we use database only
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('supabase.auth.token');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      
      console.log('Initial session:', session?.user?.id || 'No session');
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getUserProfile(session.user.id).then((profile) => {
          console.log('Initial profile loaded:', profile);
          setProfile(profile);
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No user');
        
        // Clear localStorage on any auth change to prevent conflicts
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('authToken');
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await getUserProfile(session.user.id);
          console.log('Profile loaded after auth change:', userProfile);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('AuthProvider: Signing out');
      
      // Clear all localStorage data
      localStorage.clear();
      
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      console.log('AuthProvider: Signout complete');
    } catch (error) {
      console.error('AuthProvider: Signout error:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};