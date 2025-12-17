import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Circle, 
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore, TaskWithDetails } from "@/stores/taskStore";
import { useResponsive } from "@/hooks/useResponsive";
import { searchEventEmitter } from "@/components/ui/Sidebar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type ViewMode = "day" | "week" | "month" | "year";

// Get calendar days for a month (Monday start)
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Get day of week (0 = Sunday, convert to Monday = 0)
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  
  const days: (Date | null)[] = [];
  
  // Add days from previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth, prevMonthLastDay - i));
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add days from next month to complete the grid (6 rows)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(nextYear, nextMonth, i));
  }
  
  return days;
};

// Get week days for a specific date
const getWeekDays = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const monday = new Date(date);
  monday.setDate(diff);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

// Generate hours for day/week view
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i < 12) return `${i}am`;
  if (i === 12) return "12pm";
  return `${i - 12}pm`;
});

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks, completeTask, uncompleteTask } = useTaskStore();
  const { isDesktop } = useResponsive();

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const calendarDays = getCalendarDays(currentYear, currentMonth);
  const weekDays = getWeekDays(currentDate);

  useEffect(() => {
    if (user) {
      fetchTasks(user.id);
    }
  }, [user]);

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

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === "year") {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const filterTasks = (taskList: TaskWithDetails[]) => {
    return taskList.filter(task => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }
      if (filterLabelIds.length > 0) {
        const taskLabelIds = task.labels?.map(l => l.id) || [];
        const hasMatchingLabel = filterLabelIds.some(id => taskLabelIds.includes(id));
        if (!hasMatchingLabel) return false;
      }
      return true;
    });
  };

  const getTasksForDate = (date: Date): TaskWithDetails[] => {
    const dateStr = date.toISOString().split("T")[0];
    const dateTasks = tasks.filter((task) => task.due_date === dateStr);
    return filterTasks(dateTasks);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const getHeaderTitle = () => {
    if (viewMode === "day") {
      return `${currentDate.getDate()} ${MONTHS[currentMonth]} ${currentYear}`;
    } else if (viewMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${currentYear}`;
      }
      return `${MONTHS[start.getMonth()]} - ${MONTHS[end.getMonth()]} ${currentYear}`;
    } else if (viewMode === "year") {
      return `${currentYear}`;
    }
    return `${MONTHS[currentMonth]} ${currentYear}`;
  };

  // Render Month View
  const renderMonthView = () => (
    <View style={styles.monthGrid}>
      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysContainer}>
        {calendarDays.map((date, index) => {
          if (!date) return <View key={index} style={styles.dayCell} />;
          
          const dayTasks = getTasksForDate(date);
          const isInCurrentMonth = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <View
              key={index}
              style={[
                styles.dayCell,
                { borderColor: colors.border },
                !isInCurrentMonth && styles.dayCellOutside,
              ]}
            >
              <View style={styles.dayCellHeader}>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isInCurrentMonth ? colors.text : colors.textSecondary },
                    isTodayDate && styles.todayNumber,
                  ]}
                >
                  {date.getDate() === 1 ? `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}` : date.getDate()}
                </Text>
              </View>
              <ScrollView style={styles.dayTasksContainer} showsVerticalScrollIndicator={false}>
                {dayTasks.slice(0, 5).map((task) => (
                  <View
                    key={task.id}
                    style={[
                      styles.taskChip,
                      { backgroundColor: task.status === "completed" ? "#2ECC71" : "#9B59B6" },
                    ]}
                  >
                    <Text style={styles.taskChipText} numberOfLines={1}>
                      {task.formatted_time && `${task.formatted_time} `}{task.title}
                    </Text>
                  </View>
                ))}
                {dayTasks.length > 5 && (
                  <Text style={[styles.moreTasksText, { color: colors.textSecondary }]}>
                    +{dayTasks.length - 5} more
                  </Text>
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Render Week View
  const renderWeekView = () => (
    <View style={styles.weekView}>
      {/* Header with days */}
      <View style={styles.weekHeader}>
        <View style={styles.timeColumn}>
          <Text style={[styles.allDayLabel, { color: colors.textSecondary }]}>all-day</Text>
        </View>
        {weekDays.map((date, index) => (
          <View key={index} style={styles.weekDayHeader}>
            <Text style={[styles.weekDayName, { color: colors.textSecondary }]}>
              {WEEKDAYS[index]}
            </Text>
            <Text
              style={[
                styles.weekDayNumber,
                { color: colors.text },
                isToday(date) && styles.todayNumber,
              ]}
            >
              {date.getDate()}
            </Text>
          </View>
        ))}
      </View>

      {/* Time grid */}
      <ScrollView style={styles.weekTimeGrid} showsVerticalScrollIndicator={false}>
        {HOURS.map((hour, hourIndex) => (
          <View key={hourIndex} style={styles.hourRow}>
            <View style={styles.timeColumn}>
              <Text style={[styles.hourLabel, { color: colors.textSecondary }]}>{hour}</Text>
            </View>
            {weekDays.map((date, dayIndex) => {
              const dayTasks = getTasksForDate(date);
              const hourTasks = dayTasks.filter(task => {
                if (!task.due_time) return false;
                const taskHour = parseInt(task.due_time.split(":")[0]);
                return taskHour === hourIndex;
              });
              
              return (
                <View
                  key={dayIndex}
                  style={[styles.hourCell, { borderColor: colors.border }]}
                >
                  {hourTasks.map((task) => (
                    <View
                      key={task.id}
                      style={[styles.weekTaskChip, { backgroundColor: "#9B59B6" }]}
                    >
                      <Text style={styles.weekTaskText} numberOfLines={2}>
                        {task.title}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Render Day View
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    
    return (
      <View style={styles.dayView}>
        <View style={styles.dayViewHeader}>
          <Text style={[styles.dayViewTitle, { color: colors.text }]}>
            {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
          </Text>
        </View>
        
        <ScrollView style={styles.dayTimeGrid} showsVerticalScrollIndicator={false}>
          {HOURS.map((hour, hourIndex) => {
            const hourTasks = dayTasks.filter(task => {
              if (!task.due_time) return false;
              const taskHour = parseInt(task.due_time.split(":")[0]);
              return taskHour === hourIndex;
            });
            
            return (
              <View key={hourIndex} style={styles.dayHourRow}>
                <View style={styles.dayTimeColumn}>
                  <Text style={[styles.hourLabel, { color: colors.textSecondary }]}>{hour}</Text>
                </View>
                <View style={[styles.dayHourCell, { borderColor: colors.border }]}>
                  {hourTasks.map((task) => (
                    <View
                      key={task.id}
                      style={[styles.dayTaskCard, { backgroundColor: "#9B59B6", borderColor: colors.border }]}
                    >
                      <Text style={styles.dayTaskTitle}>{task.title}</Text>
                      <Text style={styles.dayTaskTime}>
                        {task.formatted_time}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Year View
  const renderYearView = () => (
    <View style={styles.yearGrid}>
      {MONTHS.map((monthName, monthIndex) => {
        const monthDays = getCalendarDays(currentYear, monthIndex);
        
        return (
          <TouchableOpacity
            key={monthIndex}
            style={styles.yearMonth}
            onPress={() => {
              setCurrentDate(new Date(currentYear, monthIndex, 1));
              setViewMode("month");
            }}
          >
            <Text style={[styles.yearMonthTitle, { color: "#FAB300" }]}>{monthName}</Text>
            <View style={styles.miniCalendar}>
              <View style={styles.miniWeekdays}>
                {WEEKDAYS_SHORT.map((d, i) => (
                  <Text key={i} style={[styles.miniWeekday, { color: colors.textSecondary }]}>{d}</Text>
                ))}
              </View>
              <View style={styles.miniDays}>
                {monthDays.slice(0, 42).map((date, i) => {
                  if (!date) return <View key={i} style={styles.miniDay} />;
                  const isInMonth = date.getMonth() === monthIndex;
                  const isTodayDate = isToday(date);
                  return (
                    <View key={i} style={styles.miniDay}>
                      <Text
                        style={[
                          styles.miniDayText,
                          { color: isInMonth ? colors.text : colors.textSecondary },
                          isTodayDate && styles.miniDayToday,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderTitle()}</Text>
        
        {/* View Mode Toggles */}
        <View style={[styles.viewModeContainer, { backgroundColor: colors.isDark ? "#2C2C2E" : "#E5E5E5" }]}>
          {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && { backgroundColor: colors.isDark ? "#3C3C3E" : "#FFFFFF" },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.viewModeText,
                  { color: viewMode === mode ? colors.text : colors.textSecondary },
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navContainer}>
          <TouchableOpacity onPress={() => navigate(-1)} style={styles.navButton}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: colors.isDark ? "#2C2C2E" : "#E5E5E5" }]}
            onPress={goToToday}
          >
            <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigate(1)} style={styles.navButton}>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#FAB300" />
        }
        showsVerticalScrollIndicator={false}
      >
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
        {viewMode === "year" && renderYearView()}
      </ScrollView>
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    minWidth: 200,
  },
  viewModeContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
  },
  viewModeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Month View
  monthGrid: {
    flex: 1,
  },
  weekdayRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 100,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 4,
  },
  dayCellOutside: {
    opacity: 0.5,
  },
  dayCellHeader: {
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: "500",
  },
  todayNumber: {
    color: "#FAB300",
    fontWeight: "700",
  },
  dayTasksContainer: {
    flex: 1,
    gap: 2,
  },
  taskChip: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 2,
  },
  taskChipText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  moreTasksText: {
    fontSize: 10,
    marginTop: 2,
  },

  // Week View
  weekView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  timeColumn: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  allDayLabel: {
    fontSize: 10,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: "500",
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  weekTimeGrid: {
    flex: 1,
  },
  hourRow: {
    flexDirection: "row",
    height: 60,
  },
  hourLabel: {
    fontSize: 10,
    marginTop: -6,
  },
  hourCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 2,
  },
  weekTaskChip: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  weekTaskText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Day View
  dayView: {
    flex: 1,
  },
  dayViewHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  dayViewTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  dayTimeGrid: {
    flex: 1,
  },
  dayHourRow: {
    flexDirection: "row",
    height: 60,
  },
  dayTimeColumn: {
    width: 50,
    alignItems: "center",
  },
  dayHourCell: {
    flex: 1,
    borderBottomWidth: 1,
    padding: 4,
  },
  dayTaskCard: {
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginBottom: 4,
  },
  dayTaskTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  dayTaskTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },

  // Year View
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 20,
  },
  yearMonth: {
    width: `${(100 - 8) / 4}%`,
    marginBottom: 20,
  },
  yearMonthTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  miniCalendar: {},
  miniWeekdays: {
    flexDirection: "row",
    marginBottom: 4,
  },
  miniWeekday: {
    flex: 1,
    fontSize: 9,
    textAlign: "center",
  },
  miniDays: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  miniDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniDayText: {
    fontSize: 10,
  },
  miniDayToday: {
    color: "#FAB300",
    fontWeight: "700",
  },
});
