import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Loading } from "../components/Loading";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";

function RootNavigator() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Auth gate: signed-out users only see (auth); signed-in users never do.
  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="user/[username]" options={{ title: "Profile" }} />
        <Stack.Screen name="comments/[postId]" options={{ title: "Comments", presentation: "modal" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
        <Stack.Screen name="edit-post/[id]" options={{ title: "Edit post" }} />
        <Stack.Screen name="followers/[username]" options={{ title: "Followers" }} />
        <Stack.Screen name="following/[username]" options={{ title: "Following" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
      {initializing ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background }]}>
          <Loading />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
