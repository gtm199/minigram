import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { COLORS, RADIUS } from "../utils/constants";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}

export function Button({ title, onPress, variant = "primary", loading, disabled, small }: Props) {
  const inactive = disabled || loading;
  const filled = variant !== "secondary";
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        (inactive || pressed) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? COLORS.primaryText : COLORS.text} />
      ) : (
        <Text style={[styles.text, small && styles.smallText, !filled && styles.secondaryText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  small: { minHeight: 34, paddingHorizontal: 14, borderRadius: RADIUS.sm },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  danger: { backgroundColor: COLORS.danger },
  dimmed: { opacity: 0.6 },
  text: { color: COLORS.primaryText, fontSize: 16, fontWeight: "600" },
  smallText: { fontSize: 14 },
  secondaryText: { color: COLORS.text },
});
