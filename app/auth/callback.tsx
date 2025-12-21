import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { PairLoader } from "@/components/ui";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to be determined
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, redirect to main app
        router.replace("/(tabs)");
      } else {
        // Auth failed, redirect to login
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={styles.container}>
      <PairLoader size={80} color="#FAB300" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: "#6B6B6B",
  },
});
