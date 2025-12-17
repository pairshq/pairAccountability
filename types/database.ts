export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: "personal" | "fitness" | "study" | "professional" | "financial" | "wellness";
          frequency: "daily" | "weekly";
          accountability_type: "self" | "pair" | "group";
          visibility: "private" | "partner" | "group";
          partner_id: string | null;
          group_id: string | null;
          start_date: string;
          end_date: string | null;
          current_streak: number;
          longest_streak: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: "personal" | "fitness" | "study" | "professional" | "financial" | "wellness";
          frequency: "daily" | "weekly";
          accountability_type?: "self" | "pair" | "group";
          visibility?: "private" | "partner" | "group";
          partner_id?: string | null;
          group_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: "personal" | "fitness" | "study" | "professional" | "financial" | "wellness";
          frequency?: "daily" | "weekly";
          accountability_type?: "self" | "pair" | "group";
          visibility?: "private" | "partner" | "group";
          partner_id?: string | null;
          group_id?: string | null;
          end_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          status: "completed" | "missed" | "skipped";
          reflection: string | null;
          check_in_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          status: "completed" | "missed" | "skipped";
          reflection?: string | null;
          check_in_date?: string;
          created_at?: string;
        };
        Update: {
          status?: "completed" | "missed" | "skipped";
          reflection?: string | null;
        };
        Relationships: [];
      };
      accountability_pairs: {
        Row: {
          id: string;
          user_id: string;
          partner_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner_id: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "declined";
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          invite_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "admin" | "member";
        };
        Relationships: [];
      };
      group_messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string | null;
          content: string;
          message_type: "text" | "system";
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id?: string | null;
          content: string;
          message_type?: "text" | "system";
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: "reminder" | "partner_completed" | "partner_missed" | "group_update" | "nudge";
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: "reminder" | "partner_completed" | "partner_missed" | "group_update" | "nudge";
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          priority: "low" | "medium" | "high";
          status: "pending" | "completed" | "cancelled";
          recurrence: "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly";
          category: string | null;
          project_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: "low" | "medium" | "high";
          status?: "pending" | "completed" | "cancelled";
          recurrence?: "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly";
          category?: string | null;
          project_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: "low" | "medium" | "high";
          status?: "pending" | "completed" | "cancelled";
          recurrence?: "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly";
          category?: string | null;
          project_id?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      task_labels: {
        Row: {
          task_id: string;
          label_id: string;
        };
        Insert: {
          task_id: string;
          label_id: string;
        };
        Update: {
          task_id?: string;
          label_id?: string;
        };
        Relationships: [];
      };
      dismissed_task_instances: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          instance_date: string;
          dismissed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          instance_date: string;
          dismissed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          instance_date?: string;
        };
        Relationships: [];
      };
      completed_task_instances: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          instance_date: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          instance_date: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          instance_date?: string;
          completed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"];
export type AccountabilityPair = Database["public"]["Tables"]["accountability_pairs"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMessage = Database["public"]["Tables"]["group_messages"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type TaskDB = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type Label = Database["public"]["Tables"]["labels"]["Row"];
export type LabelInsert = Database["public"]["Tables"]["labels"]["Insert"];
export type LabelUpdate = Database["public"]["Tables"]["labels"]["Update"];
export type TaskLabel = Database["public"]["Tables"]["task_labels"]["Row"];
