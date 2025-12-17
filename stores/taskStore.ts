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
  dismissedInstances: Set<string>; // Track dismissed recurring instances
  completedInstances: Map<string, string>; // Track completed recurring instances (id -> completed_at)
  pendingOperations: Set<string>; // Track tasks with pending operations to prevent double-clicks
  
  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (task: TaskInsert) => Promise<{ error: string | null; taskId?: string }>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<{ error: string | null }>;
  completeTask: (taskId: string) => Promise<{ error: string | null }>;
  uncompleteTask: (taskId: string) => Promise<{ error: string | null }>;
  deleteTask: (taskId: string) => Promise<{ error: string | null }>;
  rescheduleTask: (taskId: string, newDate: string, newTime?: string | null) => Promise<{ error: string | null }>;
  dismissOverdueTask: (taskId: string) => Promise<{ error: string | null }>;
  loadDismissedInstances: () => Promise<void>;
  loadCompletedInstances: () => Promise<void>;
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
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const effectiveDate = instanceDate || task.due_date;
  let isToday = false;
  let isOverdue = false;
  
  if (effectiveDate) {
    const taskDate = new Date(effectiveDate);
    taskDate.setHours(0, 0, 0, 0);
    
    isToday = taskDate.getTime() === today.getTime();
    
    // Check if overdue by date
    if (taskDate < today && task.status === "pending") {
      isOverdue = true;
    }
    // Check if overdue by time (for today's tasks)
    else if (isToday && task.due_time && task.status === "pending") {
      const [hours, minutes] = task.due_time.split(":").map(Number);
      const taskDateTime = new Date(effectiveDate);
      taskDateTime.setHours(hours, minutes, 0, 0);
      if (now > taskDateTime) {
        isOverdue = true;
      }
    }
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
  
  // The original date always counts as an occurrence
  if (targetDate.getTime() === startDate.getTime()) return true;
  
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
  endDate: Date,
  dismissedInstances: Set<string> = new Set()
): TaskWithDetails[] => {
  const allTasks: TaskWithDetails[] = [];
  const processedIds = new Set<string>();
  
  // First, add all non-recurring tasks
  for (const task of baseTasks) {
    if (task.recurrence === "none" || !task.recurrence) {
      const enriched = enrichTask(task);
      allTasks.push(enriched);
    } else {
      // Track recurring tasks for later processing
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
        const instanceId = `${task.id}_${dateStr}`;
        
        // Skip if this instance was dismissed
        if (dismissedInstances.has(instanceId)) {
          continue;
        }
        
        // Create a virtual instance
        const instance: TaskWithDetails = {
          ...enrichTask(task, dateStr),
          id: instanceId,
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
  dismissedInstances: new Set<string>(),
  completedInstances: new Map<string, string>(),
  pendingOperations: new Set<string>(),

  fetchTasks: async (userId: string) => {
    if (!isSupabaseConfigured) {
      set({ error: "Supabase not configured", isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      // Load dismissed and completed instances from database first
      await get().loadDismissedInstances();
      await get().loadCompletedInstances();
      
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
      
      const { dismissedInstances, completedInstances } = get();
      let allTasks = generateAllTasksForRange(tasksWithLabels, startDate, endDate, dismissedInstances);
      
      // Apply completed instances state to recurring tasks
      if (completedInstances.size > 0) {
        allTasks = allTasks.map(task => {
          if (task.is_recurring_instance && completedInstances.has(task.id)) {
            return {
              ...task,
              status: "completed" as const,
              completed_at: completedInstances.get(task.id) || null,
            };
          }
          return task;
        });
      }
      
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

    // Prevent double-clicks - check if operation is already pending
    const { pendingOperations } = get();
    if (pendingOperations.has(taskId)) {
      console.log("Task completion already in progress:", taskId);
      return { error: null };
    }

    // Mark operation as pending
    set(state => ({
      pendingOperations: new Set(state.pendingOperations).add(taskId),
    }));

    const isInstance = taskId.includes("_");
    const realTaskId = isInstance ? taskId.split("_")[0] : taskId;
    const now = new Date().toISOString();

    try {
      if (isInstance) {
        const instanceDate = taskId.split("_")[1];
        
        // Optimistically update UI first
        set(state => {
          const newCompleted = new Map(state.completedInstances);
          newCompleted.set(taskId, now);
          const newPending = new Set(state.pendingOperations);
          newPending.delete(taskId);
          return {
            tasks: state.tasks.map(t => 
              t.id === taskId 
                ? { ...t, status: "completed" as const, completed_at: now }
                : t
            ),
            completedInstances: newCompleted,
            pendingOperations: newPending,
          };
        });
        
        // Persist to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: dbError } = await supabase
            .from("completed_task_instances")
            .upsert({
              user_id: user.id,
              task_id: realTaskId,
              instance_date: instanceDate,
              completed_at: now,
            }, { onConflict: "task_id,instance_date" });
          
          if (dbError) {
            console.error("Failed to persist recurring completion:", dbError);
            // Don't revert UI - the local state is still valid for this session
          }
        }
        
        return { error: null };
      }

      // Optimistically update UI first
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: "completed" as const, completed_at: now }
            : t
        ),
      }));

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

      // Clear pending operation
      set(state => {
        const newPending = new Set(state.pendingOperations);
        newPending.delete(taskId);
        return { pendingOperations: newPending };
      });

      return { error: null };
    } catch (error: any) {
      console.error("Error completing task:", error);
      // Revert optimistic update on error
      set(state => {
        const newPending = new Set(state.pendingOperations);
        newPending.delete(taskId);
        return {
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: "pending" as const, completed_at: null }
              : t
          ),
          pendingOperations: newPending,
        };
      });
      return { error: error.message || "Failed to complete task" };
    }
  },

  uncompleteTask: async (taskId: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase not configured" };
    }

    // Prevent double-clicks - check if operation is already pending
    const { pendingOperations } = get();
    if (pendingOperations.has(taskId)) {
      console.log("Task uncomplete already in progress:", taskId);
      return { error: null };
    }

    // Mark operation as pending
    set(state => ({
      pendingOperations: new Set(state.pendingOperations).add(taskId),
    }));

    const isInstance = taskId.includes("_");
    const realTaskId = isInstance ? taskId.split("_")[0] : taskId;

    try {
      if (isInstance) {
        const instanceDate = taskId.split("_")[1];
        
        // Optimistically update UI first
        set(state => {
          const newCompleted = new Map(state.completedInstances);
          newCompleted.delete(taskId);
          const newPending = new Set(state.pendingOperations);
          newPending.delete(taskId);
          return {
            tasks: state.tasks.map(t => 
              t.id === taskId 
                ? { ...t, status: "pending" as const, completed_at: null }
                : t
            ),
            completedInstances: newCompleted,
            pendingOperations: newPending,
          };
        });
        
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: dbError } = await supabase
            .from("completed_task_instances")
            .delete()
            .eq("user_id", user.id)
            .eq("task_id", realTaskId)
            .eq("instance_date", instanceDate);
          
          if (dbError) {
            console.error("Failed to remove recurring completion:", dbError);
            // Don't revert UI - the local state is still valid for this session
          }
        }
        
        return { error: null };
      }

      // Optimistically update UI first
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: "pending" as const, completed_at: null }
            : t
        ),
      }));

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

      // Clear pending operation
      set(state => {
        const newPending = new Set(state.pendingOperations);
        newPending.delete(taskId);
        return { pendingOperations: newPending };
      });

      return { error: null };
    } catch (error: any) {
      console.error("Error uncompleting task:", error);
      // Revert optimistic update on error
      set(state => {
        const newPending = new Set(state.pendingOperations);
        newPending.delete(taskId);
        return {
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: "completed" as const, completed_at: new Date().toISOString() }
              : t
          ),
          pendingOperations: newPending,
        };
      });
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

  // Dismiss an overdue recurring task instance (mark as cancelled/missed)
  dismissOverdueTask: async (taskId: string) => {
    // For recurring task instances, we just remove them from the view
    // The actual database task remains, but this instance is dismissed
    const realTaskId = taskId.includes("_") ? taskId.split("_")[0] : taskId;
    const instanceDate = taskId.includes("_") ? taskId.split("_")[1] : null;
    
    // If it's a recurring instance, save to database and remove from view
    if (instanceDate) {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };
        
        // Insert into dismissed_task_instances table
        const { error } = await supabase
          .from("dismissed_task_instances")
          .upsert({
            user_id: user.id,
            task_id: realTaskId,
            instance_date: instanceDate,
          }, { onConflict: "task_id,instance_date" });
        
        if (error) {
          console.error("Failed to save dismissed instance:", error);
          return { error: error.message };
        }
        
        // Update local state
        const newDismissed = new Set(get().dismissedInstances);
        newDismissed.add(taskId);
        
        set(state => ({
          dismissedInstances: newDismissed,
          tasks: state.tasks.filter(t => t.id !== taskId),
        }));
        
        return { error: null };
      } catch (e: any) {
        console.error("Failed to dismiss instance:", e);
        return { error: e.message };
      }
    }
    
    // For non-recurring tasks, mark as cancelled
    return await get().updateTask(realTaskId, { status: "cancelled" });
  },

  // Load dismissed instances from database
  loadDismissedInstances: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get dismissed instances from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("dismissed_task_instances")
        .select("task_id, instance_date")
        .eq("user_id", user.id)
        .gte("instance_date", thirtyDaysAgo.toISOString().split("T")[0]);
      
      if (error) {
        console.error("Failed to load dismissed instances:", error);
        return;
      }
      
      // Convert to Set of "taskId_date" format
      const dismissedSet = new Set<string>();
      (data || []).forEach(item => {
        dismissedSet.add(`${item.task_id}_${item.instance_date}`);
      });
      
      set({ dismissedInstances: dismissedSet });
    } catch (e) {
      console.error("Failed to load dismissed instances:", e);
    }
  },

  // Load completed recurring instances from database
  loadCompletedInstances: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get completed instances from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("completed_task_instances")
        .select("task_id, instance_date, completed_at")
        .eq("user_id", user.id)
        .gte("instance_date", thirtyDaysAgo.toISOString().split("T")[0]);
      
      if (error) {
        console.error("Failed to load completed instances:", error);
        return;
      }
      
      // Convert to Map of "taskId_date" -> completed_at
      const completedMap = new Map<string, string>();
      (data || []).forEach(item => {
        completedMap.set(`${item.task_id}_${item.instance_date}`, item.completed_at);
      });
      
      set({ completedInstances: completedMap });
    } catch (e) {
      console.error("Failed to load completed instances:", e);
    }
  },

  getTasksForDate: (dateStr: string) => {
    const tasks = get().tasks.filter(t => t.due_date === dateStr);
    return sortTasks(tasks);
  },

  getTasksWithNoDate: () => {
    return get().tasks.filter(t => !t.due_date);
  },
}));
