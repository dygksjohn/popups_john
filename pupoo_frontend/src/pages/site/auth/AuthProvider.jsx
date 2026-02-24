// AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "../../../app/http/tokenStore";
import { authApi } from "./api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(() => !!tokenStore.getAccess());

  // ✅ 현재 토큰 상태 찍는 헬퍼
  const snapshot = (tag) => {
    const access = tokenStore.getAccess();
    console.log(`[AuthProvider] ${tag}`, {
      isAuthed,
      hasAccess: !!access,
      accessHead: access ? String(access).slice(0, 12) + "..." : null,
      pathname: window.location.pathname,
      ts: new Date().toISOString(),
    });
  };

  useEffect(() => {
    snapshot("MOUNT");

    const sync = (reason) => {
      const has = !!tokenStore.getAccess();
      console.log(`[AuthProvider] sync(${reason}) -> setIsAuthed(${has})`);
      setIsAuthed(has);
    };

    // mount 1회
    sync("mount");

    const onFocus = () => sync("focus");
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync("visibility");
    };

    // (선택) 다른 탭/코드에서 localStorage 변하면 감지
    const onStorage = (e) => {
      if (e.key === "pupoo_access_token" || e.key === "pupoo_refresh_token") {
        console.log("[AuthProvider] storage event", {
          key: e.key,
          oldValueHead: e.oldValue
            ? String(e.oldValue).slice(0, 10) + "..."
            : null,
          newValueHead: e.newValue
            ? String(e.newValue).slice(0, 10) + "..."
            : null,
        });
        sync("storage");
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      console.log("[AuthProvider] UNMOUNT");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ isAuthed 변경 감지 로그
  useEffect(() => {
    snapshot("STATE_CHANGE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // ✅ 토큰 저장 직후는 true로 강제
  const login = () => {
    console.log("[AuthProvider] login() called -> setIsAuthed(true)");
    setIsAuthed(true);
    snapshot("AFTER login()");
  };

  const logoutLocal = () => {
    console.log("[AuthProvider] logoutLocal() called -> clear token");
    tokenStore.clear();
    setIsAuthed(false);
    snapshot("AFTER logoutLocal()");
  };

  const logout = async () => {
    console.log("[AuthProvider] logout() called -> call server");
    try {
      await authApi.logout();
      console.log("[AuthProvider] logout() server OK");
    } catch (e) {
      console.log("[AuthProvider] logout() server FAIL (ignored)", e?.message);
    } finally {
      tokenStore.clear();
      setIsAuthed(false);
      snapshot("AFTER logout()");
    }
  };

  const value = useMemo(
    () => ({ isAuthed, login, logout, logoutLocal }),
    [isAuthed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
