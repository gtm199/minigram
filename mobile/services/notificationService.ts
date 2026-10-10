import type { AppNotification, Envelope, Page } from "../types";
import api from "./api";

export async function getNotifications(page = 1): Promise<Page<AppNotification>> {
  const { data } = await api.get<Envelope<Page<AppNotification>>>("/notifications/", {
    params: { page },
  });
  return data.data;
}

export async function markAllRead(): Promise<void> {
  await api.post("/notifications/mark-read/");
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<Envelope<{ count: number }>>("/notifications/unread-count/");
  return data.data.count;
}
