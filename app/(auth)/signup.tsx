import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Mail, Check, AlertCircle, Loader2 } from "lucide-react-native";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { Logo } from "@/components/ui/Logo";
import { CleanInput } from "@/components/ui/CleanInput";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#E74C3C" };
  if (score <= 2) return { score, label: "Fair", color: "#F39C12" };
  if (score <= 3) return { score, label: "Good", color: "#FAB300" };
  return { score, label: "Strong", color: "#2ECC71" };
};

// Email validation
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Password strength
  const passwordStrength = getPasswordStrength(password);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username.toLowerCase())
          .single();
        
        setUsernameAvailable(!data);
      } catch {
        setUsernameAvailable(true); // Assume available if error (no match found)
      }
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Real-time email validation
  useEffect(() => {
    if (email && !isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }, [email]);

  // Real-time password match validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleEmailSignup = async () => {
    // Validate all fields
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await signUp(email, password, username, fullName);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Navigate to email verification page with email as param
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: email }
      } as any);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    
    const signInWithGoogle = useAuthStore.getState().signInWithGoogle;
    const { error: googleError } = await signInWithGoogle();
    
    if (googleError) {
      setError(googleError);
      setIsLoading(false);
    }
    // If successful, the OAuth flow will redirect automatically
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
                    {/* Full Name */}
                    <CleanInput
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoComplete="name"
                    />

                    {/* Username with availability indicator */}
                    <View style={styles.fieldWithStatus}>
                      <CleanInput
                        label="Username"
                        placeholder="Choose a username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoComplete="username"
                      />
                      {username.length >= 3 && (
                        <View style={styles.fieldStatus}>
                          {checkingUsername ? (
                            <Text style={styles.checkingText}>Checking...</Text>
                          ) : usernameAvailable === true ? (
                            <View style={styles.availableStatus}>
                              <Check size={14} color="#2ECC71" />
                              <Text style={styles.availableText}>Available</Text>
                            </View>
                          ) : usernameAvailable === false ? (
                            <View style={styles.unavailableStatus}>
                              <AlertCircle size={14} color="#E74C3C" />
                              <Text style={styles.unavailableText}>Taken</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>

                    {/* Email with validation */}
                    <CleanInput
                      label="Email"
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      error={emailError}
                    />

                    {/* Password with strength indicator */}
                    <View style={styles.fieldWithStatus}>
                      <CleanInput
                        label="Password"
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="new-password"
                      />
                      {password.length > 0 && (
                        <View style={styles.passwordStrength}>
                          <View style={styles.strengthBars}>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <View
                                key={level}
                                style={[
                                  styles.strengthBar,
                                  { backgroundColor: level <= passwordStrength.score ? passwordStrength.color : "#27272A" }
                                ]}
                              />
                            ))}
                          </View>
                          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                            {passwordStrength.label}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <CleanInput
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoComplete="new-password"
                      error={confirmPasswordError}
                    />

                    {/* Terms and Privacy */}
                    <TouchableOpacity
                      style={styles.termsContainer}
                      onPress={() => setAcceptedTerms(!acceptedTerms)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                        {acceptedTerms && <Check size={14} color="#000" />}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the{" "}
                        <Text style={styles.termsLink} onPress={() => Linking.openURL("https://pair.app/terms")}>
                          Terms of Service
                        </Text>
                        {" "}and{" "}
                        <Text style={styles.termsLink} onPress={() => Linking.openURL("https://pair.app/privacy")}>
                          Privacy Policy
                        </Text>
                      </Text>
                    </TouchableOpacity>

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
  // New styles for enhanced form
  fieldWithStatus: {
    marginBottom: 0,
  },
  fieldStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -12,
    marginBottom: 20,
    paddingLeft: 4,
  },
  checkingText: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  availableStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: "#2ECC71",
  },
  unavailableStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: "#E74C3C",
  },
  passwordStrength: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: -12,
    marginBottom: 20,
    paddingLeft: 4,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#FAB300",
    borderColor: "#FAB300",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#6B6B6B",
    lineHeight: 20,
  },
  termsLink: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
});
