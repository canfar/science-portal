'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoginCredentials } from '@/app/types/LoginModalProps';

export interface User {
  username: string;
  displayName: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login
      if (credentials.username && credentials.password) {
        const newUser: User = {
          username: credentials.username,
          displayName: credentials.username, // In real app, this would come from API
        };

        setUser(newUser);

        // Optionally store in localStorage if rememberMe is checked
        if (credentials.rememberMe) {
          localStorage.setItem('canfar_user', JSON.stringify(newUser));
        }
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem('canfar_user');
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}
