import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "../components/Button";
import { ChangePasswordSection } from "../components/ChangePasswordSection";
import { DeleteAccountSection } from "../components/DeleteAccountSection";
import { KeyboardView } from "../components/KeyboardView";
import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const confirmLogout = () => {
    Alert.alert("Log out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <KeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.signedIn}>Signed in as @{user?.username}</Text>

          <Pressable style={styles.row} onPress={() => router.push("/edit-profile")}>
            <Text style={styles.rowText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </Pressable>

          <View style={styles.divider} />
          <ChangePasswordSection />

          <Button title="Log out" variant="secondary" onPress={confirmLogout} />

          <View style={styles.divider} />
          <DeleteAccountSection />
        </ScrollView>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  signedIn: { color: COLORS.muted, fontSize: 14, marginBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowText: { fontSize: 16, color: COLORS.text, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 20 },
});
