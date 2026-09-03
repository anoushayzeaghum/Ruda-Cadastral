import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AUTH_KEYS = ["accessToken", "refreshToken", "user", "sessionExpiresAt"];

const clearAuth = () => {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const getJwtExpiry = (token) => {
  if (!token) return 0;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return 0;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    const payload = JSON.parse(atob(padded));

    return payload?.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const getSessionExpiry = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return 0;

  const clientExpiry = Number(localStorage.getItem("sessionExpiresAt") || 0);

  const jwtExpiry = getJwtExpiry(token);

  if (clientExpiry && jwtExpiry) {
    return Math.min(clientExpiry, jwtExpiry);
  }

  return clientExpiry || jwtExpiry || 0;
};

const hasValidSession = () => {
  const token = localStorage.getItem("accessToken");
  const expiresAt = getSessionExpiry();

  if (!token || !expiresAt || Date.now() >= expiresAt) {
    clearAuth();
    return false;
  }

  return true;
};

export default function ProtectedRoute() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(() => hasValidSession());

  useEffect(() => {
    const checkSession = () => {
      setAuthenticated(hasValidSession());
    };

    checkSession();

    const expiresAt = getSessionExpiry();
    const remaining = expiresAt - Date.now();

    let expiryTimer;

    if (remaining > 0) {
      expiryTimer = window.setTimeout(() => {
        clearAuth();
        setAuthenticated(false);
      }, remaining + 100);
    }

    // Keeps different browser tabs synchronized.
    window.addEventListener("storage", checkSession);

    return () => {
      if (expiryTimer) {
        window.clearTimeout(expiryTimer);
      }

      window.removeEventListener("storage", checkSession);
    };
  }, [location.pathname, location.search, location.hash]);

  if (!authenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
