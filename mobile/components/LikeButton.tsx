import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { COLORS } from "../utils/constants";

interface Props {
  liked: boolean;
  count: number;
  onPress: () => void;
}

export function LikeButton({ liked, count, onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.button} accessibilityLabel={liked ? "Unlike" : "Like"}>
      <Ionicons
        name={liked ? "heart" : "heart-outline"}
        size={26}
        color={liked ? COLORS.like : COLORS.text}
      />
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: "row", alignItems: "center", gap: 6 },
  count: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});
