export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  bio: string;
  profile_picture: string | null;
  date_joined: string;
}

/** Compact user shown in search results, follower lists and suggestions. */
export interface UserMini {
  id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  is_following: boolean;
}

export interface Profile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  bio: string;
  profile_picture: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_me: boolean;
}

export interface PostAuthor {
  id: number;
  username: string;
  profile_picture: string | null;
}

export interface Post {
  id: number;
  user: PostAuthor;
  image: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  user: PostAuthor;
  post: number;
  text: string;
  created_at: string;
}

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW";

export interface AppNotification {
  id: number;
  sender: PostAuthor;
  notification_type: NotificationType;
  post: { id: number; image: string } | null;
  is_read: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface FollowResponse {
  is_following: boolean;
  followers_count: number;
}

export interface LikeResponse {
  is_liked: boolean;
  likes_count: number;
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

export type SortMode = "recent" | "popular";
