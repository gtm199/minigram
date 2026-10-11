import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Avatar } from "../components/Avatar";
import { ListSkeleton } from "../components/Loading";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState } from "../components/States";
import { useAuth } from "../hooks/useAuth";
import { usePaginated } from "../hooks/usePaginated";
import { getConversations } from "../services/chatService";
import type { Conversation } from "../types";
import { COLORS } from "../utils/constants";
import { timeAgo } from "../utils/format";

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const { user } = useAuth();
  const last = conversation.last_message;
  const unread = conversation.unread_count > 0;
  const preview = last
    ? `${last.sender_id === user?.id ? "You: " : ""}${last.text}`
    : "Say hello";

  return (
    <Pressable
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: "/chat",
          params: { id: String(conversation.id), username: conversation.other_user.username },
        })
      }
    >
      <Avatar
        uri={conversation.other_user.profile_picture}
        name={conversation.other_user.username}
        size={48}
      />
      <View style={styles.text}>
        <Text style={styles.username}>{conversation.other_user.username}</Text>
        <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <View style={styles.meta}>
        {last ? <Text style={styles.time}>{timeAgo(last.created_at)}</Text> : null}
        {unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conversation.unread_count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const list = usePaginated<Conversation>(getConversations);
  const { refresh } = list;

  // Reload the inbox every time this screen comes into view (e.g. after leaving a chat).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const empty = list.loading ? (
    <ListSkeleton variant="row" count={5} />
  ) : list.error ? (
    <ErrorState message={list.error} onRetry={list.retry} />
  ) : (
    <EmptyState
      icon="chatbubbles-outline"
      title="No messages yet"
      message="Open someone's profile and tap Message to start a chat."
    />
  );

  return (
    <Screen>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
        ListEmptyComponent={empty}
        ListFooterComponent={
          list.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null
        }
        contentContainerStyle={list.items.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  text: { flex: 1, gap: 2 },
  username: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  preview: { fontSize: 14, color: COLORS.muted },
  previewUnread: { color: COLORS.text, fontWeight: "600" },
  meta: { alignItems: "flex-end", gap: 6 },
  time: { fontSize: 12, color: COLORS.muted },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: COLORS.primaryText, fontSize: 12, fontWeight: "700" },
});