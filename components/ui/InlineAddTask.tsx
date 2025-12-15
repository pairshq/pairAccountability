import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import {
  X,
  Calendar,
  Flag,
  Clock,
  MoreHorizontal,
  Send,
  Sun,
  Sunrise,
  CalendarDays,
  ArrowRight,
  Circle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Check,
  Tag,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useLabelStore, LABEL_COLORS } from "@/stores/labelStore";
import { Label } from "@/types/database";

interface InlineAddTaskProps {
  initialDate?: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

type TaskPriority = "low" | "medium" | "high";
type TaskRecurrence = "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "high": return "#E74C3C";
    case "medium": return "#FAB300";
    case "low": return "#6B7280";
  }
};

// Get dynamic recurrence descriptions based on selected date
const getRecurrenceOptions = (selectedDate: string | null): { id: TaskRecurrence; label: string; description?: string }[] => {
  const date = selectedDate ? new Date(selectedDate) : new Date();
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dayOfMonth = date.getDate();
  const ordinal = dayOfMonth === 1 ? "1st" : dayOfMonth === 2 ? "2nd" : dayOfMonth === 3 ? "3rd" : `${dayOfMonth}th`;
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  
  return [
    { id: "none", label: "No repeat" },
    { id: "daily", label: "Every day" },
    { id: "weekly", label: "Every week", description: `on ${dayName}` },
    { id: "weekdays", label: "Every weekday", description: "Mon - Fri" },
    { id: "monthly", label: "Every month", description: `on the ${ordinal}` },
    { id: "yearly", label: "Every year", description: `on ${monthDay}` },
  ];
};

// Generate time options in 15-minute increments
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const m = minute.toString().padStart(2, "0");
      const display = `${h}:${m} ${ampm}`;
      const value = `${hour.toString().padStart(2, "0")}:${m}:00`;
      times.push({ display, value });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export function InlineAddTask({ initialDate, onClose, autoFocus = true }: InlineAddTaskProps) {
  const colors = useColors();
  const { user } = useAuthStore();
  const { createTask, fetchTasks } = useTaskStore();
  const { labels, fetchLabels, setLabelsForTask, createLabel } = useLabelStore();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(initialDate || todayStr);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  
  // New label creation
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  // Fetch labels when component mounts
  useEffect(() => {
    if (user) {
      fetchLabels(user.id);
    }
  }, [user]);

  const closeAllPickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowPriorityPicker(false);
    setShowRecurrencePicker(false);
    setShowLabelPicker(false);
    setShowCreateLabel(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(initialDate || todayStr);
    setDueTime(null);
    setPriority("medium");
    setRecurrence("none");
    setSelectedLabelIds([]);
    closeAllPickers();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task name");
      return;
    }
    
    if (!user) {
      Alert.alert("Error", "You must be logged in to create tasks");
      return;
    }

    setIsSubmitting(true);
    
    const taskData = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      due_time: dueTime,
      priority,
      status: "pending" as const,
      recurrence: recurrence as "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly",
      category: null,
      project_id: null,
    };
    
    const { error, taskId } = await createTask(taskData);

    if (error) {
      setIsSubmitting(false);
      Alert.alert("Error Creating Task", error);
      return;
    }

    // Add labels to the task if any selected
    if (taskId && selectedLabelIds.length > 0) {
      await setLabelsForTask(taskId, selectedLabelIds);
    }

    await fetchTasks(user.id);
    setIsSubmitting(false);
    resetForm();
  };
  
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !user) {
      Alert.alert("Error", "Please enter a label name");
      return;
    }
    
    console.log("Creating label:", newLabelName, newLabelColor);
    
    const { data, error } = await createLabel({
      user_id: user.id,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    
    if (error) {
      console.error("Label creation error:", error);
      Alert.alert("Error Creating Label", error);
      return;
    }
    
    if (data) {
      console.log("Label created successfully:", data);
      setSelectedLabelIds([...selectedLabelIds, data.id]);
    }
    
    setNewLabelName("");
    setShowCreateLabel(false);
  };
  
  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId));
    } else {
      setSelectedLabelIds([...selectedLabelIds, labelId]);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Date helpers
  const getDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "No Date";
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === todayDate.getTime()) return "Today";
    if (targetDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" });
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

  const getTimeLabel = (timeStr: string | null) => {
    if (!timeStr) return null;
    const option = TIME_OPTIONS.find(t => t.value === timeStr);
    return option?.display || timeStr;
  };

  const getRecurrenceLabel = (rec: TaskRecurrence) => {
    const options = getRecurrenceOptions(dueDate);
    const option = options.find(r => r.id === rec);
    return option?.label || "No repeat";
  };

  // Quick date options
  const getQuickDateOptions = () => {
    const options = [];
    const todayDate = new Date();
    
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      label: "Tomorrow",
      date: tomorrow.toISOString().split("T")[0],
      day: tomorrow.toLocaleDateString("en-US", { weekday: "short" }),
      icon: Sun,
      color: "#FAB300",
    });
    
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

  const isTodayDate = (day: number) => {
    return day === today.getDate() && 
           calendarMonth === today.getMonth() && 
           calendarYear === today.getFullYear();
  };

  const selectCalendarDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDueDate(dateStr);
    setShowDatePicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Task Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={[styles.titleInput, { color: colors.text, backgroundColor: "transparent" }]}
          placeholder="Task name"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus={autoFocus}
          selectionColor={colors.accent}
        />
        <TextInput
          style={[styles.descriptionInput, { color: colors.textSecondary, backgroundColor: "transparent" }]}
          placeholder="Description"
          placeholderTextColor={colors.isDark ? "#555" : "#AAA"}
          value={description}
          onChangeText={setDescription}
          multiline
          selectionColor={colors.accent}
        />
      </View>

      {/* Quick Actions Row */}
      <View style={styles.actionsRow}>
        {/* Date Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: dueDate ? `${getDateColor(dueDate)}15` : colors.isDark ? "#2C2C2E" : "#F0F0F0" },
          ]}
          onPress={() => {
            closeAllPickers();
            setShowDatePicker(!showDatePicker);
          }}
        >
          <Calendar size={14} color={getDateColor(dueDate)} />
          <Text style={[styles.actionButtonText, { color: getDateColor(dueDate) }]}>
            {getDateLabel(dueDate)}
          </Text>
          {dueDate && (
            <TouchableOpacity 
              onPress={() => setDueDate(null)} 
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color={getDateColor(dueDate)} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Time Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: dueTime ? "rgba(250, 179, 0, 0.15)" : colors.isDark ? "#2C2C2E" : "#F0F0F0" },
          ]}
          onPress={() => {
            closeAllPickers();
            setShowTimePicker(!showTimePicker);
          }}
        >
          <Clock size={14} color={dueTime ? "#FAB300" : colors.textSecondary} />
          {dueTime && (
            <>
              <Text style={[styles.actionButtonText, { color: "#FAB300" }]}>
                {getTimeLabel(dueTime)}
              </Text>
              <TouchableOpacity 
                onPress={() => setDueTime(null)} 
                style={styles.removeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={12} color="#FAB300" />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        {/* Priority Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" }]}
          onPress={() => {
            closeAllPickers();
            setShowPriorityPicker(!showPriorityPicker);
          }}
        >
          <Flag size={16} color={getPriorityColor(priority)} />
        </TouchableOpacity>

        {/* Recurrence Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            recurrence !== "none" && { backgroundColor: "rgba(155, 89, 182, 0.15)" },
            recurrence === "none" && { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" },
          ]}
          onPress={() => {
            closeAllPickers();
            setShowRecurrencePicker(!showRecurrencePicker);
          }}
        >
          <Repeat size={14} color={recurrence !== "none" ? "#9B59B6" : colors.textSecondary} />
          {recurrence !== "none" && (
            <Text style={[styles.actionButtonText, { color: "#9B59B6" }]}>
              {getRecurrenceLabel(recurrence)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Labels Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedLabelIds.length > 0 && { backgroundColor: "rgba(52, 152, 219, 0.15)" },
            selectedLabelIds.length === 0 && { backgroundColor: colors.isDark ? "#2C2C2E" : "#F0F0F0" },
          ]}
          onPress={() => {
            closeAllPickers();
            setShowLabelPicker(!showLabelPicker);
          }}
        >
          <Tag size={14} color={selectedLabelIds.length > 0 ? "#3498DB" : colors.textSecondary} />
          {selectedLabelIds.length > 0 && (
            <Text style={[styles.actionButtonText, { color: "#3498DB" }]}>
              {selectedLabelIds.length}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F8F8F8", borderColor: colors.border }]}>
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
                <Icon size={16} color={option.color} />
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
            <Circle size={16} color={colors.textSecondary} />
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
                  <ChevronLeft size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setCalendarMonth(today.getMonth());
                  setCalendarYear(today.getFullYear());
                }}>
                  <Circle size={6} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}>
                  <ChevronRight size={18} color={colors.textSecondary} />
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
                    day && isDateSelected(day) && styles.selectedDayCell,
                  ]}
                  onPress={() => day && selectCalendarDay(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text style={[
                      styles.dayText,
                      { color: colors.text },
                      isTodayDate(day) && styles.todayText,
                      isDateSelected(day) && styles.selectedDayText,
                    ]}>
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Time Picker Dropdown */}
      {showTimePicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F8F8F8", borderColor: colors.border, maxHeight: 300 }]}>
          <View style={[styles.selectedDateDisplay, { borderBottomColor: colors.border }]}>
            <Text style={[styles.selectedDateText, { color: colors.text }]}>
              {dueTime ? getTimeLabel(dueTime) : "Select time"}
            </Text>
            {dueTime && (
              <TouchableOpacity onPress={() => { setDueTime(null); setShowTimePicker(false); }}>
                <Text style={{ color: "#E74C3C", fontSize: 14 }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time.value}
                style={[
                  styles.timeOption,
                  dueTime === time.value && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E8E8E8" },
                ]}
                onPress={() => {
                  setDueTime(time.value);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[styles.timeOptionText, { color: colors.text }]}>{time.display}</Text>
                {dueTime === time.value && <Check size={16} color="#FAB300" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Priority Picker */}
      {showPriorityPicker && (
        <View style={[styles.miniPicker, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F8F8F8", borderColor: colors.border }]}>
          {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityOption, priority === p && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E8E8E8" }]}
              onPress={() => {
                setPriority(p);
                setShowPriorityPicker(false);
              }}
            >
              <Flag size={14} color={getPriorityColor(p)} />
              <Text style={[styles.priorityText, { color: colors.text }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
              {priority === p && <Check size={16} color={colors.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recurrence Picker */}
      {showRecurrencePicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F8F8F8", borderColor: colors.border }]}>
          <View style={[styles.selectedDateDisplay, { borderBottomColor: colors.border }]}>
            <Text style={[styles.selectedDateText, { color: colors.text }]}>Repeat</Text>
          </View>
          {getRecurrenceOptions(dueDate).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.recurrenceOption,
                recurrence === option.id && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E8E8E8" },
              ]}
              onPress={() => {
                setRecurrence(option.id);
                setShowRecurrencePicker(false);
              }}
            >
              <View style={styles.recurrenceOptionContent}>
                <Text style={[styles.recurrenceLabel, { color: colors.text }]}>{option.label}</Text>
                {option.description && (
                  <Text style={[styles.recurrenceDesc, { color: colors.textSecondary }]}>{option.description}</Text>
                )}
              </View>
              {recurrence === option.id && <Check size={16} color="#9B59B6" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Label Picker */}
      {showLabelPicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.isDark ? "#2C2C2E" : "#F8F8F8", borderColor: colors.border }]}>
          <View style={[styles.selectedDateDisplay, { borderBottomColor: colors.border }]}>
            <Text style={[styles.selectedDateText, { color: colors.text }]}>Labels</Text>
          </View>
          
          {/* Selected Labels */}
          {selectedLabelIds.length > 0 && (
            <View style={styles.selectedLabels}>
              {labels
                .filter(l => selectedLabelIds.includes(l.id))
                .map(label => (
                  <TouchableOpacity
                    key={label.id}
                    style={[styles.selectedLabelChip, { backgroundColor: label.color + "20", borderColor: label.color }]}
                    onPress={() => toggleLabel(label.id)}
                  >
                    <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                    <Text style={[styles.selectedLabelText, { color: label.color }]}>{label.name}</Text>
                    <X size={10} color={label.color} />
                  </TouchableOpacity>
                ))}
            </View>
          )}
          
          {/* All Labels */}
          <ScrollView style={styles.labelsList} nestedScrollEnabled>
            {labels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <TouchableOpacity
                  key={label.id}
                  style={[
                    styles.labelOption,
                    isSelected && { backgroundColor: colors.isDark ? "#3C3C3E" : "#E8E8E8" },
                  ]}
                  onPress={() => toggleLabel(label.id)}
                >
                  <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                  <Text style={[styles.labelOptionText, { color: colors.text }]}>{label.name}</Text>
                  {isSelected && <Check size={14} color="#3498DB" />}
                </TouchableOpacity>
              );
            })}
            
            {labels.length === 0 && !showCreateLabel && (
              <Text style={[styles.emptyLabelsText, { color: colors.textSecondary }]}>No labels yet</Text>
            )}
          </ScrollView>
          
          {/* Create New Label */}
          {showCreateLabel ? (
            <View style={[styles.createLabelForm, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.newLabelInput, { color: colors.text, borderColor: colors.border }]}
                value={newLabelName}
                onChangeText={setNewLabelName}
                placeholder="Label name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <View style={styles.colorPicker}>
                {LABEL_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newLabelColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewLabelColor(color)}
                  />
                ))}
              </View>
              <View style={styles.createLabelActions}>
                <TouchableOpacity onPress={() => { setShowCreateLabel(false); setNewLabelName(""); }}>
                  <Text style={[styles.createLabelCancel, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createLabelBtn, { backgroundColor: colors.text }]}
                  onPress={handleCreateLabel}
                >
                  <Text style={[styles.createLabelBtnText, { color: colors.background }]}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addLabelBtn, { borderTopColor: colors.border }]}
              onPress={() => setShowCreateLabel(true)}
            >
              <Plus size={14} color={colors.textSecondary} />
              <Text style={[styles.addLabelText, { color: colors.textSecondary }]}>Create new label</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bottom Row - Cancel on left, Submit on right */}
      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: title.trim() ? "#000000" : colors.isDark ? "#3C3C3E" : "#E0E0E0" },
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || isSubmitting}
        >
          <Text style={[styles.submitText, { color: title.trim() ? "#FFFFFF" : colors.textSecondary }]}>
            {isSubmitting ? "Adding..." : "Add task"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Simple button to trigger showing the inline add task
export function AddTaskButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  
  return (
    <TouchableOpacity style={styles.addTaskButton} onPress={onPress}>
      <Plus size={16} color={colors.text} />
      <Text style={[styles.addTaskButtonText, { color: colors.text }]}>Add task</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "visible",
  },
  inputSection: {
    padding: 16,
    paddingBottom: 12,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "none",
  } as any,
  descriptionInput: {
    fontSize: 15,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "none",
    minHeight: 24,
  } as any,
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: "wrap",
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
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  selectedDateDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  selectedDayCell: {
    backgroundColor: "#000000",
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
  },
  todayText: {
    color: "#FAB300",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeOptionText: {
    fontSize: 15,
  },
  miniPicker: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
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
    flex: 1,
    fontSize: 15,
  },
  recurrenceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recurrenceOptionContent: {
    flex: 1,
  },
  recurrenceLabel: {
    fontSize: 15,
  },
  recurrenceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  // Label styles
  selectedLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 12,
    paddingTop: 8,
  },
  selectedLabelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedLabelText: {
    fontSize: 11,
    fontWeight: "500",
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelsList: {
    maxHeight: 150,
  },
  labelOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  labelOptionText: {
    fontSize: 14,
    flex: 1,
  },
  emptyLabelsText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  addLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  addLabelText: {
    fontSize: 13,
  },
  createLabelForm: {
    padding: 12,
    borderTopWidth: 1,
  },
  newLabelInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  createLabelActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  createLabelCancel: {
    fontSize: 13,
  },
  createLabelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createLabelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "600",
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
});
