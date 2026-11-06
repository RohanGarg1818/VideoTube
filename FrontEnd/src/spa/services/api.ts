import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const configuredApiBase = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "");
const API_BASE_URL =
  configuredApiBase && !configuredApiBase.endsWith(":8080")
    ? configuredApiBase
    : import.meta.env.DEV
      ? ""
      : "http://localhost:8000";

export const API_ROOT = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

const ACCESS_KEY = "vt_access_token";
const REFRESH_KEY = "vt_refresh_token";

const safeStorage = {
  get(key: string) {
    try {
      return typeof window === "undefined" ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode) – cookies still carry the session */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const tokenStore = {
  getAccess: () => safeStorage.get(ACCESS_KEY),
  getRefresh: () => safeStorage.get(REFRESH_KEY),
  set: (access?: string | null, refresh?: string | null) => {
    if (access) safeStorage.set(ACCESS_KEY, access);
    if (refresh) safeStorage.set(REFRESH_KEY, refresh);
  },
  clear: () => {
    safeStorage.remove(ACCESS_KEY);
    safeStorage.remove(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = tokenStore.getAccess();
  if (token)
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  // Let the browser set the multipart boundary
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  // Uploads can take minutes – no timeout for them
  if (config.data instanceof FormData) config.timeout = 0;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh request (tokens are single-use). */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await axios.post(
        `${API_ROOT}/users/refresh-token`,
        { refreshToken: tokenStore.getRefresh() },
        { withCredentials: true },
      );
      const data = res.data?.data ?? {};
      tokenStore.set(data.accessToken, data.refreshToken);
      return data.accessToken ?? null;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

const AUTH_ROUTES = ["/users/login", "/users/register", "/users/refresh-token"];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const hadSession = Boolean(
      tokenStore.getRefresh() || tokenStore.getAccess(),
    );
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      hadSession &&
      !AUTH_ROUTES.some((r) => original.url?.includes(r))
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${token}`;
        return api.request(original);
      }
      // Session is gone – send the user to sign in, remembering where they were
      const here = window.location.pathname;
      if (!here.startsWith("/login"))
        window.location.href = `/login?next=${encodeURIComponent(here)}`;
    }
    return Promise.reject(error);
  },
);

export function unwrap<T = unknown>(payload: unknown): T {
  const p = payload as { data?: T } | T;
  if (p && typeof p === "object" && "data" in (p as object))
    return (p as { data: T }).data;
  return p as T;
}

export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
) {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK")
      return "Can't reach the server. Check your connection.";
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}
