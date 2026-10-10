import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../../components/Avatar";
import { ListSkeleton } from "../../components/Loading";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState } from "../../components/States";
import { usePaginated } from "../../hooks/usePaginated";
import { getNotifications, markAllRead } from "../../services/notificationService";
import type { AppNotification, NotificationType } from "../../types";
import { COLORS } from "../../utils/constants";
import { emitNotificationsRead } from "../../utils/events";
import { timeAgo } from "../../utils/format";

const ACTION_TEXT: Record<NotificationType, string> = {
  LIKE: "liked your post.",
  COMMENT: "commented on your post.",
  FOLLOW: "started following you.",
};

function NotificationRow({ item }: { item: AppNotification }) {
  const router = useRouter();
  const open = () =>
    item.post ? router.push(`/post/${item.post.id}`) : router.push(`/user/${item.sender.username}`);

  return (
    <Pressable style={[styles.row, !item.is_read && styles.unread]} onPress={open}>
      <Avatar uri={item.sender.profile_picture} name={item.sender.username} size={44} />
      <View style={styles.text}>
        <Text style={styles.message}>
          <Text style={styles.username}>{item.sender.username} </Text>
          {ACTION_TEXT[item.notification_type]}
        </Text>
        <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
      </View>
      {item.post ? <Image source={{ uri: item.post.image }} style={styles.thumb} /> : null}
      {!item.is_read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const list = usePaginated<AppNotification>(getNotifications);
  const { refresh } = list;

  // Reload whenever the tab is focused; mark everything read when leaving it,
  // so unread items stay highlighted while the user is looking at them.
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        markAllRead()
          .then(emitNotificationsRead)
          .catch(() => undefined);
      };
    }, [refresh]),
  );

  const empty = list.loading ? (
    <ListSkeleton variant="row" count={6} />
  ) : list.error ? (
    <ErrorState message={list.error} onRetry={list.retry} />
  ) : (
    <EmptyState
      icon="notifications-outline"
      title="No notifications yet"
      message="Likes, comments and new followers will show up here."
    />
  );

  return (
    <Screen>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NotificationRow item={item} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
        ListEmptyComponent={empty}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
        contentContainerStyle={list.items.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  unread: { backgroundColor: COLORS.unread },
  text: { flex: 1, gap: 2 },
  message: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  username: { fontWeight: "700" },
  time: { fontSize: 12, color: COLORS.muted },
  thumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: COLORS.surface },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});
