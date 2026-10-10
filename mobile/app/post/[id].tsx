import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

import { Loading } from "../../components/Loading";
import { PostCard } from "../../components/PostCard";
import { Screen } from "../../components/Screen";
import { ErrorState } from "../../components/States";
import { usePost } from "../../hooks/usePosts";

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { post, loading, error, deleted, reload } = usePost(Number(id));
  const [refreshing, setRefreshing] = useState(false);

  // The post was deleted (from this screen's options menu): leave the screen.
  useEffect(() => {
    if (!deleted) return;
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [deleted, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (loading) return <Loading />;
  if (!post) return <ErrorState message={error ?? "Post not found"} onRetry={reload} />;

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <PostCard post={post} />
      </ScrollView>
    </Screen>
  );
}
