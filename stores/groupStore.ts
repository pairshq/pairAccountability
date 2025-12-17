import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Group, GroupWithDetails, GroupMessage } from "@/types";

// Member progress type
export interface MemberGoalProgress {
  id: string;
  title: string;
  category: string;
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
  frequency: "daily" | "weekly";
  todayCheckedIn: boolean;
  totalCheckIns: number;
}

export interface MemberProgress {
  id: string;
  username: string;
  avatar_url: string | null;
  goals: MemberGoalProgress[];
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
}

// Event types
export interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  event_type: "video_call" | "voice_call" | "focus_session" | "meeting" | "other";
  start_time: string;
  end_time: string;
  location?: string;
  created_by: string;
  participants: string[]; // Array of user IDs (empty = all group members)
  created_at: string;
  updated_at: string;
}

export interface GroupEventWithParticipants extends GroupEvent {
  creator?: { id: string; username: string; avatar_url: string | null };
  participant_details?: { id: string; username: string; avatar_url: string | null }[];
}

// Sheet types
export interface SheetFile {
  id: string;
  group_id: string;
  name: string;
  cells: { [key: string]: { value: string; formula?: string; style?: any } };
  column_widths?: number[];
  row_heights?: number[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface GroupState {
  groups: GroupWithDetails[];
  currentGroup: GroupWithDetails | null;
  messages: GroupMessage[];
  memberProgress: MemberProgress[];
  sheets: SheetFile[];
  events: GroupEventWithParticipants[];
  isLoading: boolean;
  isLoadingProgress: boolean;
  isLoadingSheets: boolean;
  isLoadingEvents: boolean;
  
  // Actions
  fetchGroups: (userId: string) => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  clearGroupData: () => void;
  fetchMemberProgress: (groupId: string) => Promise<void>;
  createGroup: (data: { name: string; description: string | null; avatarUri: string | null; inviteCode: string; password: string | null; userId: string }) => Promise<{ error: string | null; group?: Group }>;
  joinGroup: (inviteCode: string, userId: string, password?: string) => Promise<{ error: string | null }>;
  leaveGroup: (groupId: string, userId: string) => Promise<{ error: string | null }>;
  fetchMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, userId: string, content: string) => Promise<{ error: string | null }>;
  subscribeToMessages: (groupId: string) => () => void;
  // Sheet actions
  fetchSheets: (groupId: string) => Promise<void>;
  createSheet: (groupId: string, userId: string, name: string) => Promise<{ error: string | null; sheet?: SheetFile }>;
  updateSheet: (sheetId: string, cells: SheetFile["cells"], columnWidths?: number[], rowHeights?: number[]) => Promise<{ error: string | null }>;
  deleteSheet: (sheetId: string) => Promise<{ error: string | null }>;
  // Event actions
  fetchEvents: (groupId: string) => Promise<void>;
  createEvent: (groupId: string, userId: string, eventData: Omit<GroupEvent, "id" | "group_id" | "created_by" | "created_at" | "updated_at">) => Promise<{ error: string | null; event?: GroupEventWithParticipants }>;
  updateEvent: (eventId: string, eventData: Partial<GroupEvent>) => Promise<{ error: string | null }>;
  deleteEvent: (eventId: string) => Promise<{ error: string | null }>;
}

// Generate a random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  messages: [],
  memberProgress: [],
  sheets: [],
  events: [],
  isLoading: false,
  isLoadingProgress: false,
  isLoadingSheets: false,
  isLoadingEvents: false,

  // Clear all group-specific data when switching groups
  clearGroupData: () => {
    set({
      currentGroup: null,
      messages: [],
      memberProgress: [],
      sheets: [],
      events: [],
      isLoading: true,
      isLoadingProgress: true,
      isLoadingSheets: true,
      isLoadingEvents: true,
    });
  },

  fetchGroups: async (userId) => {
    console.log("fetchGroups called with userId:", userId);
    set({ isLoading: true });

    // Get groups user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    console.log("memberships result:", memberships, "error:", memberError);

    if (memberError || !memberships) {
      console.error("fetchGroups memberError:", memberError);
      set({ isLoading: false });
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    console.log("groupIds:", groupIds);
    
    if (groupIds.length === 0) {
      console.log("No groups found for user");
      set({ groups: [], isLoading: false });
      return;
    }

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    console.log("groups result:", groups, "error:", error);

    if (error) {
      console.error("fetchGroups error:", error);
      set({ isLoading: false });
      return;
    }

    // Get member counts and active goals
    const groupsWithDetails: GroupWithDetails[] = await Promise.all(
      (groups || []).map(async (group) => {
        const { count: memberCount } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id);

        const { count: goalsCount } = await supabase
          .from("goals")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("is_active", true);

        const { data: members } = await supabase
          .from("group_members")
          .select(`
            role,
            profiles:user_id(id, username, avatar_url)
          `)
          .eq("group_id", group.id)
          .limit(5);

        // TODO: Implement real-time presence tracking for online_count
        // For now, set to 0 until we add a presence system
        const g = group as any;
        return {
          ...group,
          avatar_url: g.avatar_url || null,
          is_private: g.is_private || false,
          password_hash: g.password_hash || null,
          member_count: memberCount || 0,
          active_goals_count: goalsCount || 0,
          online_count: 0, // Will be implemented with real-time presence
          members: (members || []).map((m: any) => ({
            id: m.profiles.id,
            username: m.profiles.username,
            avatar_url: m.profiles.avatar_url,
            role: m.role,
          })),
        };
      })
    );

    set({ groups: groupsWithDetails, isLoading: false });
  },

  fetchGroup: async (groupId) => {
    set({ isLoading: true });

    const { data: group, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error || !group) {
      set({ isLoading: false });
      return;
    }

    const { count: memberCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    const { count: goalsCount } = await supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("is_active", true);

    const { data: members } = await supabase
      .from("group_members")
      .select(`
        role,
        profiles:user_id(id, username, avatar_url)
      `)
      .eq("group_id", groupId);

    const g = group as any;
    const groupWithDetails: GroupWithDetails = {
      ...group,
      avatar_url: g.avatar_url || null,
      is_private: g.is_private || false,
      password_hash: g.password_hash || null,
      member_count: memberCount || 0,
      active_goals_count: goalsCount || 0,
      online_count: 0,
      members: (members || []).map((m: any) => ({
        id: m.profiles.id,
        username: m.profiles.username,
        avatar_url: m.profiles.avatar_url,
        role: m.role,
      })),
    };

    set({ currentGroup: groupWithDetails, isLoading: false });
  },

  fetchMemberProgress: async (groupId) => {
    set({ isLoadingProgress: true });

    // Get all members of the group
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(`
        user_id,
        profiles:user_id(id, username, avatar_url)
      `)
      .eq("group_id", groupId);

    if (membersError || !members) {
      set({ isLoadingProgress: false });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // For each member, get their goals shared with this group and task completions
    const progressData: MemberProgress[] = await Promise.all(
      members.map(async (member: any) => {
        const userId = member.user_id;
        const profile = member.profiles;

        // Get goals shared with this group
        const { data: goals } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId)
          .eq("group_id", groupId)
          .eq("is_active", true);

        // Get check-ins for today for each goal
        const goalsWithProgress: MemberGoalProgress[] = await Promise.all(
          (goals || []).map(async (goal) => {
            const { data: todayCheckIn } = await supabase
              .from("check_ins")
              .select("id")
              .eq("goal_id", goal.id)
              .eq("check_in_date", today)
              .single();

            const { count: totalCheckIns } = await supabase
              .from("check_ins")
              .select("*", { count: "exact", head: true })
              .eq("goal_id", goal.id)
              .eq("status", "completed");

            return {
              id: goal.id,
              title: goal.title,
              category: goal.category,
              current_streak: goal.current_streak,
              longest_streak: goal.longest_streak,
              is_active: goal.is_active,
              frequency: goal.frequency,
              todayCheckedIn: !!todayCheckIn,
              totalCheckIns: totalCheckIns || 0,
            };
          })
        );

        // Get tasks completed today
        const { count: tasksToday } = await supabase
          .from("completed_task_instances")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("instance_date", today);

        // Get tasks completed this week
        const { count: tasksWeek } = await supabase
          .from("completed_task_instances")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("instance_date", weekAgo);

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          goals: goalsWithProgress,
          tasksCompletedToday: tasksToday || 0,
          tasksCompletedThisWeek: tasksWeek || 0,
        };
      })
    );

    set({ memberProgress: progressData, isLoadingProgress: false });
  },

  createGroup: async ({ name, description, avatarUri, inviteCode, password, userId }) => {
    console.log("createGroup called:", { name, description, avatarUri, inviteCode, password, userId });
    
    let avatarUrl: string | null = null;
    
    // Upload avatar if provided
    if (avatarUri) {
      const fileName = `group-avatars/${inviteCode}-${Date.now()}.jpg`;
      const response = await fetch(avatarUri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      
      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
      } else {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name,
        description,
        avatar_url: avatarUrl,
        invite_code: inviteCode.toUpperCase(),
        is_private: true,
        password_hash: password,
        created_by: userId,
      })
      .select()
      .single();

    console.log("createGroup result:", { group, error });

    if (error) {
      console.error("createGroup error:", error);
      return { error: error.message };
    }

    // Add creator as admin
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "admin",
    });

    console.log("Add member result:", { memberError });

    get().fetchGroups(userId);
    return { error: null, group };
  },

  joinGroup: async (inviteCode, userId, password) => {
    // Find group by invite code
    const { data: group, error: findError } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (findError || !group) {
      return { error: "Invalid invite code" };
    }

    // Check password for private groups (if columns exist)
    const g = group as any;
    if (g.is_private && g.password_hash) {
      if (!password) {
        return { error: "This group requires a password" };
      }
      if (password !== g.password_hash) {
        return { error: "Incorrect password" };
      }
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return { error: "You are already a member of this group" };
    }

    // Join group
    const { error } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "member",
    });

    if (error) {
      return { error: error.message };
    }

    get().fetchGroups(userId);
    return { error: null };
  },

  leaveGroup: async (groupId, userId) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      return { error: error.message };
    }

    set({ groups: get().groups.filter((g) => g.id !== groupId) });
    return { error: null };
  },

  fetchMessages: async (groupId) => {
    const { data: messages, error } = await supabase
      .from("group_messages")
      .select(`
        *,
        user:profiles!group_messages_user_id_fkey(id, username, avatar_url)
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error) {
      set({ messages: messages || [] });
    }
  },

  sendMessage: async (groupId, userId, content) => {
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: userId,
      content,
      message_type: "text",
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  subscribeToMessages: (groupId) => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the message with user details
          const { data: message } = await supabase
            .from("group_messages")
            .select(`
              *,
              user:profiles!group_messages_user_id_fkey(id, username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (message) {
            set({ messages: [...get().messages, message] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Sheet actions - Store sheets in Supabase database
  fetchSheets: async (groupId) => {
    set({ isLoadingSheets: true });
    
    const { data: sheets, error } = await (supabase as any)
      .from("sheets")
      .select("*")
      .eq("group_id", groupId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching sheets:", error);
      set({ isLoadingSheets: false });
      return;
    }

    // Parse cells JSON for each sheet
    const parsedSheets: SheetFile[] = (sheets || []).map((sheet: any) => ({
      ...sheet,
      cells: typeof sheet.cells === "string" ? JSON.parse(sheet.cells) : sheet.cells || {},
      column_widths: sheet.column_widths || [],
      row_heights: sheet.row_heights || [],
    }));

    set({ sheets: parsedSheets, isLoadingSheets: false });
  },

  createSheet: async (groupId, userId, name) => {
    const newSheet = {
      group_id: groupId,
      name: name.trim(),
      cells: JSON.stringify({}),
      column_widths: [],
      row_heights: [],
      created_by: userId,
    };

    const { data, error } = await (supabase as any)
      .from("sheets")
      .insert(newSheet)
      .select()
      .single();

    if (error) {
      console.error("Error creating sheet:", error);
      return { error: error.message };
    }

    const sheet: SheetFile = {
      ...data,
      cells: typeof data.cells === "string" ? JSON.parse(data.cells) : data.cells || {},
    };

    set({ sheets: [sheet, ...get().sheets] });
    return { error: null, sheet };
  },

  updateSheet: async (sheetId, cells, columnWidths, rowHeights) => {
    const updateData: any = {
      cells: JSON.stringify(cells),
      updated_at: new Date().toISOString(),
    };
    
    if (columnWidths) updateData.column_widths = columnWidths;
    if (rowHeights) updateData.row_heights = rowHeights;

    const { error } = await (supabase as any)
      .from("sheets")
      .update(updateData)
      .eq("id", sheetId);

    if (error) {
      console.error("Error updating sheet:", error);
      return { error: error.message };
    }

    // Update local state
    set({
      sheets: get().sheets.map((s) =>
        s.id === sheetId
          ? { ...s, cells, column_widths: columnWidths || s.column_widths, row_heights: rowHeights || s.row_heights, updated_at: new Date().toISOString() }
          : s
      ),
    });

    return { error: null };
  },

  deleteSheet: async (sheetId) => {
    const { error } = await (supabase as any)
      .from("sheets")
      .delete()
      .eq("id", sheetId);

    if (error) {
      console.error("Error deleting sheet:", error);
      return { error: error.message };
    }

    set({ sheets: get().sheets.filter((s) => s.id !== sheetId) });
    return { error: null };
  },

  // Event actions - Store events in Supabase database
  fetchEvents: async (groupId) => {
    set({ isLoadingEvents: true });
    
    const { data: events, error } = await (supabase as any)
      .from("group_events")
      .select("*")
      .eq("group_id", groupId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      set({ isLoadingEvents: false });
      return;
    }

    // Get participant details for each event
    const eventsWithParticipants: GroupEventWithParticipants[] = await Promise.all(
      (events || []).map(async (event: any) => {
        // Get creator details
        const { data: creator } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", event.created_by)
          .single();

        // Get participant details if specific participants
        let participant_details: any[] = [];
        if (event.participants && event.participants.length > 0) {
          const { data: participants } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", event.participants);
          participant_details = participants || [];
        }

        return {
          ...event,
          creator,
          participant_details,
        };
      })
    );

    set({ events: eventsWithParticipants, isLoadingEvents: false });
  },

  createEvent: async (groupId, userId, eventData) => {
    const newEvent = {
      group_id: groupId,
      title: eventData.title,
      description: eventData.description || null,
      event_type: eventData.event_type,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location: eventData.location || null,
      created_by: userId,
      participants: eventData.participants || [],
    };

    const { data, error } = await (supabase as any)
      .from("group_events")
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return { error: error.message };
    }

    // Get creator details
    const { data: creator } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", userId)
      .single();

    // Get participant details
    let participant_details: any[] = [];
    if (data.participants && data.participants.length > 0) {
      const { data: participants } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", data.participants);
      participant_details = participants || [];
    }

    const eventWithDetails: GroupEventWithParticipants = {
      ...data,
      creator,
      participant_details,
    };

    set({ events: [...get().events, eventWithDetails].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )});
    return { error: null, event: eventWithDetails };
  },

  updateEvent: async (eventId, eventData) => {
    const updateData: any = {
      ...eventData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("group_events")
      .update(updateData)
      .eq("id", eventId);

    if (error) {
      console.error("Error updating event:", error);
      return { error: error.message };
    }

    // Update local state
    set({
      events: get().events.map((e) =>
        e.id === eventId ? { ...e, ...eventData, updated_at: new Date().toISOString() } : e
      ),
    });

    return { error: null };
  },

  deleteEvent: async (eventId) => {
    const { error } = await (supabase as any)
      .from("group_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Error deleting event:", error);
      return { error: error.message };
    }

    set({ events: get().events.filter((e) => e.id !== eventId) });
    return { error: null };
  },
}));

