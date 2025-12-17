import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { 
  Plus, 
  Circle, 
  CheckCircle2, 
  Clock, 
  Flag,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Repeat,
  X,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore, TaskWithDetails } from "@/stores/taskStore";
import { useResponsive } from "@/hooks/useResponsive";
import { InlineAddTask, TaskContextMenu, LabelDisplay } from "@/components/ui";
import { searchEventEmitter } from "@/components/ui/Sidebar";

// Get time period of day
const getTimePeriod = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { label: "Morning", icon: Sun, greeting: "Good morning" };
  if (hour < 17) return { label: "Afternoon", icon: Sun, greeting: "Good afternoon" };
  if (hour < 21) return { label: "Evening", icon: Sunset, greeting: "Good evening" };
  return { label: "Night", icon: Moon, greeting: "Good night" };
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "#E74C3C";
    case "medium": return "#FAB300";
    case "low": return "#6B7280";
    default: return "#6B7280";
  }
};

export default function TodayScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { tasks, isLoading, fetchTasks, completeTask, uncompleteTask } = useTaskStore();
  const { isDesktop } = useResponsive();

  const [showAddTask, setShowAddTask] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const timePeriod = getTimePeriod();
  const displayName = profile?.full_name?.split(" ")[0] || profile?.username || "there";

  // Filter tasks for today
  const todayTasks = tasks.filter(t => t.due_date === todayStr);
  const overdueTasks = tasks.filter(t => t.is_overdue);

  useEffect(() => {
    if (user) {
      fetchTasks(user.id);
    }
  }, [user]);

  // Subscribe to command palette events for filtering
  useEffect(() => {
    const unsubscribe = searchEventEmitter.subscribe((data) => {
      if (data.type === "priority") {
        setFilterPriority(prev => prev === data.value ? null : data.value);
      } else if (data.type === "search") {
        setSearchQuery(data.value);
      } else if (data.type === "label") {
        setFilterLabelId(prev => prev === data.value ? null : data.value);
      }
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    if (user) {
      fetchTasks(user.id);
    }
  };

  const handleToggleTask = async (task: TaskWithDetails) => {
    if (task.status === "completed") {
      await uncompleteTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleTaskUpdate = () => {
    if (user) {
      fetchTasks(user.id);
    }
  };

  // Apply all filters (priority, search, label)
  const applyFilters = (taskList: TaskWithDetails[]) => {
    let filtered = taskList;
    
    // Apply priority filter
    if (filterPriority) {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply label filter
    if (filterLabelId) {
      filtered = filtered.filter(t => 
        t.labels?.some(label => label.id === filterLabelId)
      );
    }
    
    return filtered;
  };

  // Check if any filter is active
  const hasActiveFilter = filterPriority || searchQuery.trim() || filterLabelId;

  // Clear all filters
  const clearFilters = () => {
    setFilterPriority(null);
    setSearchQuery("");
    setFilterLabelId(null);
  };

  // Separate tasks by completion status and apply all filters
  const pendingTasks = applyFilters(todayTasks.filter((t) => t.status !== "completed"));
  const completedTasks = applyFilters(todayTasks.filter((t) => t.status === "completed"));
  const filteredOverdueTasks = applyFilters(overdueTasks);

  const completionRate = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100) 
    : 0;

  const TaskItem = ({ task }: { task: TaskWithDetails }) => {
    const isCompleted = task.status === "completed";
    const isOverdue = task.is_overdue && !isCompleted;
    const isRecurring = task.recurrence !== "none";
    
    return (
      <View
        style={[
          styles.taskItem,
          { backgroundColor: colors.card, borderColor: isOverdue ? "#E74C3C" : colors.border },
          isOverdue && styles.taskItemOverdue,
        ]}
      >
        <TouchableOpacity 
          style={styles.taskCheckbox}
          onPress={() => handleToggleTask(task)}
        >
          {isCompleted ? (
            <CheckCircle2 size={24} color="#2ECC71" />
          ) : (
            <Circle size={24} color={isOverdue ? "#E74C3C" : colors.textSecondary} />
          )}
        </TouchableOpacity>
        
        <View style={styles.taskContent}>
          <View style={styles.taskTitleRow}>
            <Text
              style={[
                styles.taskTitle,
                { color: isOverdue ? "#E74C3C" : colors.text },
                isCompleted && styles.taskTitleCompleted,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {isOverdue && (
              <View style={styles.overdueIndicator}>
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
          {task.labels && task.labels.length > 0 && (
            <View style={styles.taskLabels}>
              <LabelDisplay labels={task.labels} />
            </View>
          )}
          <View style={styles.taskMeta}>
            {task.formatted_time && (
              <View style={styles.taskMetaItem}>
                <Clock size={14} color={isOverdue ? "#E74C3C" : "#FAB300"} />
                <Text style={[styles.taskMetaText, { color: isOverdue ? "#E74C3C" : "#FAB300" }]}>
                  {task.formatted_time}
                </Text>
              </View>
            )}
            {task.due_date && !task.is_today && (
              <View style={styles.taskMetaItem}>
                <Text style={[styles.taskMetaText, { color: isOverdue ? "#E74C3C" : colors.textSecondary }]}>
                  {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Text>
              </View>
            )}
            {task.priority !== "low" && (
              <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
                <Flag size={12} color={getPriorityColor(task.priority)} />
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority}
                </Text>
              </View>
            )}
            {isRecurring && (
              <View style={styles.taskMetaItem}>
                <Repeat size={12} color="#9B59B6" />
              </View>
            )}
          </View>
        </View>

        <TaskContextMenu task={task} onUpdate={handleTaskUpdate} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Today</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {pendingTasks.length} tasks
          </Text>
        </View>
      </View>

      {/* Active Filter Indicator */}
      {hasActiveFilter && (
        <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.filterInfo}>
            <Text style={[styles.filterText, { color: colors.text }]}>Filtering by: </Text>
            {filterPriority ? (
              <View style={[styles.filterChip, { backgroundColor: `${getPriorityColor(filterPriority)}20` }]}>
                <Flag size={12} color={getPriorityColor(filterPriority)} />
                <Text style={[styles.filterChipText, { color: getPriorityColor(filterPriority) }]}>
                  {filterPriority}
                </Text>
              </View>
            ) : null}
            {searchQuery.trim() ? (
              <View style={[styles.filterChip, { backgroundColor: `${colors.accent}20` }]}>
                <Text style={[styles.filterChipText, { color: colors.accent }]}>
                  {`"${searchQuery}"`}
                </Text>
              </View>
            ) : null}
            {filterLabelId ? (
              <View style={[styles.filterChip, { backgroundColor: `${colors.accent}20` }]}>
                <Text style={[styles.filterChipText, { color: colors.accent }]}>Label</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
            <X size={16} color={colors.textSecondary} />
            <Text style={[styles.clearFilterText, { color: colors.textSecondary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FAB300"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {today.toLocaleDateString("en-US", { day: "numeric", month: "short" })} · Today
          </Text>
          <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
            {pendingTasks.length}
          </Text>
        </View>

        {/* Overdue Tasks */}
        {filteredOverdueTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: "#E74C3C" }]}>Overdue</Text>
            <View style={styles.tasksList}>
              {filteredOverdueTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </View>
          </View>
        )}

        {/* Pending Tasks */}
        <View style={styles.tasksList}>
          {pendingTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </View>

        {/* Add Task - Inline */}
        {showAddTask ? (
          <View style={styles.addTaskContainer}>
            <InlineAddTask
              initialDate={todayStr}
              onClose={() => setShowAddTask(false)}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addTaskButton}
            onPress={() => setShowAddTask(true)}
          >
            <Plus size={18} color={colors.text} />
            <Text style={[styles.addTaskButtonText, { color: colors.text }]}>Add task</Text>
          </TouchableOpacity>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>
              Completed ({completedTasks.length})
            </Text>
            <View style={styles.tasksList}>
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && filteredOverdueTasks.length === 0 && !showAddTask && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks for today. Tap "Add task" to create one.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
  },
  scrollContentDesktop: {
    paddingHorizontal: 24,
    maxWidth: 700,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskCountText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  taskLabels: {
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  taskMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
  },
  addTaskContainer: {
    marginTop: 8,
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  completedSection: {
    marginTop: 24,
  },
  completedLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  taskItemOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: "#E74C3C",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overdueIndicator: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#E74C3C",
    textTransform: "uppercase",
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
