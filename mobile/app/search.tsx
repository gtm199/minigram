import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Screen } from "../components/Screen";
import { UserList } from "../components/UserList";
import { useDebounce } from "../hooks/useDebounce";
import { searchUsers } from "../services/userService";
import { COLORS, RADIUS, SEARCH_DEBOUNCE_MS } from "../utils/constants";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  // The API is only called once the user pauses typing.
  const debounced = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);

  return (
    <Screen>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={COLORS.muted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          placeholderTextColor={COLORS.muted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
          </Pressable>
        ) : null}
      </View>

      <UserList
        fetchPage={(page) => searchUsers(debounced, page)}
        deps={[debounced]}
        enabled={debounced.length > 0}
        emptyTitle={debounced ? "No users found" : "Search for people"}
        emptyMessage={debounced ? "Try a different name or username." : "Find people by username or name."}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
});
