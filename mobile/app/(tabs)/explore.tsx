import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PostGridItem } from "../../components/PostGridItem";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState } from "../../components/States";
import { SuggestionCard } from "../../components/SuggestionCard";
import { usePosts } from "../../hooks/usePosts";
import { getExplorePosts } from "../../services/postService";
import { getSuggestions } from "../../services/userService";
import type { SortMode, UserMini } from "../../types";
import { COLORS, RADIUS } from "../../utils/constants";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [sort, setSort] = useState<SortMode>("recent");
  const [suggestions, setSuggestions] = useState<UserMini[]>([]);
  const posts = usePosts((page) => getExplorePosts(sort, page), { deps: [sort] });

  useEffect(() => {
    getSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([])); // suggestions are optional
  }, []);

  const header = (
    <View>
      <Pressable style={styles.searchBar} onPress={() => router.push("/search")}>
        <Ionicons name="search-outline" size={20} color={COLORS.muted} />
        <Text style={styles.searchText}>Search people</Text>
      </Pressable>

      {suggestions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested for you</Text>
          <FlatList
            data={suggestions}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(user) => String(user.id)}
            renderItem={({ item }) => <SuggestionCard user={item} />}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      ) : null}

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSort(option.value)}
            style={[styles.pill, sort === option.value && styles.pillActive]}
          >
            <Text style={[styles.pillText, sort === option.value && styles.pillTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={posts.items}
        keyExtractor={(post) => String(post.id)}
        numColumns={3}
        renderItem={({ item }) => <PostGridItem post={item} />}
        ListHeaderComponent={header}
        onEndReached={posts.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={posts.refreshing} onRefresh={posts.refresh} />}
        ListEmptyComponent={
          posts.loading ? (
            <ActivityIndicator style={{ margin: 32 }} color={COLORS.primary} />
          ) : posts.error ? (
            <ErrorState message={posts.error} onRetry={posts.retry} />
          ) : (
            <EmptyState title="Nothing to explore yet" message="New posts from the community will show up here." />
          )
        }
        ListFooterComponent={posts.loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  searchText: { color: COLORS.muted, fontSize: 15 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginHorizontal: 16, marginBottom: 10 },
  sortRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  pillActive: { backgroundColor: COLORS.text },
  pillText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  pillTextActive: { color: COLORS.primaryText },
});
