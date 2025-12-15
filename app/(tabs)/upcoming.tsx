import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Circle, CheckCircle2, Clock, Flag, HelpCircle, Repeat } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore, TaskWithDetails } from "@/stores/taskStore";
import { useResponsive } from "@/hooks/useResponsive";
import { InlineAddTask, TaskContextMenu, LabelDisplay, TaskFilterBar } from "@/components/ui";
import { searchEventEmitter } from "@/components/ui/Sidebar";

// Helper to get days array starting from today
const getDaysArray = (startDate: Date, numDays: number) => {
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
};

// Format date helpers
const formatDayLabel = (date: Date, today: Date) => {
  const isToday = date.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const formatDateShort = (date: Date) => {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "#E74C3C";
    case "medium": return "#FAB300";
    case "low": return "#6B7280";
    default: return "#6B7280";
  }
};

export default function UpcomingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks, completeTask, uncompleteTask } = useTaskStore();
  const { isDesktop } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);

  const [startDate, setStartDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [addingTaskForDate, setAddingTaskForDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  const today = new Date();
  const numDays = isDesktop ? 7 : 5;
  const days = getDaysArray(startDate, numDays);

  // Filter function
  const filterTasks = (taskList: TaskWithDetails[]) => {
    return taskList.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }
      
      // Label filter
      if (filterLabelIds.length > 0) {
        const taskLabelIds = task.labels?.map(l => l.id) || [];
        const hasMatchingLabel = filterLabelIds.some(id => taskLabelIds.includes(id));
        if (!hasMatchingLabel) return false;
      }
      
      return true;
    });
  };

  // Get tasks without a date (Unknown section)
  const unknownTasks = filterTasks(tasks.filter(t => !t.due_date));

  useEffect(() => {
    if (user) {
      fetchTasks(user.id);
    }
  }, [user]);

  // Subscribe to command palette events
  useEffect(() => {
    const unsubscribe = searchEventEmitter.subscribe((data) => {
      if (data.type === "search") {
        setSearchQuery(data.value);
      } else if (data.type === "label") {
        setFilterLabelIds([data.value]);
      }
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    if (user) {
      fetchTasks(user.id);
    }
  };

  const goToPrevWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 7);
    setStartDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 7);
    setStartDate(newDate);
  };

  const goToToday = () => {
    setStartDate(new Date());
  };

  const handleToggleTask = async (task: TaskWithDetails) => {
    if (task.status === "completed") {
      await uncompleteTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): TaskWithDetails[] => {
    const dateStr = date.toISOString().split("T")[0];
    return filterTasks(tasks.filter((task) => task.due_date === dateStr));
  };

  const handleTaskUpdate = () => {
    if (user) {
      fetchTasks(user.id);
    }
  };

  const TaskItem = ({ task }: { task: TaskWithDetails }) => {
    const isCompleted = task.status === "completed";
    
    return (
      <View
        style={[
          styles.taskItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity 
          style={styles.taskCheckbox}
          onPress={() => handleToggleTask(task)}
        >
          {isCompleted ? (
            <CheckCircle2 size={20} color="#2ECC71" />
          ) : (
            <Circle size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text },
              isCompleted && styles.taskTitleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.labels && task.labels.length > 0 && (
            <View style={styles.taskLabels}>
              <LabelDisplay labels={task.labels} />
            </View>
          )}
          <View style={styles.taskMeta}>
            {task.formatted_time && (
              <View style={styles.taskMetaItem}>
                <Clock size={12} color="#FAB300" />
                <Text style={[styles.taskMetaText, { color: "#FAB300" }]}>
                  {task.formatted_time}
                </Text>
              </View>
            )}
            {task.priority !== "low" && (
              <View style={styles.taskMetaItem}>
                <Flag size={12} color={getPriorityColor(task.priority)} />
              </View>
            )}
            {task.recurrence && task.recurrence !== "none" && (
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

  // Unknown Section Column (for tasks without dates)
  const UnknownColumn = () => {
    const isAddingHere = addingTaskForDate === "unknown";
    const pendingTasks = unknownTasks.filter(t => t.status !== "completed");
    const completedTasks = unknownTasks.filter(t => t.status === "completed");

    if (unknownTasks.length === 0 && !isAddingHere) {
      return null; // Don't show if no unknown tasks
    }

    return (
      <View style={[styles.dayColumn, styles.unknownColumn, isDesktop && styles.dayColumnDesktop]}>
        <View style={[styles.dayHeader, { borderBottomColor: colors.textSecondary }]}>
          <View style={styles.dayHeaderTop}>
            <View style={styles.unknownIconContainer}>
              <HelpCircle size={18} color={colors.textSecondary} />
            </View>
            <Text style={[styles.dayName, { color: colors.textSecondary }]}>
              No Date
            </Text>
          </View>
          <View style={[styles.taskCount, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F0F0" }]}>
            <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
              {pendingTasks.length}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.dayTasks} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.dayTasksContent}
        >
          {pendingTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}

          {/* Inline Add Task */}
          {isAddingHere ? (
            <InlineAddTask
              initialDate={undefined}
              onClose={() => setAddingTaskForDate(null)}
            />
          ) : (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => setAddingTaskForDate("unknown")}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.addTaskText, { color: colors.text }]}>Add task</Text>
            </TouchableOpacity>
          )}

          {completedTasks.length > 0 && (
            <>
              <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>
                Completed ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const DayColumn = ({ date }: { date: Date }) => {
    const dateTasks = getTasksForDate(date);
    const dayLabel = formatDayLabel(date, today);
    const dateShort = formatDateShort(date);
    const isToday = date.toDateString() === today.toDateString();
    const dateStr = date.toISOString().split("T")[0];
    const isAddingHere = addingTaskForDate === dateStr;

    // Separate pending and completed
    const pendingTasks = dateTasks.filter(t => t.status !== "completed");
    const completedTasks = dateTasks.filter(t => t.status === "completed");

    return (
      <View style={[styles.dayColumn, isDesktop && styles.dayColumnDesktop]}>
        <View style={[styles.dayHeader, { borderBottomColor: isToday ? "#FAB300" : colors.border }]}>
          <View style={styles.dayHeaderTop}>
            <Text style={[styles.dayDate, { color: colors.text }]}>{dateShort}</Text>
            <Text style={[styles.dayName, { color: isToday ? "#FAB300" : colors.textSecondary }]}>
              {dayLabel}
            </Text>
          </View>
          <View style={[styles.taskCount, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F0F0" }]}>
            <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
              {pendingTasks.length}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.dayTasks} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.dayTasksContent}
        >
          {pendingTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}

          {/* Inline Add Task */}
          {isAddingHere ? (
            <InlineAddTask
              initialDate={dateStr}
              onClose={() => setAddingTaskForDate(null)}
            />
          ) : (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => setAddingTaskForDate(dateStr)}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.addTaskText, { color: colors.text }]}>Add task</Text>
            </TouchableOpacity>
          )}

          {completedTasks.length > 0 && (
            <>
              <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>
                Completed ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upcoming</Text>
          <TouchableOpacity style={styles.monthSelector}>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: "90deg" }] }} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.navButtons}>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.border }]} 
              onPress={goToPrevWeek}
            >
              <ChevronLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.border }]} 
              onPress={goToNextWeek}
            >
              <ChevronRight size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.todayButton, { borderColor: colors.border }]} 
            onPress={goToToday}
          >
            <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <TaskFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLabelIds={filterLabelIds}
        onLabelFilterChange={setFilterLabelIds}
      />

      {/* Days Grid */}
      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.daysContainer}
        contentContainerStyle={styles.daysContent}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FAB300"
          />
        }
      >
        {/* Unknown Section - Always First */}
        <UnknownColumn />
        
        {/* Day Columns */}
        {days.map((date) => (
          <DayColumn key={date.toISOString()} date={date} />
        ))}
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
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthText: {
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navButtons: {
    flexDirection: "row",
    gap: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  daysContainer: {
    flex: 1,
  },
  daysContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayColumn: {
    width: 280,
    marginHorizontal: 8,
  },
  dayColumnDesktop: {
    width: 300,
  },
  unknownColumn: {
    // Styling for unknown column
  },
  unknownIconContainer: {
    marginRight: 6,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 2,
  },
  dayHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dayDate: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
  dayName: {
    fontSize: 13,
  },
  taskCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  taskCountText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dayTasks: {
    flex: 1,
  },
  dayTasksContent: {
    gap: 8,
    paddingBottom: 20,
  },
  completedLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  taskCheckbox: {
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
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
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
