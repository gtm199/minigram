import { useFollow } from "../hooks/useFollow";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./Button";

interface Props {
  username: string;
  initialFollowing: boolean;
  onChange?: (isFollowing: boolean, followersCount: number) => void;
  small?: boolean;
}

export function FollowButton({ username, initialFollowing, onChange, small }: Props) {
  const { user } = useAuth();
  const { isFollowing, loading, toggle } = useFollow(username, initialFollowing, onChange);

  if (user?.username === username) return null;

  return (
    <Button
      title={isFollowing ? "Following" : "Follow"}
      variant={isFollowing ? "secondary" : "primary"}
      onPress={toggle}
      disabled={loading}
      small={small}
    />
  );
}
