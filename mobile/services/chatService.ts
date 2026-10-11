import type { Conversation, Envelope, Message, Page } from "../types";
import api from "./api";

export async function getConversations(page = 1): Promise<Page<Conversation>> {
  const { data } = await api.get<Envelope<Page<Conversation>>>("/chats/", { params: { page } });
  return data.data;
}

export async function startConversation(username: string): Promise<Conversation> {
  const { data } = await api.post<Envelope<Conversation>>("/chats/", { username });
  return data.data;
}

export async function getMessages(
  conversationId: number,
  page = 1,
  after?: number,
): Promise<Page<Message>> {
  const { data } = await api.get<Envelope<Page<Message>>>(`/chats/${conversationId}/messages/`, {
    params: { page, after },
  });
  return data.data;
}

export async function sendMessage(conversationId: number, text: string): Promise<Message> {
  const { data } = await api.post<Envelope<Message>>(`/chats/${conversationId}/messages/`, { text });
  return data.data;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await api.post(`/chats/${conversationId}/read/`);
}

export async function getChatUnreadCount(): Promise<number> {
  const { data } = await api.get<Envelope<{ count: number }>>("/chats/unread-count/");
  return data.data.count;
}