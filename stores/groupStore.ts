import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Group, GroupWithDetails, GroupMessage } from "@/types";

interface GroupState {
  groups: GroupWithDetails[];
  currentGroup: GroupWithDetails | null;
  messages: GroupMessage[];
  isLoading: boolean;
  
  // Actions
  fetchGroups: (userId: string) => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string, description: string | null, userId: string) => Promise<{ error: string | null; group?: Group }>;
  joinGroup: (inviteCode: string, userId: string) => Promise<{ error: string | null }>;
  leaveGroup: (groupId: string, userId: string) => Promise<{ error: string | null }>;
  fetchMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, userId: string, content: string) => Promise<{ error: string | null }>;
  subscribeToMessages: (groupId: string) => () => void;
}

// Generate a random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  messages: [],
  isLoading: false,

  fetchGroups: async (userId) => {
    set({ isLoading: true });

    // Get groups user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberError || !memberships) {
      set({ isLoading: false });
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    
    if (groupIds.length === 0) {
      set({ groups: [], isLoading: false });
      return;
    }

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    if (error) {
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

        return {
          ...group,
          member_count: memberCount || 0,
          active_goals_count: goalsCount || 0,
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

    const groupWithDetails: GroupWithDetails = {
      ...group,
      member_count: memberCount || 0,
      active_goals_count: goalsCount || 0,
      members: (members || []).map((m: any) => ({
        id: m.profiles.id,
        username: m.profiles.username,
        avatar_url: m.profiles.avatar_url,
        role: m.role,
      })),
    };

    set({ currentGroup: groupWithDetails, isLoading: false });
  },

  createGroup: async (name, description, userId) => {
    const inviteCode = generateInviteCode();

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name,
        description,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Add creator as admin
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "admin",
    });

    get().fetchGroups(userId);
    return { error: null, group };
  },

  joinGroup: async (inviteCode, userId) => {
    // Find group by invite code
    const { data: group, error: findError } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (findError || !group) {
      return { error: "Invalid invite code" };
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
}));

