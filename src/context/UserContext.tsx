import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAccount, AuthStore } from '../services/authStore';

type UserContextValue = {
  account: AuthAccount | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthAccount>;
  signUp: (account: Omit<AuthAccount, 'createdAt'>) => Promise<AuthAccount>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const snapshot = await AuthStore.loadSnapshot();
      setAccount(snapshot.account);
      setIsSignedIn(snapshot.isSignedIn);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user session';
      setError(message);
      setAccount(null);
      setIsSignedIn(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const nextAccount = await AuthStore.signIn(email, password);
      setAccount(nextAccount);
      setIsSignedIn(true);
      return nextAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (nextAccount: Omit<AuthAccount, 'createdAt'>) => {
    try {
      setError(null);
      const savedAccount = await AuthStore.signUp(nextAccount);
      setAccount(savedAccount);
      setIsSignedIn(true);
      return savedAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await AuthStore.signOut();
      setIsSignedIn(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      account,
      isSignedIn,
      isLoading,
      error,
      refresh,
      signIn,
      signUp,
      signOut,
    }),
    [account, error, isLoading, isSignedIn, refresh, signIn, signOut, signUp],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }

  return context;
};
