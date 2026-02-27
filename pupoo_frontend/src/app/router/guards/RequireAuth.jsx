import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../pages/site/auth/AuthProvider";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { isAuthed, isBootstrapped } = useAuth();

  // 초기 refresh 부트스트랩이 끝나기 전에는 라우팅 결정을 보류
  if (!isBootstrapped) {
    return null;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
