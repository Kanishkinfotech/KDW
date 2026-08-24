import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        setAuthState('unauthenticated');
      }
    };
    
    checkAuth();
  }, []);

  const login = (userData: any) => {
    setUser(userData);
    setAuthState('authenticated');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout failed', e);
    }
    
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setAuthState('unauthenticated');
    const isAdminPage = window.location.pathname.startsWith('/admin');
    window.location.href = isAdminPage ? '/admin/login' : '/login';
  };

  const isAuthenticated = authState === 'authenticated';

  return (
    <AuthContext.Provider value={{ authState, isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
