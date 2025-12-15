import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { Logo } from "@/components/ui/Logo";
import { CleanInput } from "@/components/ui/CleanInput";
import { useAuthStore } from "@/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google sign-in
    console.log("Google sign-in");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Modal Card */}
            <View style={styles.modal}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.closeButton}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Logo */}
              <View style={styles.logoContainer}>
                <Logo size={64} color="#FFFFFF" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Email/Username Field */}
                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Email or Username</Text>
                  </View>
                  <CleanInput
                    placeholder="email@example.com or username"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />
                </View>

                {/* Password Field */}
                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity>
                      <Text style={styles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <CleanInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.error}>{error}</Text>
                  </View>
                ) : null}

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInButtonText}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Text>
                </TouchableOpacity>

                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>or</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Google Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.7}
                >
                  <GoogleLogo size={20} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                  <Text style={styles.footerLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#18181B",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  errorContainer: {
    backgroundColor: "#E74C3C15",
    borderWidth: 1,
    borderColor: "#E74C3C30",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: "#E74C3C",
  },
  signInButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#27272A",
  },
  separatorText: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#6B6B6B",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
  },
  footerText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  footerLink: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
