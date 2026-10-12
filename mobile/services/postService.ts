import type {
  Comment,
  Envelope,
  ImageFile,
  LikeResponse,
  Page,
  Post,
  SortMode,
} from "../types";
import { UPLOAD_TIMEOUT_MS } from "../utils/constants";
import { buildFormData } from "../utils/upload";
import api from "./api";

export async function getFeed(page = 1): Promise<Page<Post>> {
  const { data } = await api.get<Envelope<Page<Post>>>("/posts/feed/", { params: { page } });
  return data.data;
}

export async function getExplorePosts(sort: SortMode, page = 1): Promise<Page<Post>> {
  const { data } = await api.get<Envelope<Page<Post>>>("/posts/explore/", {
    params: { sort, page },
  });
  return data.data;
}

export async function getUserPosts(username: string, page = 1): Promise<Page<Post>> {
  const { data } = await api.get<Envelope<Page<Post>>>("/posts/", {
    params: { user: username, page },
  });
  return data.data;
}

export async function getPost(id: number): Promise<Post> {
  const { data } = await api.get<Envelope<Post>>(`/posts/${id}/`);
  return data.data;
}

export async function createPost(caption: string, media: ImageFile): Promise<Post> {
  const field = media.type.startsWith("video/") ? "video" : "image";
  const form = buildFormData({ caption }, field, media);
  const { data } = await api.post<Envelope<Post>>("/posts/", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data.data;
}

export async function updatePost(id: number, caption: string): Promise<Post> {
  const { data } = await api.patch<Envelope<Post>>(`/posts/${id}/`, { caption });
  return data.data;
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/posts/${id}/`);
}

export async function likePost(id: number): Promise<LikeResponse> {
  const { data } = await api.post<Envelope<LikeResponse>>(`/posts/${id}/like/`);
  return data.data;
}

export async function unlikePost(id: number): Promise<LikeResponse> {
  const { data } = await api.delete<Envelope<LikeResponse>>(`/posts/${id}/like/`);
  return data.data;
}

export async function getComments(postId: number, page = 1): Promise<Page<Comment>> {
  const { data } = await api.get<Envelope<Page<Comment>>>(`/posts/${postId}/comments/`, {
    params: { page },
  });
  return data.data;
}

export async function addComment(postId: number, text: string): Promise<Comment> {
  const { data } = await api.post<Envelope<Comment>>(`/posts/${postId}/comments/`, { text });
  return data.data;
}

export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/comments/${id}/`);
}
