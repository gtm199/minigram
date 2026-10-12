import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return <VideoView player={player} style={styles.fill} nativeControls contentFit="contain" />;
}

export function PostVideo({ uri }: { uri: string }) {
  const [started, setStarted] = useState(false);
  return (
    <View style={styles.box}>
      {started ? (
        <Player uri={uri} />
      ) : (
        <Pressable style={styles.fill} onPress={() => setStarted(true)} accessibilityLabel="Play video">
          <View style={styles.center}>
            <Ionicons name="play-circle" size={72} color="#FFFFFF" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: "100%", aspectRatio: 1, backgroundColor: "#000000" },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});