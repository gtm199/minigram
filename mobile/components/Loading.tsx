import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, View, ViewStyle } from "react-native";

import { COLORS } from "../utils/constants";

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function Pulse({ style }: { style: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: COLORS.border, opacity }, style]} />;
}

function PostSkeleton() {
  return (
    <View style={styles.post}>
      <View style={styles.row}>
        <Pulse style={styles.circle} />
        <Pulse style={styles.bar} />
      </View>
      <Pulse style={styles.image} />
      <Pulse style={[styles.bar, { marginTop: 12, width: "60%" }]} />
    </View>
  );
}

function RowSkeleton() {
  return (
    <View style={[styles.row, { padding: 16 }]}>
      <Pulse style={styles.circle} />
      <Pulse style={styles.bar} />
    </View>
  );
}

export function ListSkeleton({ variant = "post", count = 2 }: { variant?: "post" | "row"; count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) =>
        variant === "post" ? <PostSkeleton key={index} /> : <RowSkeleton key={index} />,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  post: { marginBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  circle: { width: 40, height: 40, borderRadius: 20 },
  bar: { height: 12, width: "40%", borderRadius: 6 },
  image: { width: "100%", aspectRatio: 1 },
});
