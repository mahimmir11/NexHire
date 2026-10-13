import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth.types';
import { authService } from '../services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check existing session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const storedToken = authService.getToken();
        if (storedToken) {
          const currentUser = await authService.getCurrentUser(storedToken);
          if (isMounted) {
            setUser(currentUser);
            setToken(storedToken);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
          authService.removeToken();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      if (response.user) {
        setUser(response.user);
        setToken(response.token || null);
        return response.user;
      }
      return null;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(errMsg);
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
