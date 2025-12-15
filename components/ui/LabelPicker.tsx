import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Plus, X, Check, Tag } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useLabelStore, LABEL_COLORS } from "@/stores/labelStore";
import { Label } from "@/types/database";

interface LabelPickerProps {
  userId: string;
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  compact?: boolean;
}

export function LabelPicker({ 
  userId, 
  selectedLabelIds, 
  onSelectionChange,
  compact = false,
}: LabelPickerProps) {
  const colors = useColors();
  const { labels, fetchLabels, createLabel } = useLabelStore();
  
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchLabels(userId);
  }, [userId]);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onSelectionChange(selectedLabelIds.filter(id => id !== labelId));
    } else {
      onSelectionChange([...selectedLabelIds, labelId]);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      Alert.alert("Error", "Label name is required");
      return;
    }

    setIsCreating(true);
    const { data, error } = await createLabel({
      user_id: userId,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    setIsCreating(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    if (data) {
      // Auto-select the new label
      onSelectionChange([...selectedLabelIds, data.id]);
    }

    setNewLabelName("");
    setShowCreateNew(false);
  };

  if (compact) {
    // Compact inline display for task items
    return (
      <View style={styles.compactContainer}>
        {labels
          .filter(l => selectedLabelIds.includes(l.id))
          .map(label => (
            <View
              key={label.id}
              style={[styles.compactLabel, { backgroundColor: label.color + "20" }]}
            >
              <View style={[styles.compactDot, { backgroundColor: label.color }]} />
              <Text style={[styles.compactLabelText, { color: label.color }]}>
                {label.name}
              </Text>
            </View>
          ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected Labels */}
      {selectedLabelIds.length > 0 && (
        <View style={styles.selectedLabels}>
          {labels
            .filter(l => selectedLabelIds.includes(l.id))
            .map(label => (
              <TouchableOpacity
                key={label.id}
                style={[styles.selectedLabel, { backgroundColor: label.color + "20", borderColor: label.color }]}
                onPress={() => toggleLabel(label.id)}
              >
                <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                <Text style={[styles.selectedLabelText, { color: label.color }]}>
                  {label.name}
                </Text>
                <X size={12} color={label.color} />
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* All Labels List */}
      <ScrollView style={styles.labelsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {labels.map(label => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <TouchableOpacity
              key={label.id}
              style={[
                styles.labelOption,
                isSelected && { backgroundColor: colors.card },
              ]}
              onPress={() => toggleLabel(label.id)}
            >
              <View style={[styles.labelDot, { backgroundColor: label.color }]} />
              <Text style={[styles.labelOptionText, { color: colors.text }]}>
                {label.name}
              </Text>
              {isSelected && <Check size={14} color="#3B82F6" />}
            </TouchableOpacity>
          );
        })}

        {labels.length === 0 && !showCreateNew && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No labels yet
          </Text>
        )}
      </ScrollView>

      {/* Create New Label */}
      {showCreateNew ? (
        <View style={[styles.createNew, { borderTopColor: colors.border }]}>
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
          <View style={styles.createActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowCreateNew(false);
                setNewLabelName("");
              }}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.text }]}
              onPress={handleCreateLabel}
              disabled={isCreating}
            >
              <Text style={[styles.createBtnText, { color: colors.background }]}>
                {isCreating ? "..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addLabelBtn, { borderTopColor: colors.border }]}
          onPress={() => setShowCreateNew(true)}
        >
          <Plus size={14} color={colors.textSecondary} />
          <Text style={[styles.addLabelText, { color: colors.textSecondary }]}>
            Create new label
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Simple label display for task items
interface LabelDisplayProps {
  labels: Label[];
}

export function LabelDisplay({ labels }: LabelDisplayProps) {
  if (!labels || labels.length === 0) return null;

  return (
    <View style={styles.displayContainer}>
      {labels.map(label => (
        <View
          key={label.id}
          style={[styles.displayLabel, { backgroundColor: label.color + "25" }]}
        >
          <View style={[styles.displayDot, { backgroundColor: label.color }]} />
          <Text style={[styles.displayLabelText, { color: label.color }]}>
            {label.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  selectedLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  selectedLabel: {
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
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  labelOptionText: {
    fontSize: 13,
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
  addLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  addLabelText: {
    fontSize: 12,
  },
  createNew: {
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  newLabelInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
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
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 12,
  },
  createBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  compactLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactLabelText: {
    fontSize: 10,
    fontWeight: "500",
  },
  // Display styles for task items
  displayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  displayLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  displayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  displayLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

