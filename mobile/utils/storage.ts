import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "minigram.access";
const REFRESH_KEY = "minigram.refresh";

let accessCache: string | null = null;
let refreshCache: string | null = null;
let loaded = false;

async function load() {
  if (loaded) return;
  accessCache = await SecureStore.getItemAsync(ACCESS_KEY);
  refreshCache = await SecureStore.getItemAsync(REFRESH_KEY);
  loaded = true;
}

export async function getAccessToken() {
  await load();
  return accessCache;
}

export async function getRefreshToken() {
  await load();
  return refreshCache;
}

export async function saveTokens(tokens: { access: string; refresh?: string }) {
  await load();
  accessCache = tokens.access;
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.access);
  if (tokens.refresh) {
    refreshCache = tokens.refresh;
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh);
  }
}

export async function clearTokens() {
  accessCache = null;
  refreshCache = null;
  loaded = true;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
