import { useLocalSearchParams } from "expo-router";

import { Screen } from "../../components/Screen";
import { UserList } from "../../components/UserList";
import { getFollowing } from "../../services/userService";

export default function FollowingScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <Screen>
      <UserList
        fetchPage={(page) => getFollowing(username, page)}
        deps={[username]}
        emptyTitle="Not following anyone yet"
      />
    </Screen>
  );
}
