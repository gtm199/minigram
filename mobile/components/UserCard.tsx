import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { UserMini } from "../types";
import { COLORS } from "../utils/constants";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";

export function UserCard({ user }: { user: UserMini }) {
  const router = useRouter();
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/user/${user.username}`)}>
      <Avatar uri={user.profile_picture} name={user.username} size={48} />
      <View style={styles.names}>
        <Text style={styles.username} numberOfLines={1}>
          {user.username}
        </Text>
        {user.full_name ? (
          <Text style={styles.fullName} numberOfLines={1}>
            {user.full_name}
          </Text>
        ) : null}
      </View>
      <FollowButton username={user.username} initialFollowing={user.is_following} small />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  names: { flex: 1 },
  username: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  fullName: { fontSize: 14, color: COLORS.muted },
});
