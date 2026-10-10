import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { usePosts } from "../hooks/usePosts";
import { getUserPosts } from "../services/postService";
import { getProfile } from "../services/userService";
import type { Profile } from "../types";
import { COLORS } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { onPostCreated, onPostDeleted, onProfileUpdated } from "../utils/events";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { FollowButton } from "./FollowButton";
import { Loading } from "./Loading";
import { EmptyState, ErrorState } from "./States";
import { PostGridItem } from "./PostGridItem";

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

export function ProfileView({ username }: { username: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const posts = usePosts((page) => getUserPosts(username, page), { deps: [username] });

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await getProfile(username));
      setProfileError(null);
    } catch (e) {
      setProfileError(getErrorMessage(e));
    }
  }, [username]);

  useEffect(() => {
    setProfile(null);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const offs = [onPostCreated(loadProfile), onPostDeleted(loadProfile), onProfileUpdated(loadProfile)];
    return () => offs.forEach((off) => off());
  }, [loadProfile]);

  const handleFollowChange = useCallback((isFollowing: boolean, followersCount: number) => {
    setProfile((current) =>
      current ? { ...current, is_following: isFollowing, followers_count: followersCount } : current,
    );
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadProfile(), posts.refresh()]);
  }, [loadProfile, posts.refresh]);

  if (!profile) {
    return profileError ? <ErrorState message={profileError} onRetry={loadProfile} /> : <Loading />;
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Avatar uri={profile.profile_picture} name={profile.username} size={86} />
        <View style={styles.stats}>
          <Stat value={profile.posts_count} label="Posts" />
          <Stat
            value={profile.followers_count}
            label="Followers"
            onPress={() => router.push(`/followers/${profile.username}`)}
          />
          <Stat
            value={profile.following_count}
            label="Following"
            onPress={() => router.push(`/following/${profile.username}`)}
          />
        </View>
      </View>

      <Text style={styles.username}>@{profile.username}</Text>
      {profile.full_name ? <Text style={styles.fullName}>{profile.full_name}</Text> : null}
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <View style={styles.actions}>
        {profile.is_me ? (
          <Button title="Edit Profile" variant="secondary" onPress={() => router.push("/edit-profile")} />
        ) : (
          <FollowButton
            username={profile.username}
            initialFollowing={profile.is_following}
            onChange={handleFollowChange}
          />
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={posts.items}
      keyExtractor={(post) => String(post.id)}
      numColumns={3}
      renderItem={({ item }) => <PostGridItem post={item} />}
      ListHeaderComponent={header}
      onEndReached={posts.loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={posts.refreshing} onRefresh={refreshAll} />}
      ListEmptyComponent={
        posts.loading ? (
          <ActivityIndicator style={{ margin: 32 }} color={COLORS.primary} />
        ) : posts.error ? (
          <ErrorState message={posts.error} onRetry={posts.retry} />
        ) : (
          <EmptyState title="No posts yet" message={profile.is_me ? "Share your first photo from the Create tab." : undefined} />
        )
      }
      ListFooterComponent={posts.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 4, marginBottom: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  stats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center", minWidth: 64 },
  statValue: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  statLabel: { fontSize: 13, color: COLORS.muted },
  username: { marginTop: 12, fontSize: 16, fontWeight: "700", color: COLORS.text },
  fullName: { fontSize: 14, color: COLORS.text },
  bio: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  actions: { marginTop: 12 },
});
