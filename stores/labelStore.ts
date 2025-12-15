import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Label, LabelInsert } from "@/types/database";

// Default label colors
export const LABEL_COLORS = [
  "#E74C3C", // Red
  "#E67E22", // Orange
  "#F1C40F", // Yellow
  "#2ECC71", // Green
  "#1ABC9C", // Teal
  "#3498DB", // Blue
  "#9B59B6", // Purple
  "#E91E63", // Pink
  "#607D8B", // Gray
  "#795548", // Brown
];

interface LabelState {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLabels: (userId: string) => Promise<void>;
  createLabel: (label: LabelInsert) => Promise<{ data: Label | null; error: string | null }>;
  updateLabel: (labelId: string, updates: Partial<Label>) => Promise<{ error: string | null }>;
  deleteLabel: (labelId: string) => Promise<{ error: string | null }>;
  
  // Task label management
  addLabelToTask: (taskId: string, labelId: string) => Promise<{ error: string | null }>;
  removeLabelFromTask: (taskId: string, labelId: string) => Promise<{ error: string | null }>;
  getLabelsForTask: (taskId: string) => Promise<Label[]>;
  setLabelsForTask: (taskId: string, labelIds: string[]) => Promise<{ error: string | null }>;
}

export const useLabelStore = create<LabelState>((set, get) => ({
  labels: [],
  isLoading: false,
  error: null,

  fetchLabels: async (userId: string) => {
    if (!isSupabaseConfigured) {
      set({ error: "Supabase not configured", isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;

      set({ labels: data || [], isLoading: false });
    } catch (error: any) {
      console.error("Error fetching labels:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  createLabel: async (labelData: LabelInsert) => {
    if (!isSupabaseConfigured) {
      console.error("LabelStore: Supabase not configured");
      return { data: null, error: "Supabase not configured" };
    }

    console.log("LabelStore: Creating label:", labelData);

    try {
      const { data, error } = await supabase
        .from("labels")
        .insert(labelData)
        .select()
        .single();

      if (error) {
        console.error("LabelStore: Supabase error:", error);
        throw error;
      }

      console.log("LabelStore: Label created:", data);

      set((state) => ({
        labels: [...state.labels, data].sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return { data, error: null };
    } catch (error: any) {
      console.error("LabelStore: Error creating label:", error);
      return { data: null, error: error.message };
    }
  },

  updateLabel: async (labelId: string, updates: Partial<Label>) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    try {
      const { error } = await supabase
        .from("labels")
        .update(updates)
        .eq("id", labelId);

      if (error) throw error;

      set((state) => ({
        labels: state.labels
          .map((l) => (l.id === labelId ? { ...l, ...updates } : l))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return { error: null };
    } catch (error: any) {
      console.error("Error updating label:", error);
      return { error: error.message };
    }
  },

  deleteLabel: async (labelId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    try {
      const { error } = await supabase
        .from("labels")
        .delete()
        .eq("id", labelId);

      if (error) throw error;

      set((state) => ({
        labels: state.labels.filter((l) => l.id !== labelId),
      }));

      return { error: null };
    } catch (error: any) {
      console.error("Error deleting label:", error);
      return { error: error.message };
    }
  },

  addLabelToTask: async (taskId: string, labelId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    // Handle recurring task instances
    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;

    try {
      const { error } = await supabase
        .from("task_labels")
        .insert({ task_id: realTaskId, label_id: labelId });

      if (error && !error.message.includes("duplicate")) throw error;

      return { error: null };
    } catch (error: any) {
      console.error("Error adding label to task:", error);
      return { error: error.message };
    }
  },

  removeLabelFromTask: async (taskId: string, labelId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;

    try {
      const { error } = await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", realTaskId)
        .eq("label_id", labelId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error("Error removing label from task:", error);
      return { error: error.message };
    }
  },

  getLabelsForTask: async (taskId: string) => {
    if (!isSupabaseConfigured) {
      return [];
    }

    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;

    try {
      const { data, error } = await supabase
        .from("task_labels")
        .select("label_id, labels(*)")
        .eq("task_id", realTaskId);

      if (error) throw error;

      return (data || []).map((item: any) => item.labels).filter(Boolean);
    } catch (error: any) {
      console.error("Error fetching task labels:", error);
      return [];
    }
  },

  setLabelsForTask: async (taskId: string, labelIds: string[]) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;

    try {
      // First, remove all existing labels for this task
      await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", realTaskId);

      // Then add the new labels
      if (labelIds.length > 0) {
        const inserts = labelIds.map((labelId) => ({
          task_id: realTaskId,
          label_id: labelId,
        }));

        const { error } = await supabase
          .from("task_labels")
          .insert(inserts);

        if (error) throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error setting task labels:", error);
      return { error: error.message };
    }
  },
}));

