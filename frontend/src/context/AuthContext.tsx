import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/utils/constants';
import { queryClient } from '@/main';
import type { AuthUser, LoginPayload } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount, verify the stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    authService
      .getMe()
      .then((freshUser) => {
        if (!cancelled) {
          setUser(freshUser);
          setToken(storedToken);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token: newToken, user: newUser } = await authService.login(payload);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors — clear state regardless
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      queryClient.clear();
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
