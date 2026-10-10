import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { UserMini } from "../types";
import { COLORS, RADIUS } from "../utils/constants";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";

export function SuggestionCard({ user }: { user: UserMini }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/user/${user.username}`)}>
      <Avatar uri={user.profile_picture} name={user.username} size={64} />
      <Text style={styles.username} numberOfLines={1}>
        {user.username}
      </Text>
      <View style={{ marginTop: 8 }}>
        <FollowButton username={user.username} initialFollowing={user.is_following} small />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 136,
    alignItems: "center",
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  username: { marginTop: 8, fontSize: 14, fontWeight: "600", color: COLORS.text, maxWidth: 110 },
});
