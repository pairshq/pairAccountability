import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/types";
import type { Database } from "@/types/database";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    // If Supabase is not configured, skip initialization
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Running in demo mode.");
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth initialization timeout")), 5000)
      );

      const sessionPromise = supabase.auth.getSession();
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        set({
          user: { id: session.user.id, email: session.user.email! },
          profile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event, "Session:", session?.user?.email);
        
        // Check if this is an email confirmation - detect by URL or event
        const isEmailConfirmationCallback = typeof window !== "undefined" && 
          (window.location.href.includes("type=signup") || 
           window.location.href.includes("type=email") ||
           window.location.href.includes("token_hash") ||
           window.location.hash.includes("type=signup"));
        
        if (isEmailConfirmationCallback && session?.user) {
          // This is from clicking the email confirmation link
          // Create profile if needed, sign out, and stay on confirmation page
          console.log("Email confirmation callback detected");
          
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
          
          // Redirect to email-confirmed page
          if (typeof window !== "undefined" && !window.location.pathname.includes("email-confirmed")) {
            window.location.href = "/(auth)/email-confirmed";
          }
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          // Regular sign-in - check if profile exists
          let { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          // If no profile exists, create one from user metadata (e.g., Google OAuth)
          if (!profile && session.user.user_metadata) {
            const metadata = session.user.user_metadata;
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                email: session.user.email || "",
                id: session.user.id,
                username: metadata.username || session.user.email?.split("@")[0] || `user_${Date.now()}`,
                full_name: metadata.full_name || null,
                timezone: metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              })
              .select()
              .single();

            if (!createError) {
              profile = newProfile;
            }
          }

          set({
            user: { id: session.user.id, email: session.user.email! },
            profile,
            isAuthenticated: true,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Always set loading to false, even on error
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  signIn: async (emailOrUsername, password) => {
    let email = emailOrUsername;
    
    // Check if input is a username (doesn't contain @)
    if (!emailOrUsername.includes("@")) {
      // Look up email by username from profiles table
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", emailOrUsername.toLowerCase())
        .single();
      
      if (lookupError || !profile || !profile.email) {
        return { error: "Invalid username or password" };
      }
      
      email = profile.email;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Make error message more generic for security
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Invalid email/username or password" };
      }
      return { error: error.message };
    }
    
    return { error: null };
  },

  signUp: async (email, password, username, fullName) => {
    // Check if username is taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();

    if (existingUser) {
      return { error: "Username is already taken" };
    }

    // Sign up with user metadata - profile will be created after email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          full_name: fullName || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Check if user already exists (Supabase returns user with identities = [] for existing emails)
    // When email already exists, Supabase doesn't send a confirmation email and returns empty identities
    if (data?.user?.identities?.length === 0) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }

    // Also check if user was created but email_confirmed_at is already set (existing confirmed user)
    if (data?.user?.email_confirmed_at) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }

    return { error: null, needsEmailConfirmation: true };
  },

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: "Failed to sign in with Google" };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: "Not authenticated" };

    // Build update payload with only allowed fields
    const updatePayload: ProfileUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (updates.username !== undefined) updatePayload.username = updates.username;
    if (updates.full_name !== undefined) updatePayload.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) updatePayload.avatar_url = updates.avatar_url;
    if (updates.timezone !== undefined) updatePayload.timezone = updates.timezone;
    if ((updates as any).onboarding_completed !== undefined) (updatePayload as any).onboarding_completed = (updates as any).onboarding_completed;

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    // Refresh profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    set({ profile });
    return { error: null };
  },
}));

