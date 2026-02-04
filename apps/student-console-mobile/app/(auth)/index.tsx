import { useTheme } from "@/hooks/use-theme";
import { Link } from "expo-router";
import { View } from "react-native";

export default function Index() {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
      <Link href="/console/(tabs)" className="text-2xl" style={{ color: theme.text }}>
        Go to Console Screen!
      </Link>
      <Link href="/onboarding" className="text-2xl" style={{ color: theme.text }}>
        Go to onboarding!
      </Link>
    </View>
  );
}
