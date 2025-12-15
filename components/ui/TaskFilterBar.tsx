import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Search, X, Tag, Filter } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useLabelStore } from "@/stores/labelStore";
import { useAuthStore } from "@/stores/authStore";
import { Label } from "@/types/database";

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLabelIds: string[];
  onLabelFilterChange: (labelIds: string[]) => void;
  showLabels?: boolean;
}

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  selectedLabelIds,
  onLabelFilterChange,
  showLabels = true,
}: TaskFilterBarProps) {
  const colors = useColors();
  const { user } = useAuthStore();
  const { labels, fetchLabels } = useLabelStore();
  const [showLabelFilter, setShowLabelFilter] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLabels(user.id);
    }
  }, [user]);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelFilterChange(selectedLabelIds.filter(id => id !== labelId));
    } else {
      onLabelFilterChange([...selectedLabelIds, labelId]);
    }
  };

  const clearFilters = () => {
    onSearchChange("");
    onLabelFilterChange([]);
  };

  const hasActiveFilters = searchQuery || selectedLabelIds.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Actions Row */}
      {showLabels && (
        <View style={styles.filterRow}>
          {/* Label Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedLabelIds.length > 0 && { borderColor: "#3498DB", backgroundColor: "rgba(52, 152, 219, 0.1)" },
            ]}
            onPress={() => setShowLabelFilter(!showLabelFilter)}
          >
            <Tag size={14} color={selectedLabelIds.length > 0 ? "#3498DB" : colors.textSecondary} />
            <Text style={[styles.filterButtonText, { color: selectedLabelIds.length > 0 ? "#3498DB" : colors.text }]}>
              {selectedLabelIds.length > 0 ? `${selectedLabelIds.length} Labels` : "Labels"}
            </Text>
          </TouchableOpacity>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <X size={14} color={colors.textSecondary} />
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Label Filter Dropdown */}
      {showLabelFilter && labels.length > 0 && (
        <View style={[styles.labelDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labelList}>
            {labels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <TouchableOpacity
                  key={label.id}
                  style={[
                    styles.labelChip,
                    { borderColor: label.color },
                    isSelected && { backgroundColor: label.color + "20" },
                  ]}
                  onPress={() => toggleLabel(label.id)}
                >
                  <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                  <Text style={[styles.labelChipText, { color: isSelected ? label.color : colors.text }]}>
                    {label.name}
                  </Text>
                  {isSelected && <X size={12} color={label.color} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Active Label Filters Display */}
      {selectedLabelIds.length > 0 && !showLabelFilter && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.activeFilters}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {labels
            .filter(l => selectedLabelIds.includes(l.id))
            .map(label => (
              <TouchableOpacity
                key={label.id}
                style={[styles.activeLabel, { backgroundColor: label.color + "20", borderColor: label.color }]}
                onPress={() => toggleLabel(label.id)}
              >
                <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                <Text style={[styles.activeLabelText, { color: label.color }]}>{label.name}</Text>
                <X size={12} color={label.color} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 13,
  },
  labelDropdown: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  labelList: {
    gap: 8,
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  activeFilters: {
    marginTop: 4,
  },
  activeFiltersContent: {
    gap: 8,
  },
  activeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export { TaskFilterBar };

