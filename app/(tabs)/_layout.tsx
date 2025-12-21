import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Home, Target, Users, User, Clock, Calendar, Inbox, Sun, Timer } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { Sidebar, PairLoader } from "@/components/ui";
import { useResponsive } from "@/hooks/useResponsive";
import { useFocusModeStore } from "@/stores/focusModeStore";
import { useAuthStore } from "@/stores/authStore";

export default function TabsLayout() {
  const colors = useColors();
  const { isDesktop } = useResponsive();
  const isFullscreen = useFocusModeStore((state) => state.isFullscreen);
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <PairLoader size={80} color={colors.accent} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Desktop: Show sidebar layout (hide sidebar in fullscreen focus mode)
  if (isDesktop || Platform.OS === "web") {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: isFullscreen ? "#0D0D0D" : colors.background }]}>
        {!isFullscreen && <Sidebar />}
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="upcoming" />
            <Tabs.Screen name="today" />
            <Tabs.Screen name="calendar" />
            <Tabs.Screen name="inbox" />
            <Tabs.Screen name="focus" />
            <Tabs.Screen name="goals" />
            <Tabs.Screen name="groups" />
            <Tabs.Screen name="communities" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
      </View>
    );
  }

  // Mobile: Show bottom tabs (limited to 5 main screens)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Sun size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <Inbox size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color, size }) => (
            <Target size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      {/* Hidden tabs - accessible via navigation */}
      <Tabs.Screen
        name="upcoming"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  desktopContent: {
    flex: 1,
    overflow: "hidden",
  },
});



