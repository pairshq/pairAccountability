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
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Circle, 
  CheckCircle2,
  Clock,
  Flag,
  Repeat,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore, TaskWithDetails } from "@/stores/taskStore";
import { useResponsive } from "@/hooks/useResponsive";
import { InlineAddTask, TaskContextMenu, LabelDisplay } from "@/components/ui";
import { searchEventEmitter } from "@/components/ui/Sidebar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Get calendar days for a month
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  
  const days: (Date | null)[] = [];
  
  // Add empty slots for days before the first day
  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "#E74C3C";
    case "medium": return "#FAB300";
    case "low": return "#6B7280";
    default: return "#6B7280";
  }
};

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks, completeTask, uncompleteTask } = useTaskStore();
  const { isDesktop } = useResponsive();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  const calendarDays = getCalendarDays(currentYear, currentMonth);

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

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
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

  // Filter helper for search and labels
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

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): TaskWithDetails[] => {
    const dateStr = date.toISOString().split("T")[0];
    const dateTasks = tasks.filter((task) => task.due_date === dateStr);
    return filterTasks(dateTasks);
  };

  // Get task count for a date (for calendar dots)
  const getTaskCountForDate = (date: Date): number => {
    return getTasksForDate(date).filter(t => t.status !== "completed").length;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const selectedDateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const pendingTasks = selectedTasks.filter(t => t.status !== "completed");
  const completedTasks = selectedTasks.filter(t => t.status === "completed");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.todayButton, { borderColor: colors.border }]} 
            onPress={goToToday}
          >
            <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.monthNavButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Weekday Headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => {
              const taskCount = date ? getTaskCountForDate(date) : 0;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    date && isToday(date) && styles.todayCell,
                    date && isSelected(date) && styles.selectedCell,
                  ]}
                  onPress={() => {
                    if (date) {
                      setSelectedDate(date);
                      setShowAddTask(false);
                    }
                  }}
                  disabled={!date}
                >
                  {date && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          { color: colors.text },
                          isToday(date) && styles.todayText,
                          isSelected(date) && styles.selectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {taskCount > 0 && (
                        <View style={styles.taskDotsContainer}>
                          {taskCount <= 3 ? (
                            [...Array(taskCount)].map((_, i) => (
                              <View 
                                key={i} 
                                style={[
                                  styles.taskDot,
                                  isSelected(date) && styles.taskDotSelected,
                                ]} 
                              />
                            ))
                          ) : (
                            <>
                              <View style={[styles.taskDot, isSelected(date) && styles.taskDotSelected]} />
                              <View style={[styles.taskDot, isSelected(date) && styles.taskDotSelected]} />
                              <Text style={[styles.taskDotMore, isSelected(date) && { color: "#FFFFFF" }]}>
                                +{taskCount - 2}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Tasks */}
        {selectedDate && (
          <View style={styles.selectedDaySection}>
            <View style={styles.selectedDayHeader}>
              <Text style={[styles.selectedDayTitle, { color: colors.text }]}>
                {selectedDate.toLocaleDateString("en-US", { 
                  weekday: "long",
                  month: "long", 
                  day: "numeric" 
                })}
              </Text>
              <Text style={[styles.taskCountLabel, { color: colors.textSecondary }]}>
                {pendingTasks.length}
              </Text>
            </View>

            {/* Tasks List */}
            <View style={styles.tasksList}>
              {pendingTasks.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.taskCheckbox}
                    onPress={() => handleToggleTask(task)}
                  >
                    <Circle size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
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
                      {task.recurrence && task.recurrence !== "none" && (
                        <View style={styles.taskMetaItem}>
                          <Repeat size={12} color="#9B59B6" />
                        </View>
                      )}
                    </View>
                  </View>
                  <TaskContextMenu task={task} onUpdate={handleTaskUpdate} />
                </View>
              ))}
            </View>

            {/* Inline Add Task */}
            {showAddTask ? (
              <InlineAddTask
                initialDate={selectedDateStr}
                onClose={() => setShowAddTask(false)}
              />
            ) : (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => setShowAddTask(true)}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[styles.addTaskButtonText, { color: colors.text }]}>Add task</Text>
            </TouchableOpacity>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>
                  Completed ({completedTasks.length})
                </Text>
                {completedTasks.map((task) => (
                  <View
                    key={task.id}
                    style={[
                      styles.taskItem,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => handleToggleTask(task)}
                    >
                      <CheckCircle2 size={20} color="#2ECC71" />
                    </TouchableOpacity>
                    <View style={styles.taskContent}>
                      <Text 
                        style={[styles.taskTitle, styles.taskTitleCompleted, { color: colors.text }]} 
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                    </View>
                    <TaskContextMenu task={task} onUpdate={handleTaskUpdate} />
                  </View>
                ))}
              </>
            )}

            {/* Empty State */}
            {selectedTasks.length === 0 && !showAddTask && (
              <View style={[styles.noTasks, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                  No tasks scheduled
                </Text>
              </View>
            )}
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
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    maxWidth: 700,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthNavButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  todayCell: {
    backgroundColor: "rgba(250, 179, 0, 0.1)",
    borderRadius: 20,
  },
  selectedCell: {
    backgroundColor: "#000000",
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
  },
  todayText: {
    color: "#FAB300",
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  taskDotsContainer: {
    position: "absolute",
    bottom: 4,
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FAB300",
  },
  taskDotSelected: {
    backgroundColor: "#FFFFFF",
  },
  taskDotMore: {
    fontSize: 8,
    color: "#FAB300",
    fontWeight: "600",
  },
  selectedDaySection: {
    gap: 12,
  },
  selectedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  taskCountLabel: {
    fontSize: 14,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCheckbox: {},
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
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
  taskCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskCategoryText: {
    fontSize: 11,
    fontWeight: "500",
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  completedLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noTasks: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  noTasksText: {
    fontSize: 14,
  },
});
