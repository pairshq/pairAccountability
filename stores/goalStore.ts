import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Goal, GoalWithDetails } from "@/types";

interface GoalState {
  goals: GoalWithDetails[];
  todayGoals: GoalWithDetails[];
  isLoading: boolean;
  
  // Actions
  fetchGoals: (userId: string) => Promise<void>;
  fetchTodayGoals: (userId: string) => Promise<void>;
  createGoal: (goal: Omit<Goal, "id" | "created_at" | "updated_at" | "current_streak" | "longest_streak">) => Promise<{ error: string | null; goal?: Goal }>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<{ error: string | null }>;
  deleteGoal: (id: string) => Promise<{ error: string | null }>;
  checkIn: (goalId: string, userId: string, status: "completed" | "missed", reflection?: string) => Promise<{ error: string | null }>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  todayGoals: [],
  isLoading: false,

  fetchGoals: async (userId) => {
    set({ isLoading: true });
    
    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    console.log("fetchGoals result:", goals, error);

    if (!error && goals) {
      // Map goals to GoalWithDetails format
      const goalsWithDetails = goals.map(goal => ({
        ...goal,
        partner: null,
        group: goal.group_id ? { id: goal.group_id, name: "Group" } : null,
        today_check_in: null,
      })) as GoalWithDetails[];
      set({ goals: goalsWithDetails, isLoading: false });
    } else {
      console.error("fetchGoals error:", error);
      set({ isLoading: false });
    }
  },

  fetchTodayGoals: async (userId) => {
    set({ isLoading: true });
    
    const today = new Date().toISOString().split("T")[0];
    
    // Get goals
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (goalsError) {
      console.error("fetchTodayGoals error:", goalsError);
      set({ isLoading: false });
      return;
    }

    // Get today's check-ins
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .eq("check_in_date", today);

    // Combine data
    const todayGoals = (goals || []).map((goal) => {
      const checkIn = checkIns?.find((c) => c.goal_id === goal.id);
      return {
        ...goal,
        partner: null,
        group: goal.group_id ? { id: goal.group_id, name: "Group" } : null,
        today_check_in: checkIn
          ? { id: checkIn.id, status: checkIn.status, reflection: checkIn.reflection }
          : null,
      } as GoalWithDetails;
    });

    // Filter for daily goals (or weekly goals on their day)
    const dayOfWeek = new Date().getDay();
    const filteredGoals = todayGoals.filter((goal) => {
      if (goal.frequency === "daily") return true;
      if (goal.frequency === "weekly" && dayOfWeek === 0) return true; // Sunday
      return false;
    });

    set({ todayGoals: filteredGoals, isLoading: false });
  },

  createGoal: async (goalData) => {
    console.log("goalStore.createGoal called with:", goalData);
    
    const { data, error } = await supabase
      .from("goals")
      .insert({
        ...goalData,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    console.log("Supabase insert result - data:", data, "error:", error);

    if (error) {
      console.error("Goal creation error:", error);
      return { error: error.message };
    }

    // Refresh goals
    get().fetchGoals(goalData.user_id);
    
    return { error: null, goal: data };
  },

  updateGoal: async (id, updates) => {
    const { error } = await supabase
      .from("goals")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  deleteGoal: async (id) => {
    const { error } = await supabase
      .from("goals")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    set({ goals: get().goals.filter((g) => g.id !== id) });
    return { error: null };
  },

  checkIn: async (goalId, userId, status, reflection) => {
    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from("check_ins")
      .select("id")
      .eq("goal_id", goalId)
      .eq("check_in_date", today)
      .single();

    if (existing) {
      // Update existing check-in
      const { error } = await supabase
        .from("check_ins")
        .update({ status, reflection })
        .eq("id", existing.id);

      if (error) return { error: error.message };
    } else {
      // Create new check-in
      const { error } = await supabase.from("check_ins").insert({
        goal_id: goalId,
        user_id: userId,
        status,
        reflection,
        check_in_date: today,
      });

      if (error) return { error: error.message };

      // Update streak
      if (status === "completed") {
        const goal = get().goals.find((g) => g.id === goalId);
        if (goal) {
          const newStreak = goal.current_streak + 1;
          await supabase.from("goals").update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, goal.longest_streak),
          }).eq("id", goalId);
        }
      } else {
        // Reset streak on miss
        await supabase.from("goals").update({
          current_streak: 0,
        }).eq("id", goalId);
      }
    }

    // Refresh today's goals
    get().fetchTodayGoals(userId);
    return { error: null };
  },
}));

