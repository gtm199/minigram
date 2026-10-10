import type { Post } from "../types";

/**
 * Tiny event bus so a like/comment/delete done on one screen is reflected
 * in every list that shows the same post, without a global store.
 */
export type PostPatch = Partial<Post> | ((post: Post) => Partial<Post>);

type Handler<T> = (payload: T) => void;
const listeners: Record<string, Set<Handler<any>>> = {};

function on<T>(event: string, handler: Handler<T>) {
  (listeners[event] ??= new Set()).add(handler);
  return () => {
    listeners[event].delete(handler);
  };
}

function emit<T>(event: string, payload: T) {
  listeners[event]?.forEach((handler) => handler(payload));
}

export function applyPostPatch(post: Post, patch: PostPatch): Post {
  return { ...post, ...(typeof patch === "function" ? patch(post) : patch) };
}

export const onPostUpdated = (h: Handler<{ id: number; patch: PostPatch }>) => on("post:updated", h);
export const emitPostUpdated = (id: number, patch: PostPatch) => emit("post:updated", { id, patch });

export const onPostDeleted = (h: Handler<number>) => on("post:deleted", h);
export const emitPostDeleted = (id: number) => emit("post:deleted", id);

export const onPostCreated = (h: Handler<void>) => on("post:created", h);
export const emitPostCreated = () => emit<void>("post:created", undefined);

export const onProfileUpdated = (h: Handler<void>) => on("profile:updated", h);
export const emitProfileUpdated = () => emit<void>("profile:updated", undefined);

export const onNotificationsRead = (h: Handler<void>) => on("notifications:read", h);
export const emitNotificationsRead = () => emit<void>("notifications:read", undefined);
