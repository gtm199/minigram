import { Image, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../utils/constants";

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = "?", size = 40 }: Props) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimensions]} />;
  }
  return (
    <View style={[styles.fallback, dimensions]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: COLORS.surface },
  fallback: { backgroundColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  initial: { color: COLORS.muted, fontWeight: "700" },
});
