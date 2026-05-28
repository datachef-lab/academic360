import { Redirect } from "expo-router";

/** `/console` has no screen content; send users to the tabbed home. */
export default function ConsoleIndex() {
  return <Redirect href="/console/(tabs)" />;
}
