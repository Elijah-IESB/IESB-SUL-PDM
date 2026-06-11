import { Stack } from "expo-router";
import GlobalState from "../contexts/GlobalState";
import AppErrorBoundary from "../components/AppErrorBoundary";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <GlobalState>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GlobalState>
    </AppErrorBoundary>
  );
}
