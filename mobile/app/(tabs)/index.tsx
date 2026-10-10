import { ActivityIndicator, FlatList, RefreshControl } from "react-native";

import { ListSkeleton } from "../../components/Loading";
import { PostCard } from "../../components/PostCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState } from "../../components/States";
import { usePosts } from "../../hooks/usePosts";
import { getFeed } from "../../services/postService";
import { COLORS } from "../../utils/constants";

export default function HomeScreen() {
  const posts = usePosts(getFeed);

  const empty = posts.loading ? (
    <ListSkeleton />
  ) : posts.error ? (
    <ErrorState message={posts.error} onRetry={posts.retry} />
  ) : (
    <EmptyState
      icon="people-outline"
      title="Your feed is empty"
      message="Follow people from Explore or Search to see their posts here."
    />
  );

  return (
    <Screen>
      <FlatList
        data={posts.items}
        keyExtractor={(post) => String(post.id)}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={posts.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={posts.refreshing} onRefresh={posts.refresh} />}
        ListEmptyComponent={empty}
        ListFooterComponent={posts.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
        contentContainerStyle={posts.items.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </Screen>
  );
}
