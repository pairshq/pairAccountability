import { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useColors } from "@/lib/useColorScheme";
import { supabase } from "@/lib/supabase";
import { PairLoader } from "@/components/ui";

// Check for email confirmation immediately (before component renders)
const checkIsEmailConfirmation = (): boolean => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const url = window.location.href;
    const hash = window.location.hash;
    
    return (
      url.includes("type=signup") || 
      url.includes("type=email") ||
      url.includes("token_hash") ||
      url.includes("access_token") ||
      hash.includes("type=signup") ||
      hash.includes("access_token")
    );
  }
  return false;
};

// Run check immediately
const initialIsEmailConfirmation = checkIsEmailConfirmation();

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthStore();
  const colors = useColors();
  const [handlingConfirmation, setHandlingConfirmation] = useState(initialIsEmailConfirmation);

  useEffect(() => {
    if (!initialIsEmailConfirmation) return;
    
    console.log("Email confirmation detected - handling...");
    
    // Handle the confirmation - create profile and sign out
    const handleConfirmation = async () => {
      try {
        // Wait a moment for Supabase to process the token
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the session that was just created
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .single();
          
          if (!existingProfile) {
            // Create the profile with email for username login
            const metadata = session.user.user_metadata;
            await supabase.from("profiles").insert({
              id: session.user.id,
              email: session.user.email || "",
              username: metadata?.username || session.user.email?.split("@")[0] || `user_${Date.now()}`,
              full_name: metadata?.full_name || null,
              timezone: metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
          }
          
          // Sign out so user has to sign in manually
          await supabase.auth.signOut();
        }
        
        // Redirect to email-confirmed page
        window.location.href = "/(auth)/email-confirmed";
      } catch (error) {
        console.error("Error handling email confirmation:", error);
        window.location.href = "/(auth)/email-confirmed";
      }
    };
    
    handleConfirmation();
  }, []);

  // If this is an email confirmation, show loading and don't redirect anywhere else
  if (handlingConfirmation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PairLoader size={80} color={colors.accent} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PairLoader size={80} color={colors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

