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
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
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
        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

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

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { error: null };
  },

  signUp: async (email, password, username) => {
    // Check if username is taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();

    if (existingUser) {
      return { error: "Username is already taken" };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: username.toLowerCase(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (profileError) {
        return { error: profileError.message };
      }
    }

    return { error: null };
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

