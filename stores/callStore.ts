import { create } from "zustand";
import { supabase } from "@/lib/supabase";

// Type assertion helper for tables not yet in database types
const db = supabase as any;

export interface CallParticipant {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_muted: boolean;
  is_video_on: boolean;
  joined_at: string;
}

export interface GroupCall {
  id: string;
  group_id: string;
  initiated_by: string;
  call_type: "voice" | "video";
  status: "active" | "ended";
  started_at: string;
  ended_at: string | null;
  participants: CallParticipant[];
}

interface CallState {
  activeCall: GroupCall | null;
  isInCall: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isLoading: boolean;
  
  // Actions
  startCall: (groupId: string, userId: string, callType: "voice" | "video") => Promise<{ error: string | null; call?: GroupCall }>;
  joinCall: (callId: string, userId: string) => Promise<{ error: string | null }>;
  leaveCall: (callId: string, userId: string) => Promise<{ error: string | null }>;
  endCall: (callId: string) => Promise<{ error: string | null }>;
  toggleMute: () => void;
  toggleVideo: () => void;
  fetchActiveCall: (groupId: string) => Promise<void>;
  subscribeToCall: (callId: string) => () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  isInCall: false,
  isMuted: false,
  isVideoOn: true,
  isLoading: false,

  startCall: async (groupId, userId, callType) => {
    set({ isLoading: true });

    // Check if there's already an active call in this group
    const { data: existingCall } = await db
      .from("group_calls")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "active")
      .single();

    if (existingCall) {
      // Check if the call is stale (older than 2 hours) and auto-end it
      const callAge = Date.now() - new Date(existingCall.started_at).getTime();
      const twoHours = 2 * 60 * 60 * 1000;
      
      if (callAge > twoHours) {
        // Auto-end stale call
        await db
          .from("group_calls")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", existingCall.id);
      } else {
        // Join existing call instead of creating new one
        set({ isLoading: false });
        return { error: null, call: existingCall };
      }
    }

    // Create new call
    const { data: call, error } = await db
      .from("group_calls")
      .insert({
        group_id: groupId,
        initiated_by: userId,
        call_type: callType,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      set({ isLoading: false });
      return { error: error.message };
    }

    // Add initiator as participant
    await db.from("call_participants").insert({
      call_id: call.id,
      user_id: userId,
      is_muted: false,
      is_video_on: callType === "video",
    });

    // Fetch user details
    const { data: userProfile } = await db
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    const callWithParticipants: GroupCall = {
      ...call,
      participants: [{
        id: crypto.randomUUID(),
        user_id: userId,
        username: userProfile?.username || "User",
        avatar_url: userProfile?.avatar_url || null,
        is_muted: false,
        is_video_on: callType === "video",
        joined_at: new Date().toISOString(),
      }],
    };

    set({
      activeCall: callWithParticipants,
      isInCall: true,
      isVideoOn: callType === "video",
      isLoading: false,
    });

    // Send system message to group
    await db.from("group_messages").insert({
      group_id: groupId,
      user_id: userId,
      content: `${callType === "video" ? "Video" : "Voice"} call started`,
      message_type: "system",
    });

    return { error: null, call: callWithParticipants };
  },

  joinCall: async (callId, userId) => {
    set({ isLoading: true });

    // Check if call exists and is active
    const { data: call, error: callError } = await db
      .from("group_calls")
      .select("*")
      .eq("id", callId)
      .eq("status", "active")
      .single();

    if (callError || !call) {
      set({ isLoading: false });
      return { error: "Call not found or has ended" };
    }

    // Check if already a participant
    const { data: existingParticipant } = await db
      .from("call_participants")
      .select("*")
      .eq("call_id", callId)
      .eq("user_id", userId)
      .single();

    if (!existingParticipant) {
      // Add as participant
      await db.from("call_participants").insert({
        call_id: callId,
        user_id: userId,
        is_muted: false,
        is_video_on: call.call_type === "video",
      });
    }

    // Fetch all participants
    const { data: participants } = await db
      .from("call_participants")
      .select(`
        id,
        user_id,
        is_muted,
        is_video_on,
        joined_at,
        profiles:user_id(username, avatar_url)
      `)
      .eq("call_id", callId);

    const callWithParticipants: GroupCall = {
      ...call,
      participants: (participants || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        username: p.profiles?.username || "User",
        avatar_url: p.profiles?.avatar_url || null,
        is_muted: p.is_muted,
        is_video_on: p.is_video_on,
        joined_at: p.joined_at,
      })),
    };

    set({
      activeCall: callWithParticipants,
      isInCall: true,
      isVideoOn: call.call_type === "video",
      isLoading: false,
    });

    return { error: null };
  },

  leaveCall: async (callId, userId) => {
    // Remove from participants
    await db
      .from("call_participants")
      .delete()
      .eq("call_id", callId)
      .eq("user_id", userId);

    // Check if any participants left
    const { data: remainingParticipants } = await db
      .from("call_participants")
      .select("id")
      .eq("call_id", callId);

    // If no participants left, end the call
    if (!remainingParticipants || remainingParticipants.length === 0) {
      await db
        .from("group_calls")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", callId);
    }

    set({
      activeCall: null,
      isInCall: false,
      isMuted: false,
      isVideoOn: true,
    });

    return { error: null };
  },

  endCall: async (callId) => {
    // End the call
    await db
      .from("group_calls")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", callId);

    // Remove all participants
    await db
      .from("call_participants")
      .delete()
      .eq("call_id", callId);

    set({
      activeCall: null,
      isInCall: false,
      isMuted: false,
      isVideoOn: true,
    });

    return { error: null };
  },

  toggleMute: () => {
    set({ isMuted: !get().isMuted });
    
    // Update in database if in call
    const { activeCall, isMuted } = get();
    if (activeCall) {
      // This would update the participant's mute status
      // For now, just local state
    }
  },

  toggleVideo: () => {
    set({ isVideoOn: !get().isVideoOn });
  },

  fetchActiveCall: async (groupId) => {
    const { data: call } = await db
      .from("group_calls")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "active")
      .single();

    if (call) {
      // Fetch participants
      const { data: participants } = await db
        .from("call_participants")
        .select(`
          id,
          user_id,
          is_muted,
          is_video_on,
          joined_at,
          profiles:user_id(username, avatar_url)
        `)
        .eq("call_id", call.id);

      const callWithParticipants: GroupCall = {
        ...call,
        participants: (participants || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          username: p.profiles?.username || "User",
          avatar_url: p.profiles?.avatar_url || null,
          is_muted: p.is_muted,
          is_video_on: p.is_video_on,
          joined_at: p.joined_at,
        })),
      };

      set({ activeCall: callWithParticipants });
    } else {
      set({ activeCall: null });
    }
  },

  subscribeToCall: (callId) => {
    const channel = db
      .channel(`call-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_participants",
          filter: `call_id=eq.${callId}`,
        },
        async () => {
          // Refetch participants when changes occur
          const { data: call } = await db
            .from("group_calls")
            .select("*")
            .eq("id", callId)
            .single();

          if (call && call.status === "active") {
            const { data: participants } = await db
              .from("call_participants")
              .select(`
                id,
                user_id,
                is_muted,
                is_video_on,
                joined_at,
                profiles:user_id(username, avatar_url)
              `)
              .eq("call_id", callId);

            const callWithParticipants: GroupCall = {
              ...call,
              participants: (participants || []).map((p: any) => ({
                id: p.id,
                user_id: p.user_id,
                username: p.profiles?.username || "User",
                avatar_url: p.profiles?.avatar_url || null,
                is_muted: p.is_muted,
                is_video_on: p.is_video_on,
                joined_at: p.joined_at,
              })),
            };

            set({ activeCall: callWithParticipants });
          } else {
            // Call ended
            set({
              activeCall: null,
              isInCall: false,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_calls",
          filter: `id=eq.${callId}`,
        },
        (payload: any) => {
          if (payload.new.status === "ended") {
            set({
              activeCall: null,
              isInCall: false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  },
}));
