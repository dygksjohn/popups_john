import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "../../../app/http/tokenStore";
import { authApi } from "./api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(() => !!tokenStore.getAccess());

  useEffect(() => {
    setIsAuthed(!!tokenStore.getAccess());
  }, []);

  const login = () => setIsAuthed(true);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // 실패해도 로컬은 끊기
    } finally {
      tokenStore.clear();
      setIsAuthed(false);
    }
  };

  const value = useMemo(
    () => ({ isAuthed, setIsAuthed, login, logout }),
    [isAuthed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}