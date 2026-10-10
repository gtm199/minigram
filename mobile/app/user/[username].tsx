import { Stack, useLocalSearchParams } from "expo-router";

import { ProfileView } from "../../components/ProfileView";
import { Screen } from "../../components/Screen";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ title: username }} />
      <ProfileView username={username} />
    </Screen>
  );
}
