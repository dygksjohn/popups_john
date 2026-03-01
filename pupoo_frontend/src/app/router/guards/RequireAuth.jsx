import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../pages/site/auth/AuthProvider";

function normalizeRole(role) {
  if (!role) return null;
  const asString = String(role).toUpperCase();
  return asString.startsWith("ROLE_") ? asString.slice(5) : asString;
}

export default function RequireAuth({ children, role: requiredRole = null }) {
  const location = useLocation();
  const { isAuthed, isBootstrapped, role } = useAuth();

  if (!isBootstrapped) {
    return null;
  }

  if (!isAuthed) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole) {
    const expected = normalizeRole(requiredRole);
    const current = normalizeRole(role);

    if (current !== expected) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
