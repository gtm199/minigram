import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import { setSessionExpiredHandler } from "../services/api";
import * as authService from "../services/authService";
import { deleteAccount as deleteAccountRequest, getMe } from "../services/userService";
import type { RegisterPayload, User } from "../types";

export interface AuthContextValue {
  user: User | null;
  /** True until the stored session (if any) has been checked at app start. */
  initializing: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Called by the Axios interceptor when a token refresh fails.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (userRef.current) {
        Alert.alert("Session expired", "Please log in again.");
      }
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Restore the session on app start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await authService.hasStoredSession()) {
          const me = await getMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        // Auth failures are cleaned up by the interceptor; network errors leave us on Login.
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await authService.login(identifier, password);
    setUser(result.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await deleteAccountRequest(password);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, login, register, logout, deleteAccount, updateUser: setUser }),
    [user, initializing, login, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
