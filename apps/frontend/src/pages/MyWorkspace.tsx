import { useAuth } from "@/hooks/useAuth";

export default function MyWorkspacePage() {
  const { user } = useAuth();

  return (
    <div>
      <p>MyWorkspacePage</p>
      <p>Welcome {user?.name}</p>
    </div>
  );
}
