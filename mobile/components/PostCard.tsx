import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useRef } from "react";
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { deletePost, likePost, unlikePost } from "../services/postService";
import type { Post } from "../types";
import { COLORS } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { emitPostDeleted, emitPostUpdated } from "../utils/events";
import { pluralize, timeAgo } from "../utils/format";
import { Avatar } from "./Avatar";
import { LikeButton } from "./LikeButton";

function PostCardComponent({ post }: { post: Post }) {
  const router = useRouter();
  const { user } = useAuth();
  const likeBusy = useRef(false);
  const isOwner = user?.id === post.user.id;

  const openProfile = () => router.push(`/user/${post.user.username}`);
  const openComments = () => router.push(`/comments/${post.id}`);

  const toggleLike = async () => {
    if (likeBusy.current) return;
    likeBusy.current = true;
    const wasLiked = post.is_liked;
    const delta = wasLiked ? -1 : 1;

    // Optimistic update, visible immediately in every list showing this post.
    emitPostUpdated(post.id, (current) => ({
      is_liked: !wasLiked,
      likes_count: Math.max(0, current.likes_count + delta),
    }));
    try {
      const result = wasLiked ? await unlikePost(post.id) : await likePost(post.id);
      emitPostUpdated(post.id, { is_liked: result.is_liked, likes_count: result.likes_count });
    } catch (e) {
      emitPostUpdated(post.id, (current) => ({
        is_liked: wasLiked,
        likes_count: Math.max(0, current.likes_count - delta),
      }));
      Alert.alert("Couldn't update like", getErrorMessage(e));
    } finally {
      likeBusy.current = false;
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(post.id);
            emitPostDeleted(post.id);
            Alert.alert("Post deleted successfully");
          } catch (e) {
            Alert.alert("Couldn't delete post", getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const showOptions = () => {
    if (isOwner) {
      Alert.alert("Post options", undefined, [
        { text: "Edit caption", onPress: () => router.push(`/edit-post/${post.id}`) },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert("Post options", undefined, [
        { text: "View profile", onPress: openProfile },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const sharePost = () => {
    Share.share({ message: `${post.user.username} on MiniGram: ${post.caption || "Check out this post"}` }).catch(
      () => undefined,
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.author} onPress={openProfile}>
          <Avatar uri={post.user.profile_picture} name={post.user.username} size={36} />
          <Text style={styles.username}>{post.user.username}</Text>
        </Pressable>
        <Pressable onPress={showOptions} hitSlop={10} accessibilityLabel="Post options">
          <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push(`/post/${post.id}`)}>
        <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
      </Pressable>

      <View style={styles.actions}>
        <LikeButton liked={post.is_liked} count={post.likes_count} onPress={toggleLike} />
        <Pressable style={styles.action} onPress={openComments} hitSlop={8} accessibilityLabel="Comments">
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
          <Text style={styles.count}>{post.comments_count}</Text>
        </Pressable>
        <Pressable onPress={sharePost} hitSlop={8} accessibilityLabel="Share">
          <Ionicons name="paper-plane-outline" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {post.caption ? (
          <Text style={styles.caption}>
            <Text style={styles.username}>{post.user.username} </Text>
            {post.caption}
          </Text>
        ) : null}
        {post.comments_count > 0 ? (
          <Pressable onPress={openComments}>
            <Text style={styles.viewComments}>
              View all {post.comments_count} {pluralize(post.comments_count, "comment")}
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
      </View>
    </View>
  );
}

export const PostCard = memo(PostCardComponent);

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  username: { fontWeight: "700", color: COLORS.text, fontSize: 14 },
  image: { width: "100%", aspectRatio: 1, backgroundColor: COLORS.surface },
  actions: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 12, paddingTop: 10 },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  count: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  body: { paddingHorizontal: 12, paddingTop: 8, gap: 4 },
  caption: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  viewComments: { fontSize: 14, color: COLORS.muted },
  time: { fontSize: 12, color: COLORS.muted },
});
