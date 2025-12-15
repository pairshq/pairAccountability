import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import {
  X,
  Calendar,
  Flag,
  Clock,
  Repeat,
  MoreHorizontal,
  Send,
  Sun,
  Sunrise,
  CalendarDays,
  ArrowRight,
  Circle,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: string;
}

type TaskPriority = "low" | "medium" | "high";
type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "high": return "#E74C3C";
    case "medium": return "#FAB300";
    case "low": return "#6B7280";
  }
};

const CATEGORY_OPTIONS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "personal", label: "Personal", icon: Circle },
  { id: "work", label: "Work", icon: Circle },
  { id: "health", label: "Health", icon: Circle },
];

export function AddTaskModal({ visible, onClose, initialDate }: AddTaskModalProps) {
  const colors = useColors();
  const { user } = useAuthStore();
  const { createTask, fetchTasks } = useTaskStore();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(initialDate || todayStr);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [category, setCategory] = useState("inbox");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(initialDate || todayStr);
    setDueTime(null);
    setPriority("medium");
    setRecurrence("none");
    setCategory("inbox");
    setShowDatePicker(false);
    setShowPriorityPicker(false);
    setShowTimePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    
    const { error } = await createTask({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || todayStr,
      due_time: dueTime,
      priority,
      status: "pending",
      recurrence,
      category,
      project_id: null,
    });

    setIsSubmitting(false);

    if (!error) {
      await fetchTasks(user.id);
      handleClose();
    }
  };

  // Date helpers
  const getDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "No Date";
    
    const date = new Date(dateStr);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === todayDate.getTime()) return "Today";
    if (targetDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const getDateColor = (dateStr: string | null) => {
    if (!dateStr) return colors.textSecondary;
    
    const date = new Date(dateStr);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === todayDate.getTime()) return "#2ECC71";
    if (date < todayDate) return "#E74C3C";
    return "#FAB300";
  };

  // Quick date options
  const getQuickDateOptions = () => {
    const options = [];
    const todayDate = new Date();
    
    // Tomorrow
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      label: "Tomorrow",
      date: tomorrow.toISOString().split("T")[0],
      day: tomorrow.toLocaleDateString("en-US", { weekday: "short" }),
      icon: Sun,
      color: "#FAB300",
    });
    
    // Later this week (next Wed or Thu)
    const laterThisWeek = new Date(todayDate);
    const daysUntilWed = (3 - todayDate.getDay() + 7) % 7 || 7;
    laterThisWeek.setDate(laterThisWeek.getDate() + Math.min(daysUntilWed, 3));
    if (laterThisWeek > tomorrow) {
      options.push({
        label: "Later this week",
        date: laterThisWeek.toISOString().split("T")[0],
        day: laterThisWeek.toLocaleDateString("en-US", { weekday: "short" }),
        icon: CalendarDays,
        color: "#9B59B6",
      });
    }
    
    // This weekend (Saturday)
    const thisWeekend = new Date(todayDate);
    const daysUntilSat = (6 - todayDate.getDay() + 7) % 7 || 7;
    thisWeekend.setDate(thisWeekend.getDate() + daysUntilSat);
    options.push({
      label: "This weekend",
      date: thisWeekend.toISOString().split("T")[0],
      day: thisWeekend.toLocaleDateString("en-US", { weekday: "short" }),
      icon: Sunrise,
      color: "#3498DB",
    });
    
    // Next week (Monday)
    const nextWeek = new Date(todayDate);
    const daysUntilMon = (1 - todayDate.getDay() + 7) % 7 || 7;
    nextWeek.setDate(nextWeek.getDate() + daysUntilMon);
    options.push({
      label: "Next week",
      date: nextWeek.toISOString().split("T")[0],
      day: `${nextWeek.toLocaleDateString("en-US", { weekday: "short" })} ${nextWeek.getDate()} ${nextWeek.toLocaleDateString("en-US", { month: "short" })}`,
      icon: ArrowRight,
      color: "#9B59B6",
    });
    
    return options;
  };

  // Calendar days
  const getCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    return days;
  };

  const isDateSelected = (day: number) => {
    if (!dueDate || !day) return false;
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === dueDate;
  };

  const isToday = (day: number) => {
    return day === today.getDate() && 
           calendarMonth === today.getMonth() && 
           calendarYear === today.getFullYear();
  };

  const selectCalendarDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDueDate(dateStr);
    setShowDatePicker(false);
  };

  const currentCategory = CATEGORY_OPTIONS.find(c => c.id === category) || CATEGORY_OPTIONS[0];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable 
          style={[styles.container, { backgroundColor: colors.isDark ? "#1C1C1E" : "#FFFFFF" }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Task Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="Task name"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={[styles.descriptionInput, { color: colors.textSecondary }]}
              placeholder="Description"
              placeholderTextColor={colors.isDark ? "#6B6B6B" : "#9B9B9B"}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Quick Actions Row */}
          <View style={styles.actionsRow}>
            {/* Date Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                dueDate && { backgroundColor: `${getDateColor(dueDate)}20` },
              ]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar size={16} color={getDateColor(dueDate)} />
              <Text style={[styles.actionButtonText, { color: getDateColor(dueDate) }]}>
                {getDateLabel(dueDate)}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)} style={styles.removeButton}>
                  <X size={14} color={getDateColor(dueDate)} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Priority Button */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" }]}
              onPress={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <Flag size={18} color={getPriorityColor(priority)} />
            </TouchableOpacity>

            {/* Time Button */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" }]}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Clock size={18} color={dueTime ? "#FAB300" : colors.textSecondary} />
            </TouchableOpacity>

            {/* More Button */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" }]}
            >
              <MoreHorizontal size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <View style={[styles.pickerDropdown, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F5F5F5" }]}>
              {/* Selected Date Display */}
              <View style={[styles.selectedDateDisplay, { borderBottomColor: colors.border }]}>
                <Text style={[styles.selectedDateText, { color: colors.text }]}>
                  {dueDate ? new Date(dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "No date"}
                </Text>
              </View>

              {/* Quick Options */}
              {getQuickDateOptions().map((option) => {
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.quickDateOption}
                    onPress={() => {
                      setDueDate(option.date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Icon size={18} color={option.color} />
                    <Text style={[styles.quickDateLabel, { color: colors.text }]}>{option.label}</Text>
                    <Text style={[styles.quickDateDay, { color: colors.textSecondary }]}>{option.day}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* No Date Option */}
              <TouchableOpacity
                style={styles.quickDateOption}
                onPress={() => {
                  setDueDate(null);
                  setShowDatePicker(false);
                }}
              >
                <Circle size={18} color={colors.textSecondary} />
                <Text style={[styles.quickDateLabel, { color: colors.text }]}>No Date</Text>
              </TouchableOpacity>

              {/* Mini Calendar */}
              <View style={[styles.miniCalendar, { borderTopColor: colors.border }]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: colors.text }]}>
                    {new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </Text>
                  <View style={styles.calendarNav}>
                    <TouchableOpacity onPress={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}>
                      <ChevronLeft size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setCalendarMonth(today.getMonth());
                      setCalendarYear(today.getFullYear());
                    }}>
                      <Circle size={8} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekdaysRow}>
                  {WEEKDAYS.map((day, i) => (
                    <Text key={i} style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
                  ))}
                </View>

                {/* Days grid */}
                <View style={styles.daysGrid}>
                  {getCalendarDays().map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        day && isToday(day) && styles.todayCell,
                        day && isDateSelected(day) && styles.selectedDayCell,
                      ]}
                      onPress={() => day && selectCalendarDay(day)}
                      disabled={!day}
                    >
                      {day && (
                        <Text style={[
                          styles.dayText,
                          { color: colors.text },
                          isToday(day) && styles.todayText,
                          isDateSelected(day) && styles.selectedDayText,
                        ]}>
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time & Repeat buttons */}
              <TouchableOpacity style={[styles.pickerAction, { borderTopColor: colors.border }]}>
                <Clock size={18} color={colors.textSecondary} />
                <Text style={[styles.pickerActionText, { color: colors.text }]}>Time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerAction, { borderTopColor: colors.border }]}>
                <Repeat size={18} color={colors.textSecondary} />
                <Text style={[styles.pickerActionText, { color: colors.text }]}>Repeat</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Priority Picker */}
          {showPriorityPicker && (
            <View style={[styles.miniPicker, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F5F5F5" }]}>
              {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityOption, priority === p && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E0E0E0" }]}
                  onPress={() => {
                    setPriority(p);
                    setShowPriorityPicker(false);
                  }}
                >
                  <Flag size={16} color={getPriorityColor(p)} />
                  <Text style={[styles.priorityText, { color: colors.text }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bottom Row */}
          <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
            {/* Category Selector */}
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <currentCategory.icon size={18} color={colors.textSecondary} />
              <Text style={[styles.categoryText, { color: colors.text }]}>{currentCategory.label}</Text>
              <ChevronRight size={14} color={colors.textSecondary} style={{ transform: [{ rotate: "90deg" }] }} />
            </TouchableOpacity>

            {/* Cancel & Submit */}
            <View style={styles.submitButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: title.trim() ? "#E74C3C" : colors.isDark ? "#3C3C3E" : "#E0E0E0" },
                ]}
                onPress={handleSubmit}
                disabled={!title.trim() || isSubmitting}
              >
                <Send size={18} color={title.trim() ? "#FFFFFF" : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Picker */}
          {showCategoryPicker && (
            <View style={[styles.categoryPicker, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F5F5F5" }]}>
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryOption, category === cat.id && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E0E0E0" }]}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Icon size={18} color={colors.textSecondary} />
                    <Text style={[styles.categoryOptionText, { color: colors.text }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  inputSection: {
    padding: 16,
    paddingBottom: 12,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 8,
  },
  descriptionInput: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerDropdown: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  selectedDateDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  quickDateOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  quickDateLabel: {
    flex: 1,
    fontSize: 15,
  },
  quickDateDay: {
    fontSize: 14,
  },
  miniCalendar: {
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCell: {},
  selectedDayCell: {
    backgroundColor: "#E74C3C",
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
  },
  todayText: {
    color: "#E74C3C",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pickerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  pickerActionText: {
    fontSize: 15,
  },
  miniPicker: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  priorityText: {
    fontSize: 15,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  submitButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPicker: {
    position: "absolute",
    bottom: 60,
    left: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 160,
  },
  categoryOptionText: {
    fontSize: 15,
  },
});
