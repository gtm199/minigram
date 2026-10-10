import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Comment } from "../types";
import { COLORS } from "../utils/constants";
import { timeAgo } from "../utils/format";
import { Avatar } from "./Avatar";

interface Props {
  comment: Comment;
  canDelete: boolean;
  onDelete: (comment: Comment) => void;
}

export function CommentItem({ comment, canDelete, onDelete }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push(`/user/${comment.user.username}`)}>
        <Avatar uri={comment.user.profile_picture} name={comment.user.username} size={36} />
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.username}>{comment.user.username} </Text>
          {comment.text}
        </Text>
        <Text style={styles.time}>{timeAgo(comment.created_at)}</Text>
      </View>
      {canDelete ? (
        <Pressable onPress={() => onDelete(comment)} hitSlop={10} accessibilityLabel="Delete comment">
          <Ionicons name="trash-outline" size={20} color={COLORS.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  content: { flex: 1, gap: 2 },
  text: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  username: { fontWeight: "700" },
  time: { fontSize: 12, color: COLORS.muted },
});
