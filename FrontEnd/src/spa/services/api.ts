import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
const API_BASE_URL =
  configuredApiBase && !configuredApiBase.endsWith(":8080")
    ? configuredApiBase
    : import.meta.env.DEV
      ? ""
      : "http://localhost:8000";

const ACCESS_KEY = "vt_access_token";
const REFRESH_KEY = "vt_refresh_token";

export const tokenStore = {
  getAccess: () =>
    typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY),
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  set: (access?: string | null, refresh?: string | null) => {
    if (typeof window === "undefined") return;
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  
  const token = tokenStore.getAccess();
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData - let browser set multipart/form-data
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = tokenStore.getRefresh();
      const refreshBase = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";
      const res = await axios.post(
        `${refreshBase}/users/refresh-token`,
        { refreshToken },
        { withCredentials: true },
      );
      const data = res.data?.data ?? res.data ?? {};
      const access = data.accessToken ?? data.token ?? null;
      const refresh = data.refreshToken ?? null;
      tokenStore.set(access, refresh);
      return access;
    } catch (error) {
      console.error("Token refresh failed:", error);
      tokenStore.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/users/login") &&
      !original.url?.includes("/users/register") &&
      !original.url?.includes("/users/refresh-token")
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${token}`;
        return api.request(original);
      } else {
        // Redirect to login if refresh fails
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function unwrap<T = unknown>(payload: unknown): T {
  const p = payload as { data?: T } | T;
  if (p && typeof p === "object" && "data" in (p as object)) {
    return (p as { data: T }).data;
  }
  return p as T;
}

export function apiErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function isNotFoundError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    return err.response?.status === 404;
  }
  return false;
}