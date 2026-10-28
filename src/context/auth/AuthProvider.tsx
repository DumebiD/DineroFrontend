import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, setSessionExpiredHandler } from "@/api/client";

type User = { id: string; firstName: string; lastName:string; email: string };

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true until the first /auth/me check finishes
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName:string, lastName:string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ask the server who we are. The browser sends the cookie automatically.
  useEffect(() => {
    apiClient.get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // If the session expires mid-use, any 401 from a non-auth endpoint logs the user out
//   useEffect(() => {
//     const id = apiClient.interceptors.response.use(
//       (res) => res,
//       (err) => {
//         if (err.response?.status === 401 && !err.config?.url?.startsWith("/auth/")) {
//           setUser(null);
//         }
//         return Promise.reject(err);
//       }
//     );
//     return () => apiClient.interceptors.response.eject(id);
//   }, []);

  useEffect(() => {
  setSessionExpiredHandler(() => setUser(null));
}, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<User>("/auth/login", { email, password });
    setUser(data);
  }, []);

  const signup = useCallback(async (firstName:string, lastName:string, email: string, password: string) => {
    const { data } = await apiClient.post<User>("/auth/signup", { firstName, lastName, email, password });
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout").catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an auth provider");
  return context;
}