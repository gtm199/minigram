import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "../../components/Avatar";
import { CommentItem } from "../../components/CommentItem";
import { KeyboardView } from "../../components/KeyboardView";
import { ListSkeleton } from "../../components/Loading";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState } from "../../components/States";
import { useAuth } from "../../hooks/useAuth";
import { usePaginated } from "../../hooks/usePaginated";
import { addComment, deleteComment, getComments } from "../../services/postService";
import type { Comment } from "../../types";
import { COLORS, LIMITS, RADIUS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/errors";
import { emitPostUpdated } from "../../utils/events";

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const id = Number(postId);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const comments = usePaginated<Comment>((page) => getComments(id, page), { deps: [id] });
  const { setItems } = comments;

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const created = await addComment(id, value);
      setItems((previous) => [created, ...previous]);
      setText("");
      emitPostUpdated(id, (post) => ({ comments_count: post.comments_count + 1 }));
    } catch (e) {
      Alert.alert("Couldn't post comment", getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (comment: Comment) => {
    Alert.alert("Delete comment?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            setItems((previous) => previous.filter((item) => item.id !== comment.id));
            emitPostUpdated(id, (post) => ({ comments_count: Math.max(0, post.comments_count - 1) }));
          } catch (e) {
            Alert.alert("Couldn't delete comment", getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const empty = comments.loading ? (
    <ListSkeleton variant="row" count={4} />
  ) : comments.error ? (
    <ErrorState message={comments.error} onRetry={comments.retry} />
  ) : (
    <EmptyState icon="chatbubble-outline" title="No comments yet" message="Start the conversation." />
  );

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <KeyboardView>
        <FlatList
          style={{ flex: 1 }}
          data={comments.items}
          keyExtractor={(comment) => String(comment.id)}
          renderItem={({ item }) => (
            <CommentItem comment={item} canDelete={item.user.id === user?.id} onDelete={confirmDelete} />
          )}
          onEndReached={comments.loadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={comments.refreshing} onRefresh={comments.refresh} />}
          ListEmptyComponent={empty}
          ListFooterComponent={comments.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
          contentContainerStyle={comments.items.length === 0 ? { flexGrow: 1 } : undefined}
        />

        <View style={styles.composer}>
          <Avatar uri={user?.profile_picture} name={user?.username} size={34} />
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.muted}
            maxLength={LIMITS.comment}
            multiline
          />
          <Pressable onPress={submit} disabled={!text.trim() || sending} hitSlop={8}>
            {sending ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={[styles.post, !text.trim() && styles.postDisabled]}>Post</Text>
            )}
          </Pressable>
        </View>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    fontSize: 15,
    color: COLORS.text,
  },
  post: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  postDisabled: { opacity: 0.4 },
});
