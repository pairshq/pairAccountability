export * from "./database";

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
  invite_code: string;
  created_by: string;
  member_count: number;
  active_goals_count: number;
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

