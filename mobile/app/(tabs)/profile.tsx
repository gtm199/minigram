import { ProfileView } from "../../components/ProfileView";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileTab() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Screen>
      <ProfileView username={user.username} />
    </Screen>
  );
}
