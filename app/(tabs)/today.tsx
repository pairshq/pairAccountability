import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { WorkingPersonIllustration } from "@/components/ui/WorkingPersonIllustration";
import { 
  Plus, 
  Circle, 
  CheckCircle2, 
  Clock, 
  Flag,
  ChevronRight,
  ChevronLeft,
  Sun,
  Sunset,
  Moon,
  Repeat,
  X,
  Pin,
  Calendar,
  MapPin,
  Users,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
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

// Get current time formatted
const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

// Get weather text (placeholder)
const getWeatherText = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) return "Now is almost Sunny";
  return "Now is Clear";
};

// Generate calendar days for current month
const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const timePeriod = getTimePeriod();
  const displayName = profile?.full_name?.split(" ")[0] || profile?.username || "there";
  const calendarDays = getCalendarDays(calendarDate);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks for today
  const todayTasks = tasks.filter(t => t.due_date === todayStr);
  const overdueTasks = tasks.filter(t => t.is_overdue);
  
  // Pinned tasks (high priority or recurring)
  const pinnedTasks = tasks.filter(t => t.priority === "high" || t.recurrence !== "none").slice(0, 3);

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

  // Sort tasks by time
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    if (!a.formatted_time && !b.formatted_time) return 0;
    if (!a.formatted_time) return 1;
    if (!b.formatted_time) return -1;
    return a.formatted_time.localeCompare(b.formatted_time);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header - Uniform Design */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Today Schedule</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} pending
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddTask(true)}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* LEFT PANEL - Weekly Pinned & Calendar */}
        <View style={[styles.leftPanel, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Greeting Section */}
            <View style={styles.greetingSection}>
              <View style={styles.greetingContent}>
                <Text style={[styles.greetingText, { color: colors.text }]}>
                  {timePeriod.greeting}, {displayName}
                </Text>
                <Text style={[styles.greetingSummary, { color: colors.textSecondary }]}>
                  Today you have <Text style={styles.greetingHighlight}>{pendingTasks.length} tasks</Text>
                  {pinnedTasks.length > 0 && <Text> and <Text style={styles.greetingHighlight}>{pinnedTasks.length} priorities</Text></Text>}
                </Text>
              </View>
              <WorkingPersonIllustration size={100} />
            </View>

            {/* Weekly Pinned Header */}
            <View style={styles.pinnedHeader}>
              <Text style={[styles.pinnedTitle, { color: colors.text }]}>Weekly Pinned</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Pinned Items */}
            <View style={styles.pinnedList}>
              {pinnedTasks.length > 0 ? pinnedTasks.map((task) => (
                <View key={task.id} style={[styles.pinnedCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF", borderColor: colors.border }]}>
                  <View style={styles.pinnedIconWrap}>
                    <Pin size={16} color="#FAB300" />
                  </View>
                  <View style={styles.pinnedContent}>
                    <Text style={[styles.pinnedTaskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                    <Text style={[styles.pinnedTaskDate, { color: colors.textSecondary }]}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No date"} 
                      {task.formatted_time ? ` · ${task.formatted_time}` : ""}
                    </Text>
                    {task.priority === "high" && (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedBadgeText}>Priority</Text>
                      </View>
                    )}
                    {task.description && (
                      <Text style={[styles.pinnedDesc, { color: colors.textSecondary }]} numberOfLines={2}>{task.description}</Text>
                    )}
                  </View>
                </View>
              )) : (
                <View style={[styles.pinnedCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF", borderColor: colors.border }]}>
                  <View style={styles.pinnedIconWrap}>
                    <Pin size={16} color={colors.textSecondary} />
                  </View>
                  <View style={styles.pinnedContent}>
                    <Text style={[styles.pinnedTaskTitle, { color: colors.textSecondary }]}>No pinned tasks</Text>
                    <Text style={[styles.pinnedTaskDate, { color: colors.textSecondary }]}>High priority tasks appear here</Text>
                  </View>
                </View>
              )}

              {/* Add new weekly pin */}
              <TouchableOpacity style={styles.addPinButton}>
                <Plus size={16} color="#FAB300" />
                <Text style={styles.addPinText}>Add new weekly pin</Text>
              </TouchableOpacity>
            </View>

            {/* Mini Calendar */}
            <View style={styles.calendarSection}>
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarMonth, { color: colors.text }]}>
                  {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </Text>
                <View style={styles.calendarNav}>
                  <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}>
                    <ChevronLeft size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.twoWeeksText}>Two weeks</Text>
              </TouchableOpacity>
              
              {/* Calendar Grid */}
              <View style={styles.calendarWeekdays}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => {
                  const isToday = day === today.getDate() && calendarDate.getMonth() === today.getMonth() && calendarDate.getFullYear() === today.getFullYear();
                  return (
                    <View key={index} style={styles.calendarDayWrap}>
                      {day && (
                        <View style={[styles.calendarDay, isToday && styles.calendarDayToday]}>
                          <Text style={[styles.calendarDayText, { color: isToday ? "#FFF" : colors.text }]}>{day}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* CENTER PANEL - Today's Schedule */}
        <View style={styles.centerPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#FAB300" />}
          >
            {/* Schedule Header */}
            <View style={styles.scheduleHeader}>
              <View>
                <Text style={[styles.scheduleTitle, { color: colors.text }]}>Today's schedule</Text>
                <Text style={styles.scheduleDay}>{today.toLocaleDateString("en-US", { weekday: "long" })} {today.getDate()}</Text>
              </View>
              <View style={styles.scheduleActions}>
                <TouchableOpacity style={styles.addScheduleBtn} onPress={() => setShowAddTask(true)}>
                  <Plus size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scheduleNavBtn, { borderColor: colors.border }]}>
                  <ChevronLeft size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scheduleNavBtn, { borderColor: colors.border }]}>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Inline Add Task */}
            {showAddTask && (
              <View style={styles.addTaskInline}>
                <InlineAddTask initialDate={todayStr} onClose={() => setShowAddTask(false)} />
              </View>
            )}

            {/* Schedule List */}
            <View style={styles.scheduleList}>
              {sortedTasks.length > 0 ? sortedTasks.map((task, index) => {
                const isHighlighted = index < 2;
                const isCompleted = task.status === "completed";
                return (
                  <View 
                    key={task.id} 
                    style={[
                      styles.scheduleItem,
                      isHighlighted && !isCompleted && styles.scheduleItemHighlight,
                      { backgroundColor: isHighlighted && !isCompleted ? "#FFF8E7" : colors.isDark ? "#1A1A1A" : "#FFF" }
                    ]}
                  >
                    <TouchableOpacity style={styles.scheduleCheckbox} onPress={() => handleToggleTask(task)}>
                      {isCompleted ? (
                        <CheckCircle2 size={20} color="#2ECC71" />
                      ) : (
                        <View style={[styles.checkCircle, isHighlighted && styles.checkCircleHighlight]} />
                      )}
                    </TouchableOpacity>
                    <View style={styles.scheduleContent}>
                      <Text style={[styles.scheduleTaskTitle, { color: colors.text }, isCompleted && styles.scheduleTaskCompleted]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text style={[styles.scheduleTaskDesc, { color: colors.textSecondary }]} numberOfLines={2}>{task.description}</Text>
                      )}
                      {task.labels && task.labels.length > 0 && (
                        <View style={styles.scheduleLabels}>
                          <LabelDisplay labels={task.labels} />
                        </View>
                      )}
                    </View>
                    <View style={styles.scheduleTime}>
                      <Text style={[styles.scheduleTimeText, { color: isHighlighted ? "#D97706" : colors.textSecondary }]}>
                        {task.formatted_time || "All day"}
                      </Text>
                    </View>
                    <TaskContextMenu task={task} onUpdate={handleTaskUpdate} />
                  </View>
                );
              }) : (
                <View style={styles.emptySchedule}>
                  <Calendar size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyScheduleText, { color: colors.textSecondary }]}>No tasks scheduled for today</Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddTask(true)}>
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.emptyAddBtnText}>Add task</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <View style={styles.completedSection}>
                  <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>Completed ({completedTasks.length})</Text>
                  {completedTasks.map((task) => (
                    <View key={task.id} style={[styles.scheduleItem, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF", opacity: 0.6 }]}>
                      <TouchableOpacity style={styles.scheduleCheckbox} onPress={() => handleToggleTask(task)}>
                        <CheckCircle2 size={20} color="#2ECC71" />
                      </TouchableOpacity>
                      <View style={styles.scheduleContent}>
                        <Text style={[styles.scheduleTaskTitle, styles.scheduleTaskCompleted, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                      </View>
                      <View style={styles.scheduleTime}>
                        <Text style={[styles.scheduleTimeText, { color: colors.textSecondary }]}>{task.formatted_time || "Done"}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* RIGHT PANEL - Widgets */}
        <View style={[styles.rightPanel, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Focus Widget */}
            <View style={[styles.focusWidget, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF" }]}>
              <View style={styles.focusHeader}>
                <View style={styles.focusAvatarSmall}>
                  <Text style={styles.focusAvatarText}>🎵</Text>
                </View>
                <View style={styles.focusInfo}>
                  <Text style={[styles.focusTitle, { color: colors.text }]}>Focus Mode</Text>
                  <Text style={[styles.focusSubtitle, { color: colors.textSecondary }]}>Ready to start</Text>
                </View>
              </View>
              <View style={styles.focusProgress}>
                <View style={styles.focusProgressBar}>
                  <View style={styles.focusProgressFill} />
                </View>
                <View style={styles.focusTimeRow}>
                  <Text style={[styles.focusTimeText, { color: colors.textSecondary }]}>0:00</Text>
                  <Text style={[styles.focusTimeText, { color: colors.textSecondary }]}>25:00</Text>
                </View>
              </View>
              <View style={styles.focusControls}>
                <TouchableOpacity style={styles.focusControlBtn}>
                  <SkipBack size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.focusPlayBtn}>
                  <Play size={20} color="#FFF" fill="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.focusControlBtn}>
                  <SkipForward size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Widget */}
            <View style={styles.timeWidget}>
              <Text style={[styles.timeText, { color: colors.text }]}>{currentTime}</Text>
              <Text style={[styles.weatherText, { color: colors.textSecondary }]}>{getWeatherText()}</Text>
            </View>

            {/* Motivational Card */}
            <View style={styles.motivationCard}>
              <Text style={styles.motivationTitle}>Unleash the{"\n"}productivity{"\n"}super power</Text>
              <Text style={styles.motivationSubtitle}>Complete your tasks, earn{"\n"}streaks and much more.</Text>
              <View style={styles.motivationIllustration}>
                <Text style={styles.illustrationEmoji}>💪</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.statsCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF" }]}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>Today's Progress</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: "#FAB300" }]}>{completedTasks.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{pendingTasks.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: "#2ECC71" }]}>{completionRate}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header - Uniform Design
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAB300",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  mainContent: { flex: 1, flexDirection: "row", padding: 8 },
  
  // Left Panel
  leftPanel: { width: 300, padding: 24, borderRadius: 16, margin: 16, marginRight: 8 },
  pinnedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pinnedTitle: { fontSize: 16, fontWeight: "600" },
  seeAllText: { fontSize: 13, color: "#FAB300", fontWeight: "500" },
  pinnedList: { gap: 12 },
  pinnedCard: { flexDirection: "row", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  pinnedIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFF8E7", alignItems: "center", justifyContent: "center" },
  pinnedContent: { flex: 1 },
  pinnedTaskTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  pinnedTaskDate: { fontSize: 12, marginBottom: 6 },
  pinnedBadge: { backgroundColor: "#FAB300", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start", marginBottom: 6 },
  pinnedBadgeText: { fontSize: 10, fontWeight: "600", color: "#FFF" },
  pinnedDesc: { fontSize: 12, lineHeight: 16 },
  addPinButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  addPinText: { fontSize: 13, color: "#FAB300", fontWeight: "500" },
  
  // Calendar
  calendarSection: { marginTop: 24 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  calendarMonth: { fontSize: 14, fontWeight: "600" },
  calendarNav: { flexDirection: "row", gap: 8 },
  twoWeeksText: { fontSize: 12, color: "#FAB300", marginBottom: 12 },
  calendarWeekdays: { flexDirection: "row", marginBottom: 8 },
  weekdayText: { flex: 1, fontSize: 11, textAlign: "center", fontWeight: "500" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDayWrap: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calendarDay: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  calendarDayToday: { backgroundColor: "#3B82F6" },
  calendarDayText: { fontSize: 12, fontWeight: "500" },
  
  // Center Panel
  centerPanel: { flex: 1, padding: 24, paddingTop: 16 },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingHorizontal: 8 },
  scheduleTitle: { fontSize: 28, fontWeight: "700" },
  scheduleDay: { fontSize: 18, color: "#FAB300", fontWeight: "600", marginTop: 4 },
  scheduleActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  addScheduleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FAB300", alignItems: "center", justifyContent: "center" },
  scheduleNavBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addTaskInline: { marginBottom: 16, paddingHorizontal: 8 },
  scheduleList: { gap: 16, paddingHorizontal: 8 },
  scheduleItem: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 14, gap: 14 },
  scheduleItemHighlight: { borderLeftWidth: 4, borderLeftColor: "#FAB300" },
  scheduleCheckbox: { marginRight: 4 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB" },
  checkCircleHighlight: { borderColor: "#FAB300" },
  scheduleContent: { flex: 1 },
  scheduleTaskTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  scheduleTaskCompleted: { textDecorationLine: "line-through", opacity: 0.5 },
  scheduleTaskDesc: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  scheduleLabels: { marginTop: 4 },
  scheduleTime: { paddingLeft: 12 },
  scheduleTimeText: { fontSize: 13, fontWeight: "600" },
  emptySchedule: { alignItems: "center", paddingVertical: 48 },
  emptyScheduleText: { fontSize: 16, marginTop: 16, marginBottom: 16 },
  emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FAB300", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyAddBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  completedSection: { marginTop: 24 },
  completedLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  
  // Right Panel
  rightPanel: { width: 300, padding: 24, borderRadius: 16, margin: 16, marginLeft: 8 },
  
  // Focus Widget
  focusWidget: { padding: 20, borderRadius: 14, marginBottom: 20 },
  focusHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  focusAvatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF8E7", alignItems: "center", justifyContent: "center" },
  focusAvatarText: { fontSize: 18 },
  focusInfo: { flex: 1 },
  focusTitle: { fontSize: 14, fontWeight: "600" },
  focusSubtitle: { fontSize: 12, marginTop: 2 },
  focusProgress: { marginBottom: 16 },
  focusProgressBar: { height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, marginBottom: 8 },
  focusProgressFill: { width: "0%", height: "100%", backgroundColor: "#FAB300", borderRadius: 2 },
  focusTimeRow: { flexDirection: "row", justifyContent: "space-between" },
  focusTimeText: { fontSize: 11 },
  focusControls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16 },
  focusControlBtn: { padding: 8 },
  focusPlayBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" },
  
  // Time Widget
  timeWidget: { alignItems: "center", paddingVertical: 24 },
  timeText: { fontSize: 36, fontWeight: "700" },
  weatherText: { fontSize: 13, marginTop: 4 },
  
  // Motivation Card
  motivationCard: { backgroundColor: "#FFF8E7", padding: 20, borderRadius: 12, marginBottom: 16 },
  motivationTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  motivationSubtitle: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  motivationIllustration: { alignItems: "flex-end", marginTop: 12 },
  illustrationEmoji: { fontSize: 32 },
  
  // Stats Card
  statsCard: { padding: 16, borderRadius: 12 },
  statsTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4 },

  // Greeting Section
  greetingSection: { marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greetingContent: { flex: 1 },
  greetingText: { fontSize: 20, fontWeight: "600", marginBottom: 6 },
  greetingSummary: { fontSize: 13, lineHeight: 18 },
  greetingHighlight: { color: "#FAB300", fontWeight: "600" },
  greetingImage: { width: 100, height: 100 },

  // Legacy styles kept for TaskItem component
  taskItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  taskCheckbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: "500", marginBottom: 4 },
  taskTitleCompleted: { textDecorationLine: "line-through", opacity: 0.6 },
  taskLabels: { marginBottom: 4 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  taskMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  taskMetaText: { fontSize: 12, fontWeight: "500" },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  taskItemOverdue: { borderLeftWidth: 3, borderLeftColor: "#E74C3C" },
  taskTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  overdueIndicator: { backgroundColor: "rgba(231, 76, 60, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  overdueText: { fontSize: 10, fontWeight: "600", color: "#E74C3C", textTransform: "uppercase" },
});
