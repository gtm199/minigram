import { useCallback, useEffect, useState } from "react";

import { getPost } from "../services/postService";
import type { Page, Post } from "../types";
import { getErrorMessage } from "../utils/errors";
import {
  applyPostPatch,
  onPostCreated,
  onPostDeleted,
  onPostUpdated,
} from "../utils/events";
import { usePaginated } from "./usePaginated";

/** Paginated list of posts that stays in sync with likes, comments, edits and deletes elsewhere. */
export function usePosts(
  fetchPage: (page: number) => Promise<Page<Post>>,
  options?: { deps?: readonly unknown[] },
) {
  const list = usePaginated<Post>(fetchPage, options);
  const { setItems, refresh } = list;

  useEffect(() => {
    const offUpdated = onPostUpdated(({ id, patch }) =>
      setItems((previous) =>
        previous.map((post) => (post.id === id ? applyPostPatch(post, patch) : post)),
      ),
    );
    const offDeleted = onPostDeleted((id) =>
      setItems((previous) => previous.filter((post) => post.id !== id)),
    );
    const offCreated = onPostCreated(() => {
      refresh();
    });
    return () => {
      offUpdated();
      offDeleted();
      offCreated();
    };
  }, [setItems, refresh]);

  return list;
}

/** A single post (for Post Details / Edit Post) that also reacts to events. */
export function usePost(id: number) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const load = useCallback(async () => {
    try {
      setPost(await getPost(id));
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const offUpdated = onPostUpdated(({ id: postId, patch }) => {
      if (postId === id) setPost((current) => (current ? applyPostPatch(current, patch) : current));
    });
    const offDeleted = onPostDeleted((postId) => {
      if (postId === id) setDeleted(true);
    });
    return () => {
      offUpdated();
      offDeleted();
    };
  }, [id]);

  return { post, loading, error, deleted, reload: load };
}
