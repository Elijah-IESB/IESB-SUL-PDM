import { Stack } from "expo-router";
import GlobalState from "../contexts/GlobalState";

export default function RootLayout() {
  return (
    <GlobalState>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GlobalState>
  );
}