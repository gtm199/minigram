import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { KeyboardView } from "../components/KeyboardView";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState } from "../components/States";
import { useAuth } from "../hooks/useAuth";
import { usePaginated } from "../hooks/usePaginated";
import { getMessages, markConversationRead, sendMessage } from "../services/chatService";
import type { Message } from "../types";
import { COLORS, RADIUS } from "../utils/constants";
import { getErrorMessage } from "../utils/errors";
import { timeAgo } from "../utils/format";

const POLL_INTERVAL_MS = 4000;
const MAX_LENGTH = 1000;

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, mine ? styles.alignEnd : styles.alignStart]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={mine ? styles.mineText : styles.theirsText}>{message.text}</Text>
      </View>
      <Text style={styles.time}>{timeAgo(message.created_at)}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { id, username } = useLocalSearchParams<{ id: string; username?: string }>();
  const conversationId = Number(id);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // The API returns newest first, which is exactly what an inverted list needs.
  const messages = usePaginated<Message>((page) => getMessages(conversationId, page), {
    deps: [conversationId],
  });
  const { setItems } = messages;

  const itemsRef = useRef<Message[]>([]);
  itemsRef.current = messages.items;

  // While this screen is focused: mark messages read, then poll for new ones.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      markConversationRead(conversationId).catch(() => undefined);

      const timer = setInterval(async () => {
        try {
          const lastId = itemsRef.current[0]?.id ?? 0;
          const page = await getMessages(conversationId, 1, lastId);
          if (!active || page.results.length === 0) return;
          setItems((previous) => {
            const seen = new Set(previous.map((message) => message.id));
            const fresh = page.results.filter((message) => !seen.has(message.id));
            return fresh.length ? [...fresh, ...previous] : previous;
          });
          if (page.results.some((message) => message.sender.id !== user?.id)) {
            markConversationRead(conversationId).catch(() => undefined);
          }
        } catch {
          // A failed poll is harmless; the next one retries.
        }
      }, POLL_INTERVAL_MS);

      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [conversationId, setItems, user?.id]),
  );

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const message = await sendMessage(conversationId, value);
      setItems((previous) =>
        previous.some((item) => item.id === message.id) ? previous : [message, ...previous],
      );
      setText("");
    } catch (e) {
      Alert.alert("Couldn't send message", getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const empty = messages.loading ? (
    <ActivityIndicator style={{ margin: 32 }} color={COLORS.primary} />
  ) : messages.error ? (
    <ErrorState message={messages.error} onRetry={messages.retry} />
  ) : (
    // The list is flipped for chat order, so flip the empty state back.
    <View style={{ transform: [{ scaleY: -1 }], flex: 1 }}>
      <EmptyState icon="chatbubble-outline" title="No messages yet" message="Say hello!" />
    </View>
  );

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ title: username ?? "Chat" }} />
      <KeyboardView>
        <FlatList
          inverted
          style={{ flex: 1 }}
          data={messages.items}
          keyExtractor={(message) => String(message.id)}
          renderItem={({ item }) => <Bubble message={item} mine={item.sender.id === user?.id} />}
          onEndReached={messages.loadMore}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          ListEmptyComponent={empty}
          ListFooterComponent={
            messages.loadingMore ? <ActivityIndicator style={{ margin: 12 }} color={COLORS.primary} /> : null
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={COLORS.muted}
            maxLength={MAX_LENGTH}
            multiline
          />
          <Pressable onPress={send} disabled={!text.trim() || sending} hitSlop={8}>
            {sending ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={[styles.send, !text.trim() && styles.sendDisabled]}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { marginVertical: 4, maxWidth: "80%" },
  alignEnd: { alignSelf: "flex-end", alignItems: "flex-end" },
  alignStart: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.lg },
  mine: { backgroundColor: COLORS.primary },
  theirs: { backgroundColor: COLORS.surface },
  mineText: { color: COLORS.primaryText, fontSize: 15 },
  theirsText: { color: COLORS.text, fontSize: 15 },
  time: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    fontSize: 15,
    color: COLORS.text,
  },
  send: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  sendDisabled: { opacity: 0.4 },
});