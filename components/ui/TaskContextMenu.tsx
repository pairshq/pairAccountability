import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
  Dimensions,
} from "react-native";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Flag,
  Repeat,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Tag,
  Plus,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useTaskStore, TaskWithDetails } from "@/stores/taskStore";
import { useLabelStore, LABEL_COLORS } from "@/stores/labelStore";
import { useAuthStore } from "@/stores/authStore";

interface TaskContextMenuProps {
  task: TaskWithDetails;
  onUpdate?: () => void;
}

type ViewMode = "menu" | "edit";
type ExpandedSection = "date" | "time" | "priority" | "recurrence" | "labels" | null;
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

const getPriorityLabel = (priority: TaskPriority) => {
  switch (priority) {
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
  }
};

const getRecurrenceLabel = (recurrence: TaskRecurrence) => {
  switch (recurrence) {
    case "none": return "No repeat";
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "weekdays": return "Weekdays";
    case "monthly": return "Monthly";
    case "yearly": return "Yearly";
  }
};

// Generate time options
const generateTimeOptions = () => {
  const times: { display: string; value: string }[] = [{ display: "No time", value: "" }];
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

export function TaskContextMenu({ task, onUpdate }: TaskContextMenuProps) {
  const colors = useColors();
  const { updateTask, deleteTask } = useTaskStore();
  const { user } = useAuthStore();
  const { labels, fetchLabels, setLabelsForTask, createLabel } = useLabelStore();
  const buttonRef = useRef<View>(null);
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // All edit states - modified together, saved together
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editDate, setEditDate] = useState(task.due_date || "");
  const [editTime, setEditTime] = useState(task.due_time || "");
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority as TaskPriority);
  const [editRecurrence, setEditRecurrence] = useState<TaskRecurrence>(task.recurrence as TaskRecurrence);
  const [editLabelIds, setEditLabelIds] = useState<string[]>(task.labels?.map(l => l.id) || []);
  
  // Label creation
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  
  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (task.due_date) {
      const d = new Date(task.due_date);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const realTaskId = task.id.includes("_") ? task.id.split("_")[0] : task.id;

  // Fetch labels when opening
  useEffect(() => {
    if (menuVisible && user) {
      fetchLabels(user.id);
    }
  }, [menuVisible, user]);

  const resetEditStates = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDate(task.due_date || "");
    setEditTime(task.due_time || "");
    setEditPriority(task.priority as TaskPriority);
    setEditRecurrence(task.recurrence as TaskRecurrence);
    setEditLabelIds(task.labels?.map(l => l.id) || []);
    setExpandedSection(null);
    setViewMode("menu");
    setShowCreateLabel(false);
    setNewLabelName("");
  };

  const openMenu = () => {
    resetEditStates();
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      const screenHeight = Dimensions.get("window").height;
      
      // Position menu, ensuring it doesn't go off screen
      let top = y + height + 4;
      let right = screenWidth - x - width;
      
      // If menu would go below screen, position above the button
      if (top + 400 > screenHeight) {
        top = Math.max(10, y - 400);
      }
      
      // Ensure right position is valid
      if (right < 10) right = 10;
      if (right + 260 > screenWidth) right = screenWidth - 270;
      
      setMenuPosition({ top, right });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setViewMode("menu");
    setExpandedSection(null);
    setShowDeleteConfirm(false);
  };

  const handleDelete = () => {
    console.log("TaskContextMenu: handleDelete called for task:", realTaskId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    console.log("TaskContextMenu: Confirming delete for task:", realTaskId);
    setIsDeleting(true);
    try {
      const result = await deleteTask(realTaskId);
      console.log("TaskContextMenu: Delete result:", result);
      if (result.error) {
        alert("Failed to delete task: " + result.error);
      }
    } catch (err) {
      console.error("TaskContextMenu: Delete error:", err);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    closeMenu();
    onUpdate?.();
  };

  // Save ALL changes at once
  const handleSaveAll = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Task title cannot be empty");
      return;
    }
    
    setIsSaving(true);
    
    await updateTask(realTaskId, { 
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      due_date: editDate || null,
      due_time: editTime || null,
      priority: editPriority,
      recurrence: editRecurrence,
    });
    
    // Save labels
    await setLabelsForTask(realTaskId, editLabelIds);
    
    setIsSaving(false);
    closeMenu();
    onUpdate?.();
  };
  
  const toggleLabel = (labelId: string) => {
    if (editLabelIds.includes(labelId)) {
      setEditLabelIds(editLabelIds.filter(id => id !== labelId));
    } else {
      setEditLabelIds([...editLabelIds, labelId]);
    }
  };
  
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !user) return;
    
    const { data } = await createLabel({
      user_id: user.id,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    
    if (data) {
      setEditLabelIds([...editLabelIds, data.id]);
    }
    
    setNewLabelName("");
    setShowCreateLabel(false);
  };

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDateForDisplay = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTimeForDisplay = (timeStr: string | null) => {
    if (!timeStr) return "No time";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const renderMainMenu = () => {
    if (showDeleteConfirm) {
      return (
        <View style={styles.menuItems}>
          <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
            {task.recurrence !== "none" 
              ? "Delete all instances of this recurring task?"
              : "Delete this task?"}
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[styles.cancelDeleteBtn, { borderColor: colors.border }]}
              onPress={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelDeleteText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmDeleteBtn, { opacity: isDeleting ? 0.5 : 1 }]}
              onPress={confirmDelete}
              disabled={isDeleting}
            >
              <Text style={styles.confirmDeleteText}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.menuItems}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setViewMode("edit")}
        >
          <Pencil size={14} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>Edit task</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleDelete}
        >
          <Trash2 size={14} color="#E74C3C" />
          <Text style={[styles.menuItemText, { color: "#E74C3C" }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditView = () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { daysInMonth, startingDay } = getDaysInMonth(calendarMonth);
    const calendarDays = [];
    
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = dateStr === editDate;
      const isToday = dateStr === todayStr;
      
      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && { backgroundColor: colors.text },
            isToday && !isSelected && { borderWidth: 1, borderColor: "#FAB300" },
          ]}
          onPress={() => setEditDate(dateStr)}
        >
          <Text
            style={[
              styles.calendarDayText,
              { color: isSelected ? colors.background : colors.text },
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    const priorities: TaskPriority[] = ["high", "medium", "low"];
    const recurrences: { id: TaskRecurrence; label: string }[] = [
      { id: "none", label: "None" },
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
      { id: "weekdays", label: "Weekdays" },
      { id: "monthly", label: "Monthly" },
      { id: "yearly", label: "Yearly" },
    ];

    return (
      <ScrollView style={styles.editView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => setViewMode("menu")} style={styles.backButton}>
            <ChevronLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.editHeaderTitle, { color: colors.text }]}>Edit Task</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Task title"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Description */}
        <TextInput
          style={[styles.descInput, { color: colors.text }]}
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="Add description..."
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        {/* Date Section */}
        <TouchableOpacity 
          style={[styles.fieldRow, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("date")}
        >
          <View style={styles.fieldLeft}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Date</Text>
          </View>
          <View style={styles.fieldRight}>
            <Text style={[styles.fieldValue, { color: editDate ? colors.text : colors.textSecondary }]}>
              {formatDateForDisplay(editDate)}
            </Text>
            <ChevronRight 
              size={16} 
              color={colors.textSecondary} 
              style={{ transform: [{ rotate: expandedSection === "date" ? "90deg" : "0deg" }] }}
            />
          </View>
        </TouchableOpacity>

        {expandedSection === "date" && (
          <View style={[styles.expandedSection, { backgroundColor: colors.card }]}>
            <View style={styles.quickDates}>
              <TouchableOpacity
                style={[styles.quickDateBtn, editDate === todayStr && { backgroundColor: colors.text }]}
                onPress={() => setEditDate(todayStr)}
              >
                <Text style={[styles.quickDateText, { color: editDate === todayStr ? colors.background : colors.text }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDateBtn, editDate === tomorrowStr && { backgroundColor: colors.text }]}
                onPress={() => setEditDate(tomorrowStr)}
              >
                <Text style={[styles.quickDateText, { color: editDate === tomorrowStr ? colors.background : colors.text }]}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDateBtn, !editDate && { backgroundColor: colors.text }]}
                onPress={() => setEditDate("")}
              >
                <Text style={[styles.quickDateText, { color: !editDate ? colors.background : colors.text }]}>None</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.miniCalendar}>
              <View style={styles.calendarNav}>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                  <ChevronLeft size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.calendarMonthText, { color: colors.text }]}>
                  {calendarMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </Text>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                  <ChevronRight size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarWeekdays}>
                {WEEKDAYS.map((day, i) => (
                  <Text key={i} style={[styles.calendarWeekdayText, { color: colors.textSecondary }]}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>{calendarDays}</View>
            </View>
          </View>
        )}

        {/* Time Section */}
        <TouchableOpacity 
          style={[styles.fieldRow, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("time")}
        >
          <View style={styles.fieldLeft}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Time</Text>
          </View>
          <View style={styles.fieldRight}>
            <Text style={[styles.fieldValue, { color: editTime ? colors.text : colors.textSecondary }]}>
              {formatTimeForDisplay(editTime)}
            </Text>
            <ChevronRight 
              size={16} 
              color={colors.textSecondary}
              style={{ transform: [{ rotate: expandedSection === "time" ? "90deg" : "0deg" }] }}
            />
          </View>
        </TouchableOpacity>

        {expandedSection === "time" && (
          <View style={[styles.expandedSection, { backgroundColor: colors.card }]}>
            <ScrollView style={styles.timeList} nestedScrollEnabled>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time.value}
                  style={[
                    styles.timeOption,
                    (time.value === editTime || (!time.value && !editTime)) && { backgroundColor: colors.background },
                  ]}
                  onPress={() => {
                    setEditTime(time.value);
                    setExpandedSection(null);
                  }}
                >
                  <Text style={[styles.timeOptionText, { color: colors.text }]}>{time.display}</Text>
                  {(time.value === editTime || (!time.value && !editTime)) && (
                    <Check size={14} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Priority Section */}
        <TouchableOpacity 
          style={[styles.fieldRow, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("priority")}
        >
          <View style={styles.fieldLeft}>
            <Flag size={16} color={getPriorityColor(editPriority)} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Priority</Text>
          </View>
          <View style={styles.fieldRight}>
            <Text style={[styles.fieldValue, { color: getPriorityColor(editPriority) }]}>
              {getPriorityLabel(editPriority)}
            </Text>
            <ChevronRight 
              size={16} 
              color={colors.textSecondary}
              style={{ transform: [{ rotate: expandedSection === "priority" ? "90deg" : "0deg" }] }}
            />
          </View>
        </TouchableOpacity>

        {expandedSection === "priority" && (
          <View style={[styles.expandedSection, { backgroundColor: colors.card }]}>
            <View style={styles.priorityOptions}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    editPriority === p && { backgroundColor: colors.background },
                  ]}
                  onPress={() => {
                    setEditPriority(p);
                    setExpandedSection(null);
                  }}
                >
                  <Flag size={14} color={getPriorityColor(p)} fill={editPriority === p ? getPriorityColor(p) : "transparent"} />
                  <Text style={[styles.priorityOptionText, { color: colors.text }]}>{getPriorityLabel(p)}</Text>
                  {editPriority === p && <Check size={14} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recurrence Section */}
        <TouchableOpacity 
          style={[styles.fieldRow, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("recurrence")}
        >
          <View style={styles.fieldLeft}>
            <Repeat size={16} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Repeat</Text>
          </View>
          <View style={styles.fieldRight}>
            <Text style={[styles.fieldValue, { color: editRecurrence !== "none" ? colors.text : colors.textSecondary }]}>
              {getRecurrenceLabel(editRecurrence)}
            </Text>
            <ChevronRight 
              size={16} 
              color={colors.textSecondary}
              style={{ transform: [{ rotate: expandedSection === "recurrence" ? "90deg" : "0deg" }] }}
            />
          </View>
        </TouchableOpacity>

        {expandedSection === "recurrence" && (
          <View style={[styles.expandedSection, { backgroundColor: colors.card }]}>
            {recurrences.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.recurrenceOption,
                  editRecurrence === r.id && { backgroundColor: colors.background },
                ]}
                onPress={() => {
                  setEditRecurrence(r.id);
                  setExpandedSection(null);
                }}
              >
                <Text style={[styles.recurrenceOptionText, { color: colors.text }]}>{r.label}</Text>
                {editRecurrence === r.id && <Check size={14} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Labels Section */}
        <TouchableOpacity 
          style={[styles.fieldRow, { borderBottomColor: colors.border }]}
          onPress={() => toggleSection("labels")}
        >
          <View style={styles.fieldLeft}>
            <Tag size={16} color={colors.textSecondary} />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Labels</Text>
          </View>
          <View style={styles.fieldRight}>
            <Text style={[styles.fieldValue, { color: editLabelIds.length > 0 ? colors.text : colors.textSecondary }]}>
              {editLabelIds.length > 0 ? `${editLabelIds.length} selected` : "None"}
            </Text>
            <ChevronRight 
              size={16} 
              color={colors.textSecondary}
              style={{ transform: [{ rotate: expandedSection === "labels" ? "90deg" : "0deg" }] }}
            />
          </View>
        </TouchableOpacity>

        {expandedSection === "labels" && (
          <View style={[styles.expandedSection, { backgroundColor: colors.card }]}>
            {/* Selected labels */}
            {editLabelIds.length > 0 && (
              <View style={styles.selectedLabelsRow}>
                {labels
                  .filter(l => editLabelIds.includes(l.id))
                  .map(label => (
                    <TouchableOpacity
                      key={label.id}
                      style={[styles.labelChip, { backgroundColor: label.color + "20", borderColor: label.color }]}
                      onPress={() => toggleLabel(label.id)}
                    >
                      <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                      <Text style={[styles.labelChipText, { color: label.color }]}>{label.name}</Text>
                      <X size={10} color={label.color} />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
            
            {/* All labels list */}
            <ScrollView style={styles.labelsList} nestedScrollEnabled>
              {labels.map(label => {
                const isSelected = editLabelIds.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      styles.labelOption,
                      isSelected && { backgroundColor: colors.background },
                    ]}
                    onPress={() => toggleLabel(label.id)}
                  >
                    <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                    <Text style={[styles.labelOptionText, { color: colors.text }]}>{label.name}</Text>
                    {isSelected && <Check size={14} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              })}
              
              {labels.length === 0 && !showCreateLabel && (
                <Text style={[styles.emptyLabels, { color: colors.textSecondary }]}>No labels</Text>
              )}
            </ScrollView>
            
            {/* Create new label */}
            {showCreateLabel ? (
              <View style={styles.createLabelForm}>
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
                style={styles.addLabelBtn}
                onPress={() => setShowCreateLabel(true)}
              >
                <Plus size={12} color={colors.textSecondary} />
                <Text style={[styles.addLabelText, { color: colors.textSecondary }]}>New label</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.text }]}
          onPress={handleSaveAll}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.menuTrigger}
          onPress={openMenu}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Pressable 
            style={[
              styles.menuContainer, 
              { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                top: menuPosition.top,
                right: menuPosition.right,
              },
              viewMode === "edit" && styles.menuContainerEdit,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {viewMode === "menu" ? renderMainMenu() : renderEditView()}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuTrigger: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuContainer: {
    position: "absolute",
    width: 160,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuContainerEdit: {
    width: 280,
    maxHeight: 500,
  },
  menuItems: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  editView: {
    flex: 1,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    padding: 2,
  },
  editHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  descInput: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  fieldRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldValue: {
    fontSize: 12,
  },
  expandedSection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  quickDates: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  quickDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(128,128,128,0.15)",
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: "500",
  },
  miniCalendar: {},
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarMonthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarWeekdays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  calendarWeekdayText: {
    fontSize: 9,
    fontWeight: "600",
    width: 28,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  calendarDayText: {
    fontSize: 11,
  },
  timeList: {
    maxHeight: 150,
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  timeOptionText: {
    fontSize: 12,
  },
  priorityOptions: {
    gap: 4,
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityOptionText: {
    fontSize: 12,
    flex: 1,
  },
  recurrenceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  recurrenceOptionText: {
    fontSize: 12,
  },
  // Label styles
  selectedLabelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  labelChipText: {
    fontSize: 10,
    fontWeight: "500",
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelsList: {
    maxHeight: 120,
  },
  labelOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  labelOptionText: {
    fontSize: 12,
    flex: 1,
  },
  emptyLabels: {
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 12,
  },
  addLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  addLabelText: {
    fontSize: 11,
  },
  createLabelForm: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  newLabelInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  colorOption: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    gap: 10,
  },
  createLabelCancel: {
    fontSize: 11,
  },
  createLabelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  createLabelBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  saveButton: {
    marginHorizontal: 12,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteConfirmText: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelDeleteText: {
    fontSize: 13,
    fontWeight: "500",
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#E74C3C",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});

export { TaskContextMenu };
