export * from "./database";

// Re-export task types from database
export type { TaskDB, TaskInsert, TaskUpdate } from "./database";

// Task type aliases for convenience
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed" | "cancelled";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

// TaskWithDetails is now exported from taskStore.ts

// Extended types with joined data
export interface GoalWithDetails {
  id: string;
  title: string;
  description: string | null;
  category: "personal" | "fitness" | "study" | "professional" | "financial" | "wellness";
  frequency: "daily" | "weekly";
  accountability_type: "self" | "pair" | "group";
  visibility: "private" | "partner" | "group";
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  partner?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  group?: {
    id: string;
    name: string;
  } | null;
  today_check_in?: {
    id: string;
    status: "completed" | "missed" | "skipped";
    reflection: string | null;
  } | null;
}

export interface GroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  invite_code: string;
  is_private: boolean;
  password_hash: string | null;
  created_by: string;
  member_count: number;
  active_goals_count: number;
  online_count: number;
  members: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: "admin" | "member";
  }[];
}

export interface PartnerWithDetails {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: "pending" | "accepted" | "declined";
  shared_goals_count: number;
}

// Auth types
export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    timezone: string;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  invite_code: string;
  is_private: boolean;
  password_hash: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string | null;
  content: string;
  message_type: "text" | "system" | "image" | "video" | "audio" | "document" | "gif";
  media_url: string | null;
  media_type: string | null;
  media_name: string | null;
  media_size: number | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  reply_to?: GroupMessage | null;
  reactions?: MessageReaction[];
  read_by?: string[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface TypingIndicator {
  group_id: string;
  user_id: string;
  username: string;
  updated_at: string;
}

