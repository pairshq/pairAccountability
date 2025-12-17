import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import {
  Search,
  Home,
  Inbox,
  Calendar,
  CalendarDays,
  Tag,
  Command,
  ArrowRight,
  Flag,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useRouter, usePathname } from "expo-router";
import { useLabelStore } from "@/stores/labelStore";
import { useAuthStore } from "@/stores/authStore";

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onSelectLabel?: (labelId: string) => void;
  onSelectPriority?: (priority: string) => void;
}

interface RecentItem {
  type: "page" | "label" | "task";
  name: string;
  icon: "inbox" | "upcoming" | "today" | "calendar" | "label";
  path?: string;
  labelId?: string;
}

const NAVIGATION_ITEMS = [
  { name: "Go to home", icon: Home, path: "/(tabs)", shortcut: ["G", "H"] },
  { name: "Go to Inbox", icon: Inbox, path: "/(tabs)/inbox", shortcut: ["G", "I"] },
  { name: "Go to Today", icon: Calendar, path: "/(tabs)/today", shortcut: ["G", "T"] },
  { name: "Go to Upcoming", icon: CalendarDays, path: "/(tabs)/upcoming", shortcut: ["G", "U"] },
  { name: "Go to Filters & Labels", icon: Tag, path: null, shortcut: ["G", "V"], action: "showLabels" },
  { name: "Filter by Priority", icon: Flag, path: null, shortcut: ["G", "P"], action: "showPriorities" },
];

const PRIORITY_OPTIONS = [
  { id: "high", name: "High Priority", color: "#E74C3C" },
  { id: "medium", name: "Medium Priority", color: "#FAB300" },
  { id: "low", name: "Low Priority", color: "#6B7280" },
];

export function CommandPalette({ visible, onClose, onSearch, onSelectLabel, onSelectPriority }: CommandPaletteProps) {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const { labels, fetchLabels } = useLabelStore();
  const { user } = useAuthStore();
  const inputRef = useRef<TextInput>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [showLabels, setShowLabels] = useState(false);
  const [showPriorities, setShowPriorities] = useState(false);

  useEffect(() => {
    if (visible) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Fetch labels
      if (user) {
        fetchLabels(user.id);
      }
      
      // Build recent items based on current location
      const recent: RecentItem[] = [];
      if (pathname.includes("inbox")) {
        recent.push({ type: "page", name: "Inbox", icon: "inbox", path: "/(tabs)/inbox" });
      }
      if (pathname.includes("upcoming")) {
        recent.push({ type: "page", name: "Upcoming", icon: "upcoming", path: "/(tabs)/upcoming" });
      }
      if (pathname.includes("today")) {
        recent.push({ type: "page", name: "Today", icon: "today", path: "/(tabs)/today" });
      }
      setRecentItems(recent);
    } else {
      setSearchQuery("");
      setShowLabels(false);
      setShowPriorities(false);
    }
  }, [visible, pathname, user]);

  const handleNavigate = (path: string) => {
    router.push(path as any);
    onClose();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      onClose();
    }
  };

  const handleSelectLabel = (labelId: string) => {
    onSelectLabel?.(labelId);
    onClose();
  };

  const handleSelectPriority = (priority: string) => {
    onSelectPriority?.(priority);
    onClose();
  };

  const handleNavItemPress = (item: typeof NAVIGATION_ITEMS[0]) => {
    if (item.action === "showLabels") {
      setShowLabels(true);
    } else if (item.action === "showPriorities") {
      setShowPriorities(true);
    } else if (item.path) {
      handleNavigate(item.path);
    }
  };

  const getIconForRecent = (icon: RecentItem["icon"]) => {
    switch (icon) {
      case "inbox": return Inbox;
      case "upcoming": return CalendarDays;
      case "today": return Calendar;
      case "calendar": return CalendarDays;
      case "label": return Tag;
      default: return Inbox;
    }
  };

  // Filter navigation items based on search
  const filteredNavItems = searchQuery
    ? NAVIGATION_ITEMS.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NAVIGATION_ITEMS;

  // Filter labels based on search
  const filteredLabels = searchQuery
    ? labels.filter(label => 
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : labels;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search or type a command..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <View style={[styles.shortcutBadge, { backgroundColor: colors.background }]}>
              <Command size={10} color={colors.textSecondary} />
              <Text style={[styles.shortcutText, { color: colors.textSecondary }]}>K</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Priorities View */}
            {showPriorities ? (
              <>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowPriorities(false)}
                >
                  <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
                </TouchableOpacity>
                
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Filter by Priority</Text>
                {PRIORITY_OPTIONS.map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    style={styles.item}
                    onPress={() => handleSelectPriority(priority.id)}
                  >
                    <Flag size={16} color={priority.color} />
                    <Text style={[styles.itemText, { color: colors.text }]}>{priority.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : showLabels ? (
              <>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowLabels(false)}
                >
                  <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
                </TouchableOpacity>
                
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Labels</Text>
                {filteredLabels.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No labels found
                  </Text>
                ) : (
                  filteredLabels.map((label) => (
                    <TouchableOpacity
                      key={label.id}
                      style={styles.item}
                      onPress={() => handleSelectLabel(label.id)}
                    >
                      <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                      <Text style={[styles.itemText, { color: colors.text }]}>{label.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                {/* Recently Viewed */}
                {recentItems.length > 0 && !searchQuery && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Recently viewed
                    </Text>
                    {recentItems.map((item, index) => {
                      const Icon = getIconForRecent(item.icon);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.item}
                          onPress={() => item.path && handleNavigate(item.path)}
                        >
                          <Icon size={16} color={colors.textSecondary} />
                          <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Show recent labels */}
                    {labels.slice(0, 3).map((label) => (
                      <TouchableOpacity
                        key={label.id}
                        style={styles.item}
                        onPress={() => handleSelectLabel(label.id)}
                      >
                        <Tag size={16} color={label.color} />
                        <Text style={[styles.itemText, { color: colors.text }]}>{label.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Navigation */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Navigation
                </Text>
                {filteredNavItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.item}
                      onPress={() => handleNavItemPress(item)}
                    >
                      <Icon size={16} color={colors.textSecondary} />
                      <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
                      <View style={styles.shortcutContainer}>
                        {item.shortcut.map((key, i) => (
                          <React.Fragment key={i}>
                            <View style={[styles.keyBadge, { backgroundColor: colors.background }]}>
                              <Text style={[styles.keyText, { color: colors.textSecondary }]}>{key}</Text>
                            </View>
                            {i < item.shortcut.length - 1 && (
                              <Text style={[styles.thenText, { color: colors.textSecondary }]}>then</Text>
                            )}
                          </React.Fragment>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Search Results - Labels */}
                {searchQuery && filteredLabels.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Labels
                    </Text>
                    {filteredLabels.slice(0, 5).map((label) => (
                      <TouchableOpacity
                        key={label.id}
                        style={styles.item}
                        onPress={() => handleSelectLabel(label.id)}
                      >
                        <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                        <Text style={[styles.itemText, { color: colors.text }]}>{label.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100,
  },
  container: {
    width: "90%",
    maxWidth: 540,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  shortcutBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 12,
  },
  itemText: {
    fontSize: 14,
    flex: 1,
  },
  shortcutContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  keyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  thenText: {
    fontSize: 10,
  },
  labelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default CommandPalette;

