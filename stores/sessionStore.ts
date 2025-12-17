import { create } from "zustand";
import { supabase } from "@/lib/supabase";

// Session types
export type SessionType = "focus" | "recharge" | "accountability" | "coworking" | "other";
export type SessionMode = "video" | "audio" | "virtual_presence";
export type SessionStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface SessionStep {
  name: string;
  duration: number; // in minutes
  description?: string;
}

export interface FocusSession {
  id: string;
  title: string;
  description?: string;
  session_type: SessionType;
  session_mode: SessionMode;
  status: SessionStatus;
  host_id: string;
  start_time: string;
  end_time: string;
  duration: number; // total duration in minutes
  max_participants: number;
  has_waiting_room: boolean;
  requires_intention: boolean; // whether participants must add what they'll focus on
  structure: SessionStep[]; // the session flow/structure
  tags?: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  status: "registered" | "waiting" | "active" | "left" | "removed";
  intention?: string; // what the user plans to focus on
  joined_at?: string;
  left_at?: string;
  created_at: string;
}

export interface FocusSessionWithDetails extends FocusSession {
  host?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  participants?: {
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    status: string;
    intention?: string;
  }[];
  participant_count?: number;
  is_registered?: boolean;
}

interface SessionState {
  sessions: FocusSessionWithDetails[];
  mySessions: FocusSessionWithDetails[];
  currentSession: FocusSessionWithDetails | null;
  isLoading: boolean;
  isLoadingSession: boolean;
  selectedDate: Date;

  // Actions
  setSelectedDate: (date: Date) => void;
  fetchSessions: (date?: Date, type?: SessionType | "all") => Promise<void>;
  fetchMySessions: (userId: string) => Promise<void>;
  fetchSession: (sessionId: string, userId?: string) => Promise<void>;
  createSession: (
    userId: string,
    sessionData: Omit<FocusSession, "id" | "host_id" | "status" | "is_featured" | "created_at" | "updated_at">
  ) => Promise<{ error: string | null; session?: FocusSession }>;
  updateSession: (sessionId: string, updates: Partial<FocusSession>) => Promise<{ error: string | null }>;
  deleteSession: (sessionId: string) => Promise<{ error: string | null }>;
  registerForSession: (sessionId: string, userId: string) => Promise<{ error: string | null }>;
  unregisterFromSession: (sessionId: string, userId: string) => Promise<{ error: string | null }>;
  joinSession: (sessionId: string, userId: string, intention?: string) => Promise<{ error: string | null }>;
  leaveSession: (sessionId: string, userId: string) => Promise<{ error: string | null }>;
  updateParticipantIntention: (sessionId: string, userId: string, intention: string) => Promise<{ error: string | null }>;
  startSession: (sessionId: string) => Promise<{ error: string | null }>;
  endSession: (sessionId: string) => Promise<{ error: string | null }>;
  subscribeToSession: (sessionId: string) => () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  mySessions: [],
  currentSession: null,
  isLoading: false,
  isLoadingSession: false,
  selectedDate: new Date(),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  fetchSessions: async (date, type = "all") => {
    set({ isLoading: true });

    const targetDate = date || get().selectedDate;
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let query = (supabase as any)
      .from("focus_sessions")
      .select("*")
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .in("status", ["scheduled", "live"])
      .order("start_time", { ascending: true });

    if (type !== "all") {
      query = query.eq("session_type", type);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      set({ isLoading: false });
      return;
    }

    // Get host details and participant counts for each session
    const sessionsWithDetails: FocusSessionWithDetails[] = await Promise.all(
      (sessions || []).map(async (session: any) => {
        // Get host info
        const { data: host } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", session.host_id)
          .single();

        // Get participant count
        const { count } = await (supabase as any)
          .from("session_participants")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id)
          .in("status", ["registered", "waiting", "active"]);

        return {
          ...session,
          structure: typeof session.structure === "string" ? JSON.parse(session.structure) : session.structure || [],
          tags: typeof session.tags === "string" ? JSON.parse(session.tags) : session.tags || [],
          host,
          participant_count: count || 0,
        };
      })
    );

    set({ sessions: sessionsWithDetails, isLoading: false });
  },

  fetchMySessions: async (userId) => {
    set({ isLoading: true });

    // Get sessions user has registered for or is hosting
    const { data: participantRecords, error: participantError } = await (supabase as any)
      .from("session_participants")
      .select("session_id")
      .eq("user_id", userId)
      .in("status", ["registered", "waiting", "active"]);

    const participantSessionIds = (participantRecords || []).map((p: any) => p.session_id);

    // Get sessions user is hosting
    const { data: hostedSessions, error: hostedError } = await (supabase as any)
      .from("focus_sessions")
      .select("id")
      .eq("host_id", userId)
      .in("status", ["scheduled", "live"]);

    const hostedSessionIds = (hostedSessions || []).map((s: any) => s.id);

    const allSessionIds = [...new Set([...participantSessionIds, ...hostedSessionIds])];

    if (allSessionIds.length === 0) {
      set({ mySessions: [], isLoading: false });
      return;
    }

    const { data: sessions, error } = await (supabase as any)
      .from("focus_sessions")
      .select("*")
      .in("id", allSessionIds)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching my sessions:", error);
      set({ isLoading: false });
      return;
    }

    // Get details for each session
    const sessionsWithDetails: FocusSessionWithDetails[] = await Promise.all(
      (sessions || []).map(async (session: any) => {
        const { data: host } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", session.host_id)
          .single();

        const { count } = await (supabase as any)
          .from("session_participants")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id)
          .in("status", ["registered", "waiting", "active"]);

        return {
          ...session,
          structure: typeof session.structure === "string" ? JSON.parse(session.structure) : session.structure || [],
          tags: typeof session.tags === "string" ? JSON.parse(session.tags) : session.tags || [],
          host,
          participant_count: count || 0,
          is_registered: participantSessionIds.includes(session.id),
        };
      })
    );

    set({ mySessions: sessionsWithDetails, isLoading: false });
  },

  fetchSession: async (sessionId, userId) => {
    set({ isLoadingSession: true });

    const { data: session, error } = await (supabase as any)
      .from("focus_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      console.error("Error fetching session:", error);
      set({ isLoadingSession: false });
      return;
    }

    // Get host info
    const { data: host } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", session.host_id)
      .single();

    // Get participants
    const { data: participantRecords } = await (supabase as any)
      .from("session_participants")
      .select("id, user_id, status, intention")
      .eq("session_id", sessionId)
      .in("status", ["registered", "waiting", "active"]);

    // Get participant profiles
    const participants = await Promise.all(
      (participantRecords || []).map(async (p: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", p.user_id)
          .single();

        return {
          id: p.id,
          user_id: p.user_id,
          username: profile?.username || "Unknown",
          avatar_url: profile?.avatar_url || null,
          status: p.status,
          intention: p.intention,
        };
      })
    );

    // Check if current user is registered
    let is_registered = false;
    if (userId) {
      const userParticipant = participantRecords?.find((p: any) => p.user_id === userId);
      is_registered = !!userParticipant;
    }

    const sessionWithDetails: FocusSessionWithDetails = {
      ...session,
      structure: typeof session.structure === "string" ? JSON.parse(session.structure) : session.structure || [],
      tags: typeof session.tags === "string" ? JSON.parse(session.tags) : session.tags || [],
      host,
      participants,
      participant_count: participants.length,
      is_registered,
    };

    set({ currentSession: sessionWithDetails, isLoadingSession: false });
  },

  createSession: async (userId, sessionData) => {
    const newSession = {
      ...sessionData,
      host_id: userId,
      status: "scheduled",
      is_featured: false,
      structure: JSON.stringify(sessionData.structure),
      tags: JSON.stringify(sessionData.tags || []),
    };

    const { data, error } = await (supabase as any)
      .from("focus_sessions")
      .insert(newSession)
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return { error: error.message };
    }

    // Auto-register the host as a participant
    await (supabase as any)
      .from("session_participants")
      .insert({
        session_id: data.id,
        user_id: userId,
        status: "registered",
      });

    return { error: null, session: data };
  },

  updateSession: async (sessionId, updates) => {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.structure) {
      updateData.structure = JSON.stringify(updates.structure);
    }
    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    const { error } = await (supabase as any)
      .from("focus_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating session:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  deleteSession: async (sessionId) => {
    const { error } = await (supabase as any)
      .from("focus_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Error deleting session:", error);
      return { error: error.message };
    }

    set({
      sessions: get().sessions.filter((s) => s.id !== sessionId),
      mySessions: get().mySessions.filter((s) => s.id !== sessionId),
    });

    return { error: null };
  },

  registerForSession: async (sessionId, userId) => {
    // Check if session is full
    const session = get().sessions.find((s) => s.id === sessionId) || get().currentSession;
    if (session && session.participant_count && session.participant_count >= session.max_participants) {
      return { error: "Session is full" };
    }

    // Check if already registered
    const { data: existing } = await (supabase as any)
      .from("session_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return { error: "Already registered for this session" };
    }

    const { error } = await (supabase as any)
      .from("session_participants")
      .insert({
        session_id: sessionId,
        user_id: userId,
        status: "registered",
      });

    if (error) {
      console.error("Error registering for session:", error);
      return { error: error.message };
    }

    // Refresh session data
    await get().fetchSession(sessionId, userId);

    return { error: null };
  },

  unregisterFromSession: async (sessionId, userId) => {
    const { error } = await (supabase as any)
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error unregistering from session:", error);
      return { error: error.message };
    }

    // Refresh session data
    await get().fetchSession(sessionId, userId);

    return { error: null };
  },

  joinSession: async (sessionId, userId, intention) => {
    const session = get().currentSession;
    if (!session) {
      return { error: "Session not found" };
    }

    const newStatus = session.has_waiting_room ? "waiting" : "active";

    // First check if user has a participant record
    const { data: existingParticipant } = await (supabase as any)
      .from("session_participants")
      .select("id, status")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single();

    let error;

    if (existingParticipant) {
      // Update existing record
      const { error: updateError } = await (supabase as any)
        .from("session_participants")
        .update({
          status: newStatus,
          intention: intention || null,
          joined_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("user_id", userId);
      error = updateError;
    } else {
      // Insert new record (user joining without prior registration)
      const { error: insertError } = await (supabase as any)
        .from("session_participants")
        .insert({
          session_id: sessionId,
          user_id: userId,
          status: newStatus,
          intention: intention || null,
          joined_at: new Date().toISOString(),
        });
      error = insertError;
    }

    if (error) {
      console.error("Error joining session:", error);
      return { error: error.message };
    }

    // Refresh session data to reflect the change
    await get().fetchSession(sessionId, userId);

    return { error: null };
  },

  leaveSession: async (sessionId, userId) => {
    const { error } = await (supabase as any)
      .from("session_participants")
      .update({
        status: "left",
        left_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error leaving session:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  updateParticipantIntention: async (sessionId, userId, intention) => {
    const { error } = await (supabase as any)
      .from("session_participants")
      .update({ intention })
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating intention:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  startSession: async (sessionId) => {
    console.log("Starting session:", sessionId);
    
    const { data, error } = await (supabase as any)
      .from("focus_sessions")
      .update({
        status: "live",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select();

    console.log("Start session result:", data, error);

    if (error) {
      console.error("Error starting session:", error);
      return { error: error.message };
    }

    // Update all registered participants to active (if no waiting room)
    const session = get().currentSession;
    if (session && !session.has_waiting_room) {
      await (supabase as any)
        .from("session_participants")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("status", "registered");
    }

    // Refresh session data
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await get().fetchSession(sessionId, userId);

    return { error: null };
  },

  endSession: async (sessionId) => {
    console.log("Ending session:", sessionId);
    
    const { data, error } = await (supabase as any)
      .from("focus_sessions")
      .update({
        status: "ended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select();

    console.log("End session result:", data, error);

    if (error) {
      console.error("Error ending session:", error);
      return { error: error.message };
    }

    // Mark all active participants as left
    const { error: participantError } = await (supabase as any)
      .from("session_participants")
      .update({ status: "left", left_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .in("status", ["active", "waiting", "registered"]);

    if (participantError) {
      console.error("Error updating participants:", participantError);
    }

    // Clear current session from state
    set({ currentSession: null });

    return { error: null };
  },

  subscribeToSession: (sessionId) => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Refresh session data when participants change
          const userId = (await supabase.auth.getUser()).data.user?.id;
          await get().fetchSession(sessionId, userId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "focus_sessions",
          filter: `id=eq.${sessionId}`,
        },
        async () => {
          // Refresh session data when session is updated
          const userId = (await supabase.auth.getUser()).data.user?.id;
          await get().fetchSession(sessionId, userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
