import axios, { type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

type Retryable = InternalAxiosRequestConfig & { _retry?: boolean };

// These never trigger a refresh. /auth/me is deliberately NOT here, so a page
// load with an expired access cookie recovers using the refresh cookie.
const NO_REFRESH = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/logout"];

let refreshing: Promise<unknown> | null = null;
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

apiClient.interceptors.response.use(undefined, async (error) => {
  const original = error.config as Retryable | undefined;

  if (
    error.response?.status !== 401 ||
    !original ||
    original._retry ||
    NO_REFRESH.some((p) => original.url?.startsWith(p))
  ) {
    throw error;
  }

  original._retry = true;
  try {
    // concurrent 401s share one refresh call
    refreshing ??= apiClient.post("/auth/refresh").finally(() => {
      refreshing = null;
    });
    await refreshing;
    return apiClient(original); // replay the original request with the new cookie
  } catch {
    onSessionExpired?.();
    throw error;
  }
});