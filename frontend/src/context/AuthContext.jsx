import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get("/auth/profile/");
        if (active) setUser(response.data);
      } catch {
        tokenStore.clear();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function login(username, password) {
    const response = await api.post("/auth/login/", { username, password });
    tokenStore.set(response.data);
    const profile = await api.get("/auth/profile/");
    setUser(profile.data);
    return profile.data;
  }

  async function register(values) {
    const response = await api.post("/auth/register/", values);
    return response.data;
  }

  async function logout() {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }

  async function updateProfile(values) {
    const response = await api.patch("/auth/profile/", values);
    setUser(response.data);
    return response.data;
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
