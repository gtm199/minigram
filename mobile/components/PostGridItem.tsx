import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet } from "react-native";

import type { Post } from "../types";
import { COLORS } from "../utils/constants";

export function PostGridItem({ post }: { post: Post }) {
  const router = useRouter();
  return (
    <Pressable style={styles.cell} onPress={() => router.push(`/post/${post.id}`)}>
      <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { width: "33.3333%", aspectRatio: 1, padding: 1 },
  image: { flex: 1, backgroundColor: COLORS.surface },
});
