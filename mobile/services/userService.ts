import type {
  Envelope,
  FollowResponse,
  ImageFile,
  Page,
  Profile,
  User,
  UserMini,
} from "../types";
import { UPLOAD_TIMEOUT_MS } from "../utils/constants";
import { clearTokens } from "../utils/storage";
import { buildFormData } from "../utils/upload";
import api from "./api";

export async function getMe(): Promise<User> {
  const { data } = await api.get<Envelope<User>>("/users/me/");
  return data.data;
}

export async function updateMe(
  fields: Record<string, string>,
  image?: ImageFile | null,
): Promise<User> {
  const form = buildFormData(fields, "profile_picture", image);
  const { data } = await api.patch<Envelope<User>>("/users/me/", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data.data;
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete("/users/me/", { data: { password } });
  await clearTokens();
}

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await api.get<Envelope<Profile>>(`/users/profile/${username}/`);
  return data.data;
}

export async function searchUsers(query: string, page = 1): Promise<Page<UserMini>> {
  const { data } = await api.get<Envelope<Page<UserMini>>>("/users/search/", {
    params: { q: query, page },
  });
  return data.data;
}

export async function getSuggestions(): Promise<UserMini[]> {
  const { data } = await api.get<Envelope<UserMini[]>>("/users/suggestions/");
  return data.data;
}

export async function followUser(username: string): Promise<FollowResponse> {
  const { data } = await api.post<Envelope<FollowResponse>>(`/users/${username}/follow/`);
  return data.data;
}

export async function unfollowUser(username: string): Promise<FollowResponse> {
  const { data } = await api.delete<Envelope<FollowResponse>>(`/users/${username}/follow/`);
  return data.data;
}

export async function getFollowers(username: string, page = 1): Promise<Page<UserMini>> {
  const { data } = await api.get<Envelope<Page<UserMini>>>(`/users/${username}/followers/`, {
    params: { page },
  });
  return data.data;
}

export async function getFollowing(username: string, page = 1): Promise<Page<UserMini>> {
  const { data } = await api.get<Envelope<Page<UserMini>>>(`/users/${username}/following/`, {
    params: { page },
  });
  return data.data;
}
