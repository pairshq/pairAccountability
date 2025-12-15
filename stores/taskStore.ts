import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { TaskDB, TaskInsert, TaskUpdate, Label } from "@/types/database";

// Recurrence type
type RecurrenceType = "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly";

// Extended task with computed properties
export interface TaskWithDetails extends TaskDB {
  is_overdue: boolean;
  is_today: boolean;
  has_no_date: boolean;
  formatted_time: string | null;
  is_recurring_instance?: boolean;
  original_task_id?: string;
  instance_date?: string;
  labels?: Label[];
}

interface TaskState {
  tasks: TaskWithDetails[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (task: TaskInsert) => Promise<{ error: string | null; taskId?: string }>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<{ error: string | null }>;
  completeTask: (taskId: string) => Promise<{ error: string | null }>;
  uncompleteTask: (taskId: string) => Promise<{ error: string | null }>;
  deleteTask: (taskId: string) => Promise<{ error: string | null }>;
  rescheduleTask: (taskId: string, newDate: string, newTime?: string | null) => Promise<{ error: string | null }>;
  getTasksForDate: (dateStr: string) => TaskWithDetails[];
  getTasksWithNoDate: () => TaskWithDetails[];
}

// Helper to format time for display
const formatTime = (timeStr: string | null): string | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0]);
  const minutes = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper to check if a date is a weekday (Mon-Fri)
const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
};

// Helper to enrich task with computed properties
const enrichTask = (task: TaskDB, instanceDate?: string): TaskWithDetails => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const effectiveDate = instanceDate || task.due_date;
  let isToday = false;
  let isOverdue = false;
  
  if (effectiveDate) {
    const taskDate = new Date(effectiveDate);
    taskDate.setHours(0, 0, 0, 0);
    
    isToday = taskDate.getTime() === today.getTime();
    isOverdue = taskDate < today && task.status === "pending";
  }
  
  return {
    ...task,
    due_date: effectiveDate || task.due_date,
    is_today: isToday,
    is_overdue: isOverdue,
    formatted_time: formatTime(task.due_time),
    has_no_date: !effectiveDate && !task.due_date,
  };
};

// Check if a task should occur on a given date
const shouldOccurOnDate = (
  task: TaskDB,
  targetDate: Date,
  recurrence: RecurrenceType
): boolean => {
  if (!task.due_date) return false;
  
  const startDate = new Date(task.due_date);
  startDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  // Task can't occur before its start date
  if (targetDate < startDate) return false;
  
  // If it's the original date, it's handled separately
  if (targetDate.getTime() === startDate.getTime()) return false;
  
  switch (recurrence) {
    case "daily":
      return true;
      
    case "weekdays":
      return isWeekday(targetDate);
      
    case "weekly":
      // Same day of week as start date
      return targetDate.getDay() === startDate.getDay();
      
    case "monthly":
      // Same day of month
      return targetDate.getDate() === startDate.getDate();
      
    case "yearly":
      // Same month and day
      return (
        targetDate.getMonth() === startDate.getMonth() &&
        targetDate.getDate() === startDate.getDate()
      );
      
    default:
      return false;
  }
};

// Generate all task occurrences for a date range
const generateAllTasksForRange = (
  baseTasks: TaskDB[],
  startDate: Date,
  endDate: Date
): TaskWithDetails[] => {
  const allTasks: TaskWithDetails[] = [];
  const processedIds = new Set<string>();
  
  // First, add all non-recurring tasks and the original recurring tasks
  for (const task of baseTasks) {
    const enriched = enrichTask(task);
    
    if (task.recurrence === "none" || !task.recurrence) {
      allTasks.push(enriched);
    } else {
      // Add the original recurring task on its start date
      if (task.due_date) {
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        if (taskDate >= startDate && taskDate <= endDate) {
          allTasks.push(enriched);
        }
      }
      processedIds.add(task.id);
    }
  }
  
  // Then generate recurring instances
  const recurringTasks = baseTasks.filter(
    t => t.recurrence && t.recurrence !== "none" && t.due_date
  );
  
  // Loop through each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    
    for (const task of recurringTasks) {
      if (shouldOccurOnDate(task, new Date(currentDate), task.recurrence as RecurrenceType)) {
        // Create a virtual instance
        const instance: TaskWithDetails = {
          ...enrichTask(task, dateStr),
          id: `${task.id}_${dateStr}`,
          due_date: dateStr,
          is_recurring_instance: true,
          original_task_id: task.id,
          instance_date: dateStr,
        };
        allTasks.push(instance);
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return allTasks;
};

// Sort tasks: by date, then by time (no time goes to bottom)
const sortTasks = (tasks: TaskWithDetails[]): TaskWithDetails[] => {
  return [...tasks].sort((a, b) => {
    // Tasks without dates come first (Unknown section)
    if (!a.due_date && !b.due_date) {
      if (!a.due_time && !b.due_time) return 0;
      if (!a.due_time) return 1;
      if (!b.due_time) return -1;
      return a.due_time.localeCompare(b.due_time);
    }
    if (!a.due_date) return -1;
    if (!b.due_date) return 1;
    
    // Sort by date
    const dateCompare = a.due_date.localeCompare(b.due_date);
    if (dateCompare !== 0) return dateCompare;
    
    // Within same date, sort by time (no time goes to bottom)
    if (!a.due_time && !b.due_time) return 0;
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time.localeCompare(b.due_time);
  });
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (userId: string) => {
    if (!isSupabaseConfigured) {
      set({ error: "Supabase not configured", isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      // Fetch tasks with their labels
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "cancelled");

      if (tasksError) throw tasksError;

      // Fetch all task labels with label details
      const { data: taskLabelsData } = await supabase
        .from("task_labels")
        .select("task_id, labels(*)")
        .in("task_id", (tasksData || []).map(t => t.id));

      // Create a map of task_id -> labels
      const taskLabelsMap: Record<string, Label[]> = {};
      (taskLabelsData || []).forEach((tl: any) => {
        if (!taskLabelsMap[tl.task_id]) {
          taskLabelsMap[tl.task_id] = [];
        }
        if (tl.labels) {
          taskLabelsMap[tl.task_id].push(tl.labels);
        }
      });

      // Attach labels to tasks
      const tasksWithLabels = (tasksData || []).map(task => ({
        ...task,
        labels: taskLabelsMap[task.id] || [],
      }));

      // Generate tasks for the next 90 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Start from 7 days ago to show recent tasks
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 90);
      
      const allTasks = generateAllTasksForRange(tasksWithLabels, startDate, endDate);
      
      set({ tasks: sortTasks(allTasks), isLoading: false });
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      set({ error: error.message || "Failed to fetch tasks", isLoading: false });
    }
  },

  createTask: async (taskData: TaskInsert) => {
    if (!isSupabaseConfigured) {
      console.error("Supabase not configured");
      return { error: "Supabase not configured" };
    }

    // Validation
    if (!taskData.title || !taskData.title.trim()) {
      return { error: "Task title is required" };
    }

    if (!taskData.user_id) {
      return { error: "User ID is required" };
    }

    console.log("TaskStore: Creating task:", JSON.stringify(taskData, null, 2));

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...taskData,
          title: taskData.title.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("TaskStore: Supabase error:", error);
        throw error;
      }

      if (!data) {
        return { error: "No data returned from insert" };
      }

      console.log("TaskStore: Task created:", data.id);

      return { error: null, taskId: data.id };
    } catch (error: any) {
      console.error("TaskStore: Error creating task:", error);
      return { error: error.message || "Failed to create task" };
    }
  },

  updateTask: async (taskId: string, updates: TaskUpdate) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    // Handle recurring instance - update the original task
    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", realTaskId)
        .select()
        .single();

      if (error) throw error;

      // Re-fetch to update recurring instances
      if (data) {
        await get().fetchTasks(data.user_id);
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error updating task:", error);
      return { error: error.message || "Failed to update task" };
    }
  },

  completeTask: async (taskId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    const isInstance = taskId.includes("_");
    const realTaskId = isInstance ? taskId.split("_")[0] : taskId;
    const now = new Date().toISOString();

    try {
      if (isInstance) {
        // For recurring instances, just update UI state (completion is per-instance)
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: "completed" as const, completed_at: now }
              : t
          ),
        }));
        return { error: null };
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({ 
          status: "completed", 
          completed_at: now,
          updated_at: now,
        })
        .eq("id", realTaskId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await get().fetchTasks(data.user_id);
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error completing task:", error);
      return { error: error.message || "Failed to complete task" };
    }
  },

  uncompleteTask: async (taskId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    const isInstance = taskId.includes("_");
    const realTaskId = isInstance ? taskId.split("_")[0] : taskId;

    try {
      if (isInstance) {
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: "pending" as const, completed_at: null }
              : t
          ),
        }));
        return { error: null };
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({ 
          status: "pending", 
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", realTaskId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await get().fetchTasks(data.user_id);
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error uncompleting task:", error);
      return { error: error.message || "Failed to uncomplete task" };
    }
  },

  deleteTask: async (taskId: string) => {
    if (!isSupabaseConfigured) {
      console.error("TaskStore: Supabase not configured");
      return { error: "Supabase not configured" };
    }

    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;
    console.log("TaskStore: Deleting task:", realTaskId, "from taskId:", taskId);

    try {
      // First delete any task_labels associations
      console.log("TaskStore: Deleting task_labels for task:", realTaskId);
      const { error: labelError } = await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", realTaskId);
      
      if (labelError) {
        console.error("TaskStore: Error deleting task_labels:", labelError);
        // Continue anyway - the table might not exist
      }

      // Now delete the task
      console.log("TaskStore: Deleting task from tasks table");
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", realTaskId);

      if (error) {
        console.error("TaskStore: Supabase delete error:", error);
        throw error;
      }

      console.log("TaskStore: Task deleted successfully");

      // Remove all instances of this task from state
      set(state => ({
        tasks: state.tasks.filter(t => {
          const tRealId = t.id.includes("_") ? t.id.split("_")[0] : t.id;
          return tRealId !== realTaskId;
        }),
      }));

      return { error: null };
    } catch (error: any) {
      console.error("TaskStore: Error deleting task:", error);
      return { error: error.message || "Failed to delete task" };
    }
  },

  rescheduleTask: async (taskId: string, newDate: string, newTime?: string | null) => {
    const updates: TaskUpdate = { due_date: newDate };
    if (newTime !== undefined) {
      updates.due_time = newTime;
    }
    return await get().updateTask(taskId, updates);
  },

  getTasksForDate: (dateStr: string) => {
    const tasks = get().tasks.filter(t => t.due_date === dateStr);
    return sortTasks(tasks);
  },

  getTasksWithNoDate: () => {
    return get().tasks.filter(t => !t.due_date);
  },
}));
