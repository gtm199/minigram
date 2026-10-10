import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { followUser, unfollowUser } from "../services/userService";
import { getErrorMessage } from "../utils/errors";

export function useFollow(
  username: string,
  initial: boolean,
  onChange?: (isFollowing: boolean, followersCount: number) => void,
) {
  const [isFollowing, setIsFollowing] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => setIsFollowing(initial), [initial]);

  const toggle = useCallback(async () => {
    if (loading) return;
    const next = !isFollowing;
    setIsFollowing(next); // optimistic
    setLoading(true);
    try {
      const result = next ? await followUser(username) : await unfollowUser(username);
      setIsFollowing(result.is_following);
      onChange?.(result.is_following, result.followers_count);
    } catch (e) {
      setIsFollowing(!next);
      Alert.alert("Couldn't update follow", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [loading, isFollowing, username, onChange]);

  return { isFollowing, loading, toggle };
}
