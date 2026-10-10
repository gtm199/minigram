import { ActivityIndicator, FlatList, RefreshControl } from "react-native";

import { usePaginated } from "../hooks/usePaginated";
import type { Page, UserMini } from "../types";
import { COLORS } from "../utils/constants";
import { ListSkeleton } from "./Loading";
import { EmptyState, ErrorState } from "./States";
import { UserCard } from "./UserCard";

interface Props {
  fetchPage: (page: number) => Promise<Page<UserMini>>;
  deps?: readonly unknown[];
  enabled?: boolean;
  emptyTitle: string;
  emptyMessage?: string;
}

export function UserList({ fetchPage, deps, enabled = true, emptyTitle, emptyMessage }: Props) {
  const list = usePaginated<UserMini>(fetchPage, { deps, enabled });

  const empty = list.loading ? (
    <ListSkeleton variant="row" count={5} />
  ) : list.error ? (
    <ErrorState message={list.error} onRetry={list.retry} />
  ) : (
    <EmptyState icon="people-outline" title={emptyTitle} message={emptyMessage} />
  );

  return (
    <FlatList
      data={list.items}
      keyExtractor={(user) => String(user.id)}
      renderItem={({ item }) => <UserCard user={item} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        enabled ? <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} /> : undefined
      }
      ListEmptyComponent={empty}
      ListFooterComponent={list.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
      contentContainerStyle={list.items.length === 0 ? { flexGrow: 1 } : undefined}
    />
  );
}
