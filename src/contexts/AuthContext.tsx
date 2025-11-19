/**
 * Authentication Context
 *
 * Manages user authentication state and provides auth-related functions
 * throughout the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import {
  signUp,
  signIn,
  logOut,
  resetPassword,
  getCurrentUser,
  getCurrentUserId,
  isAuthenticated as checkIsAuthenticated,
} from '../lib/firebase/auth';
import { getDocument } from '../lib/firebase/firestore';
import { User, CreateUserInput } from '../lib/types';

/**
 * Auth context value type
 */
interface AuthContextValue {
  // Current user state
  user: FirebaseUser | null;
  userDoc: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Auth functions
  signUp: (
    email: string,
    password: string,
    userData: Omit<CreateUserInput, 'email'>
  ) => Promise<{ user: FirebaseUser; userId: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  // Helper functions
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isPlanner: () => boolean;
  refreshUserDoc: () => Promise<void>;
}

/**
 * Create the context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user document from Firestore
   */
  const fetchUserDoc = async (uid: string): Promise<User | null> => {
    try {
      const doc = await getDocument<User>('users', uid);
      return doc;
    } catch (error) {
      console.error('Error fetching user document:', error);
      return null;
    }
  };

  /**
   * Refresh user document (useful after updates)
   */
  const refreshUserDoc = async () => {
    if (user) {
      const doc = await fetchUserDoc(user.uid);
      setUserDoc(doc);
    }
  };

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user document
        const doc = await fetchUserDoc(firebaseUser.uid);
        setUserDoc(doc);
      } else {
        setUserDoc(null);
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Sign up function
   */
  const handleSignUp = async (
    email: string,
    password: string,
    userData: Omit<CreateUserInput, 'email'>
  ) => {
    const result = await signUp(email, password, userData);

    // Fetch the user document
    const doc = await fetchUserDoc(result.userId);
    setUserDoc(doc);

    return result;
  };

  /**
   * Sign in function
   */
  const handleSignIn = async (email: string, password: string) => {
    const { user: firebaseUser, userDoc: doc } = await signIn(email, password);

    // State will be updated by onAuthStateChanged
    // But we can update userDoc immediately
    setUserDoc(doc);
  };

  /**
   * Log out function
   */
  const handleLogOut = async () => {
    await logOut();
    // State will be updated by onAuthStateChanged
  };

  /**
   * Password reset function
   */
  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return userDoc?.role === role;
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return userDoc?.permissions?.includes(permission) ?? false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return userDoc?.role === 'admin';
  };

  /**
   * Check if user is planner
   */
  const isPlanner = (): boolean => {
    return userDoc?.role === 'planner' || userDoc?.role === 'admin';
  };

  /**
   * Context value
   */
  const value: AuthContextValue = {
    user,
    userDoc,
    loading,
    isAuthenticated: !!user,
    signUp: handleSignUp,
    signIn: handleSignIn,
    logOut: handleLogOut,
    resetPassword: handleResetPassword,
    hasRole,
    hasPermission,
    isAdmin,
    isPlanner,
    refreshUserDoc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to require authentication
 * Throws error if not authenticated (use with ErrorBoundary)
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    throw new Error('Authentication required');
  }

  return { user, loading };
}

/**
 * Hook to get current user ID (convenience)
 */
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.uid ?? null;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin();
}

/**
 * Hook to check if user is planner
 */
export function useIsPlanner(): boolean {
  const { isPlanner } = useAuth();
  return isPlanner();
}
