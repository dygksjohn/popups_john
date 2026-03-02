import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { tokenStore } from "../../../app/http/tokenStore";
import { onAuthLogout } from "../../../app/http/authEvents";
import { authApi } from "./api/authApi";

const AuthContext = createContext(null);

function syncMetaFromToken() {
  return {
    role: tokenStore.getRole(),
    userId: tokenStore.getUserId(),
  };
}

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;

      try {
        const access = tokenStore.getAccess();
        if (access) {
          const meta = syncMetaFromToken();
          setIsAuthed(true);
          setRole(meta.role);
          setUserId(meta.userId);
          return;
        }

        const refreshed = await authApi.refresh();
        if (refreshed?.accessToken) {
          tokenStore.setAccess(refreshed.accessToken, refreshed);
          const meta = syncMetaFromToken();
          setIsAuthed(true);
          setRole(meta.role);
          setUserId(meta.userId);
        } else {
          setIsAuthed(false);
          setRole(null);
          setUserId(null);
        }
      } catch {
        setIsAuthed(false);
        setRole(null);
        setUserId(null);
      } finally {
        setIsBootstrapped(true);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      tokenStore.clear();
      setIsAuthed(false);
      setRole(null);
      setUserId(null);
    });

    const onFocus = () => {
      if (!tokenStore.getAccess()) return;
      const meta = syncMetaFromToken();
      setIsAuthed(true);
      setRole(meta.role);
      setUserId(meta.userId);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!tokenStore.getAccess()) return;
      const meta = syncMetaFromToken();
      setIsAuthed(true);
      setRole(meta.role);
      setUserId(meta.userId);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const login = () => {
    const meta = syncMetaFromToken();
    setIsAuthed(true);
    setRole(meta.role);
    setUserId(meta.userId);
  };

  const logoutLocal = () => {
    tokenStore.clear();
    setIsAuthed(false);
    setRole(null);
    setUserId(null);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      setIsAuthed(false);
      setRole(null);
      setUserId(null);
    }
  };

  const value = useMemo(
    () => ({
      isAuthed,
      isBootstrapped,
      role,
      userId,
      login,
      logout,
      logoutLocal,
    }),
    [isAuthed, isBootstrapped, role, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
