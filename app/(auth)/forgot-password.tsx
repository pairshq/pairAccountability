import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react-native";
import { Logo } from "@/components/ui/Logo";
import { CleanInput } from "@/components/ui/CleanInput";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              {/* Success Icon */}
              <View style={styles.successIcon}>
                <CheckCircle2 size={48} color="#2ECC71" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We've sent a password reset link to{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              <Text style={styles.instructions}>
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </Text>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Back to Sign in</Text>
              </TouchableOpacity>

              {/* Resend */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setEmailSent(false);
                  handleResetPassword();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Didn't receive the email? Resend</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

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
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Logo */}
              <View style={styles.logoContainer}>
                <Logo size={64} color="#FFFFFF" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                No worries, we'll send you reset instructions.
              </Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Email Field */}
                <View style={styles.fieldContainer}>
                  <CleanInput
                    label="Email"
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.error}>{error}</Text>
                  </View>
                ) : null}

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? "Sending..." : "Reset password"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login")}
                  style={styles.footerLink}
                >
                  <ArrowLeft size={16} color="#6B6B6B" />
                  <Text style={styles.footerLinkText}>Back to Sign in</Text>
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
  backButton: {
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
  successIcon: {
    alignItems: "center",
    marginTop: 16,
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  instructions: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 8,
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
  primaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  resendButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  resendText: {
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
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLinkText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
});
