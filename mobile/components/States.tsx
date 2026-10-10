import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "../utils/constants";
import { Button } from "./Button";

export function EmptyState({
  icon = "images-outline",
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={COLORS.border} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={COLORS.border} />
      <Text style={styles.title}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: 16 }}>
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  title: { fontSize: 16, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  message: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
});
