// 10.0.2.2 is the Android emulator's alias for the host PC. A physical phone
// must use your PC's LAN IP via EXPO_PUBLIC_API_URL (see .env.example).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000/api";

export const COLORS = {
  background: "#FFFFFF",
  surface: "#F4F4F5",
  border: "#E4E4E7",
  text: "#18181B",
  muted: "#71717A",
  primary: "#4F46E5",
  primaryText: "#FFFFFF",
  danger: "#DC2626",
  like: "#E11D48",
  unread: "#EEF2FF",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const LIMITS = { caption: 2200, comment: 500, bio: 300 } as const;
export const SEARCH_DEBOUNCE_MS = 400;
export const REQUEST_TIMEOUT_MS = 15000;
export const UPLOAD_TIMEOUT_MS = 180000;
