import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTH_CHANGE_EVENT,
  tokenStore,
} from "../../../app/http/tokenStore";
import { authApi } from "./api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;

      try {
        const access = tokenStore.getAccess();
        if (access) {
          setIsAuthed(true);
          return;
        }

        if (!tokenStore.hasSessionHint()) {
          setIsAuthed(false);
          return;
        }

        const res = await authApi.refresh();
        if (res?.accessToken) {
          tokenStore.setAccess(res.accessToken);
          setIsAuthed(true);
        } else {
          tokenStore.clear();
          setIsAuthed(false);
        }
      } catch {
        tokenStore.clear();
        setIsAuthed(false);
      } finally {
        setIsBootstrapped(true);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (tokenStore.getAccess()) setIsAuthed(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && tokenStore.getAccess()) {
        setIsAuthed(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthed(Boolean(tokenStore.getAccess()));
    };

    window.addEventListener(AUTH_CHANGE_EVENT, syncAuthState);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthState);
    };
  }, []);

  const login = () => setIsAuthed(true);

  const logoutLocal = () => {
    tokenStore.clear();
    setIsAuthed(false);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      setIsAuthed(false);
    }
  };

  const value = useMemo(
    () => ({ isAuthed, isBootstrapped, login, logout, logoutLocal }),
    [isAuthed, isBootstrapped],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
