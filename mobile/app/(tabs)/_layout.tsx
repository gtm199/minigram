import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getChatUnreadCount } from "../../services/chatService";
import { getUnreadCount } from "../../services/notificationService";
import { COLORS } from "../../utils/constants";
import { onNotificationsRead } from "../../utils/events";

const POLL_INTERVAL_MS = 30000;

export default function TabsLayout() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchCount = async () => {
      try {
        const [notifications, chats] = await Promise.all([getUnreadCount(), getChatUnreadCount()]);
        if (active) {
          setUnread(notifications);
          setChatUnread(chats);
        }
      } catch {
        // The badges are non-essential; ignore failures.
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push("/search")} hitSlop={10}>
                <Ionicons name="search-outline" size={24} color={COLORS.text} />
              </Pressable>
              <Pressable onPress={() => router.push("/messages")} hitSlop={10}>
                <Ionicons name="paper-plane-outline" size={24} color={COLORS.text} />
                {chatUnread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{chatUnread > 9 ? "9+" : chatUnread}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          headerTitle: "New post",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
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

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", gap: 18, marginRight: 16 },
  badge: {
    position: "absolute",
    top: -6,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.like,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: COLORS.primaryText, fontSize: 10, fontWeight: "700" },
});