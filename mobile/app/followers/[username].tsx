import { useLocalSearchParams } from "expo-router";

import { Screen } from "../../components/Screen";
import { UserList } from "../../components/UserList";
import { getFollowers } from "../../services/userService";

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <Screen>
      <UserList
        fetchPage={(page) => getFollowers(username, page)}
        deps={[username]}
        emptyTitle="No followers yet"
      />
    </Screen>
  );
}
