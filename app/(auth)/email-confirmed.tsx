import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { Logo } from "@/components/ui/Logo";

export default function EmailConfirmedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Logo size={64} color="#FFFFFF" />
          </View>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <CheckCircle2 size={48} color="#2ECC71" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Email Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your email has been successfully verified.
          </Text>

          <Text style={styles.instructions}>
            You can now close this page and return to the app to sign in with your account.
          </Text>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/(auth)/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2ECC7115",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    maxWidth: 320,
  },
  primaryButton: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FAB300",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
});
