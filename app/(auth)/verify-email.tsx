import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react-native";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { user } = useAuthStore();
  
  // Use email from params (from signup) or from user store (if already signed in)
  const userEmail = emailParam || user?.email || "";
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResendEmail = async () => {
    if (!userEmail) {
      setError("No email address found. Please sign up again.");
      return;
    }
    
    setIsResending(true);
    setError("");
    setResendSuccess(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setError("Failed to resend verification email");
    }

    setIsResending(false);
  };

  const handleCheckVerification = async () => {
    // Simply redirect to login - user will sign in and if email is verified, they'll proceed
    // If not verified, Supabase will show an error during sign in
    router.replace("/(auth)/login" as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Logo size={64} color="#FFFFFF" />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Mail size={48} color="#FAB300" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to{"\n"}
            <Text style={styles.emailHighlight}>{userEmail || "your email"}</Text>
          </Text>

          <Text style={styles.instructions}>
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </Text>

          {/* Success Message */}
          {resendSuccess && (
            <View style={styles.successContainer}>
              <CheckCircle2 size={16} color="#2ECC71" />
              <Text style={styles.successText}>Verification email sent!</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCheckVerification}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResendEmail}
            disabled={isResending}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="#6B6B6B" />
            <Text style={styles.secondaryButtonText}>
              {isResending ? "Sending..." : "Resend verification email"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Wrong email? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Sign up again</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#FAB30015",
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
    maxWidth: 320,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2ECC7115",
    borderWidth: 1,
    borderColor: "#2ECC7130",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: "#2ECC71",
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
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FAB300",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  footer: {
    flexDirection: "row",
    marginTop: 32,
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
