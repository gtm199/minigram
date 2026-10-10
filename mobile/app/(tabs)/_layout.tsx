import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

import { getUnreadCount } from "../../services/notificationService";
import { COLORS } from "../../utils/constants";
import { onNotificationsRead } from "../../utils/events";

const POLL_INTERVAL_MS = 30000;

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        if (active) setUnread(count);
      } catch {
        // The badge is non-essential; ignore failures.
      }
    };
    fetchCount();
    const timer = setInterval(fetchCount, POLL_INTERVAL_MS);
    const off = onNotificationsRead(() => setUnread(0));
    return () => {
      active = false;
      clearInterval(timer);
      off();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.muted,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "MiniGram",
          tabBarIcon: tabIcon("home", "home-outline"),
          headerRight: () => (
            <Pressable onPress={() => router.push("/search")} hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="search-outline" size={24} color={COLORS.text} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", tabBarIcon: tabIcon("compass", "compass-outline") }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "Create", headerTitle: "New post", tabBarIcon: tabIcon("add-circle", "add-circle-outline") }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: tabIcon("notifications", "notifications-outline"),
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon("person", "person-outline"),
          headerRight: () => (
            <Pressable onPress={() => router.push("/settings")} hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
