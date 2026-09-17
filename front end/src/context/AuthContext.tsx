import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi, getAuthToken, clearAuthTokens, type UserProfile } from '../api';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  role: string | null;
  token: string | null;
  login: (userData: UserProfile, token?: string) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<UserProfile | null>;
  updateUser: (updatedData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());

  // Restore authenticated session on initial application mount
  const refreshSession = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        // Even if no token in localStorage, test session cookie
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setAuthState('authenticated');
          const customerKey = `cust_${res.user.id || res.user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey } }));
          return res.user;
        }
        setUser(null);
        setAuthState('unauthenticated');
        window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey: 'guest' } }));
        return null;
      }

      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setToken(currentToken);
        setAuthState('authenticated');
        const customerKey = `cust_${res.user.id || res.user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey } }));
        return res.user;
      } else {
        clearAuthTokens();
        setUser(null);
        setToken(null);
        setAuthState('unauthenticated');
        window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey: 'guest' } }));
        return null;
      }
    } catch (err) {
      clearAuthTokens();
      setUser(null);
      setToken(null);
      setAuthState('unauthenticated');
      window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey: 'guest' } }));
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Login handler
  const login = (userData: UserProfile, receivedToken?: string) => {
    if (receivedToken) {
      localStorage.setItem('authToken', receivedToken);
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setAuthState('authenticated');
    const customerKey = `cust_${userData.id || userData.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey } }));
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Non-blocking logout failure
    } finally {
      clearAuthTokens();
      setUser(null);
      setToken(null);
      setAuthState('unauthenticated');
      window.dispatchEvent(new CustomEvent('kdw:customer-changed', { detail: { customerKey: 'guest' } }));
      
      const isAdminPage = window.location.pathname.startsWith('/admin');
      if (isAdminPage) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
  };

  // Local user update
  const updateUser = (updatedData: Partial<UserProfile>) => {
    if (user) {
      const merged = { ...user, ...updatedData };
      setUser(merged);
      localStorage.setItem('user', JSON.stringify(merged));
    }
  };

  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        authState,
        isAuthenticated,
        isLoading,
        user,
        role,
        token,
        login,
        logout,
        refreshSession,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
