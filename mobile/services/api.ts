import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import type { Envelope } from "../types";
import { API_URL, REQUEST_TIMEOUT_MS } from "../utils/constants";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../utils/storage";

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

let onSessionExpired: (() => void) | null = null;

/** AuthContext registers this so a failed refresh logs the user out and redirects to Login. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

const AUTH_PATHS = ["/auth/login/", "/auth/register/", "/auth/token/refresh/"];
const isAuthPath = (url?: string) => !!url && AUTH_PATHS.some((path) => url.includes(path));

// 1. Attach the access token.
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && !isAuthPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: concurrent 401s share one refresh call, which matters because
// the backend rotates and blacklists refresh tokens.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await getRefreshToken();
      if (!refresh) throw new Error("No refresh token");
      // Plain axios (not `api`) so this call can never re-enter the interceptor.
      const response = await axios.post<Envelope<{ access: string; refresh?: string }>>(
        `${API_URL}/auth/token/refresh/`,
        { refresh },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      const tokens = response.data.data;
      await saveTokens({ access: tokens.access, refresh: tokens.refresh });
      return tokens.access;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// 2-6. On 401: refresh once, retry the original request, otherwise clear auth and go to Login.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const unauthorized = error.response?.status === 401;

    // _retry + the auth-path check prevent infinite refresh loops.
    if (!unauthorized || !original || original._retry || isAuthPath(original.url)) {
      return Promise.reject(error);
    }
    original._retry = true;

    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      // Offline during refresh: keep the session, just fail this request.
      if (axios.isAxiosError(refreshError) && !refreshError.response) {
        return Promise.reject(refreshError);
      }
      await clearTokens();
      onSessionExpired?.();
      return Promise.reject(error);
    }
  },
);

export default api;
