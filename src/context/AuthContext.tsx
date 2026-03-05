import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: number;
  email: string;
  is_admin: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode: string, consentToPrivacyPolicy?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

const XHR_HEADER = { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" };

async function authRequest(url: string, body?: object): Promise<User> {
  const res = await fetch(url, {
    method: "POST",
    headers: XHR_HEADER,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authRequest("/api/auth/login", { email, password });
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, password: string, inviteCode: string, consentToPrivacyPolicy = false) => {
    const u = await authRequest("/api/auth/register", { email, password, inviteCode, consentToPrivacyPolicy });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: XHR_HEADER });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
