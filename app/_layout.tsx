import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { Colors } from "@/lib/constants";
import {
  registerForPushNotificationsAsync,
  savePushToken,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
} from "@/lib/notifications";
import { presenceManager } from "@/lib/presence";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const initializeTheme = useThemeStore((state) => state.initialize);
  const { user, profile, isAuthenticated } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initialize();
    initializeTheme();
  }, []);

  // Setup push notifications and presence when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Initialize presence tracking
      presenceManager.initialize(
        user.id,
        profile?.username || "User",
        profile?.avatar_url || null
      );

      // Register for push notifications
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          savePushToken(user.id, token);
        }
      });

      // Handle notification taps
      notificationListener.current = addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          
          // Navigate based on notification type
          if (data?.type === "message" && data?.groupId) {
            router.push(`/group/${data.groupId}` as any);
          } else if (data?.type === "call" && data?.callId) {
            router.push(`/call/${data.callId}?type=${data.callType}&groupId=${data.groupId}` as any);
          } else if (data?.type === "reminder" && data?.goalId) {
            router.push(`/goal/${data.goalId}` as any);
          }
        }
      );

      return () => {
        // Cleanup presence when component unmounts
        presenceManager.cleanup();
        
        if (notificationListener.current) {
          removeNotificationSubscription(notificationListener.current);
        }
      };
    }
  }, [isAuthenticated, user?.id, profile]);

  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="goal/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="create-goal"
          options={{
            presentation: "modal",
            headerShown: true,
            headerTitle: "New goal",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
    </>
  );
}

