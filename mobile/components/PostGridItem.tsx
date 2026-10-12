import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";

import type { Post } from "../types";
import { COLORS } from "../utils/constants";

export function PostGridItem({ post }: { post: Post }) {
  const router = useRouter();
  return (
    <Pressable style={styles.cell} onPress={() => router.push(`/post/${post.id}`)}>
      {post.image ? (
        <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.videoBox]} />
      )}
      {post.media_type === "video" ? (
        <View style={styles.badge}>
          <Ionicons name="play" size={14} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { width: "33.3333%", aspectRatio: 1, padding: 1 },
  image: { flex: 1, backgroundColor: COLORS.surface },
  videoBox: { backgroundColor: "#111111" },
  badge: { position: "absolute", top: 8, right: 8 },
});