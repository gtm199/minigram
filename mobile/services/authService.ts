import type { AuthTokens, Envelope, LoginResponse, RegisterPayload } from "../types";
import { clearTokens, getRefreshToken, saveTokens } from "../utils/storage";
import api from "./api";

export async function hasStoredSession(): Promise<boolean> {
  return Boolean(await getRefreshToken());
}

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<Envelope<LoginResponse>>("/auth/login/", {
    username: identifier,
    password,
  });
  await saveTokens({ access: data.data.access, refresh: data.data.refresh });
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const { data } = await api.post<Envelope<LoginResponse>>("/auth/register/", payload);
  await saveTokens({ access: data.data.access, refresh: data.data.refresh });
  return data.data;
}

export async function logout(): Promise<void> {
  try {
    const refresh = await getRefreshToken();
    if (refresh) await api.post("/auth/logout/", { refresh });
  } catch {
    // Even if the server call fails, the local session must end.
  } finally {
    await clearTokens();
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
): Promise<void> {
  const { data } = await api.post<Envelope<AuthTokens>>("/auth/change-password/", {
    old_password: oldPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  });
  // The server revokes every old refresh token and returns fresh ones.
  await saveTokens({ access: data.data.access, refresh: data.data.refresh });
}
