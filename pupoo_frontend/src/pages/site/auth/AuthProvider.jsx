import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { tokenStore } from "../../../app/http/tokenStore";
import { authApi } from "./api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    // ✅ 초기 1회: 메모리에 access 없으면 refresh로 복구 시도
    const bootstrap = async () => {
      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;

      try {
        const access = tokenStore.getAccess();
        if (access) {
          setIsAuthed(true);
          return;
        }

        // refresh_token은 HttpOnly 쿠키이므로 withCredentials 기반으로 서버에 복구 요청
        const res = await authApi.refresh(); 
        // res가 { accessToken } 형태라고 가정 (프로젝트 실제 응답에 맞춰 조정)
        if (res?.accessToken) {
          tokenStore.setAccess(res.accessToken);
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
        }
      } catch {
        setIsAuthed(false);
      } finally {
        setIsBootstrapped(true);
      }
    };

    bootstrap();
  }, []);

  // ✅ focus/visibility에서는 "강제로 false로 내리지 말기"
  // (메모리-only에서는 순간 null/레이스가 생기면 바로 로그아웃처럼 보임)
  useEffect(() => {
    const onFocus = () => {
      // access가 있으면 true로만 올려준다(없다고 해서 false로 내리지 않음)
      if (tokenStore.getAccess()) setIsAuthed(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (tokenStore.getAccess()) setIsAuthed(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
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