import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await authService.currentUser();
      setUser(result.user);
      return result.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const logIn = useCallback(async (values) => {
    const result = await authService.logIn(values);
    setUser(result.user);
    return result.user;
  }, []);

  const signUp = useCallback(async (values) => {
    const result = await authService.signUp(values);
    setUser(result.user);
    return result.user;
  }, []);

  const logOut = useCallback(async () => {
    await authService.logOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, logIn, signUp, logOut, refreshUser }), [user, loading, logIn, signUp, logOut, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
