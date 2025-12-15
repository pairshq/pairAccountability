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
import { X, Mail } from "lucide-react-native";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { Logo } from "@/components/ui/Logo";
import { CleanInput } from "@/components/ui/CleanInput";
import { useAuthStore } from "@/stores/authStore";

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailSignup = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(signUpError);
      setIsLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google sign-up
    console.log("Google sign-up");
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
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Choose how you want to sign up</Text>

              {!showEmailForm ? (
                <>
                  {/* Email Button */}
                  <TouchableOpacity
                    style={styles.authButton}
                    onPress={() => setShowEmailForm(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Mail size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.authButtonContent}>
                      <Text style={styles.authButtonText}>Continue with Email</Text>
                      <Text style={styles.authButtonSubtext}>
                        Sign up with your email address
                      </Text>
                    </View>
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
                    onPress={handleGoogleSignup}
                    activeOpacity={0.7}
                  >
                    <GoogleLogo size={20} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Email Form */}
                  <View style={styles.form}>
                    <CleanInput
                      label="Username"
                      placeholder="Choose a username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoComplete="username"
                    />

                    <CleanInput
                      label="Email"
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />

                    <CleanInput
                      label="Password"
                      placeholder="Create a password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="new-password"
                    />

                    {error ? (
                      <View style={styles.errorContainer}>
                        <Text style={styles.error}>{error}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                      onPress={handleEmailSignup}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.submitButtonText}>
                        {isLoading ? "Creating account..." : "Create account"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowEmailForm(false)}
                      style={styles.backButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text style={styles.footerLink}>Sign in</Text>
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
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonContent: {
    flex: 1,
  },
  authButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  authButtonSubtext: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 2,
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
  form: {
    marginTop: 8,
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
  submitButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  backButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    color: "#6B6B6B",
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
