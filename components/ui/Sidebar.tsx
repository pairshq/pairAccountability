import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Target, Users, Calendar, Clock, Inbox, Sun, Settings, Search, Command, Timer, Globe } from "lucide-react-native";
import { Logo } from "./Logo";
import { SettingsModal } from "./SettingsModal";
import { CommandPalette } from "./CommandPalette";
import { useColors } from "@/lib/useColorScheme";

// Create a simple event emitter for cross-component communication
export const searchEventEmitter = {
  listeners: [] as ((data: { type: string; value: string }) => void)[],
  emit(data: { type: string; value: string }) {
    this.listeners.forEach(listener => listener(data));
  },
  subscribe(listener: (data: { type: string; value: string }) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  href: string;
  section?: string;
}

const sidebarItems: SidebarItem[] = [
  // Workspace section
  { label: "Dashboard", icon: Home, href: "/(tabs)", section: "workspace" },
  { label: "Goals", icon: Target, href: "/(tabs)/goals", section: "workspace" },
  { label: "Upcoming", icon: Clock, href: "/(tabs)/upcoming", section: "workspace" },
  { label: "Today", icon: Sun, href: "/(tabs)/today", section: "workspace" },
  { label: "Calendar", icon: Calendar, href: "/(tabs)/calendar", section: "workspace" },
  { label: "Focus Timer", icon: Timer, href: "/(tabs)/focus", section: "workspace" },
  // Social section
  { label: "Groups", icon: Users, href: "/(tabs)/groups", section: "social" },
  { label: "Communities", icon: Globe, href: "/(tabs)/communities", section: "social" },
  // Inbox section (after Social)
  { label: "Inbox", icon: Inbox, href: "/(tabs)/inbox", section: "inbox" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const isActive = (href: string) => {
    if (href === "/(tabs)" || href === "/(tabs)/") {
      return pathname === "/(tabs)" || pathname === "/(tabs)/" || pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href);
  };

  const handleSearch = (query: string) => {
    searchEventEmitter.emit({ type: "search", value: query });
  };

  const handleSelectLabel = (labelId: string) => {
    searchEventEmitter.emit({ type: "label", value: labelId });
  };

  const handleSelectPriority = (priority: string) => {
    searchEventEmitter.emit({ type: "priority", value: priority });
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background, borderRightColor: colors.border }]}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo size={32} color={colors.text} />
          <Text style={[styles.appName, { color: colors.text }]}>Pair</Text>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5", borderColor: colors.border }]}
          onPress={() => setShowCommandPalette(true)}
        >
          <Search size={16} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search...</Text>
          <View style={[styles.searchShortcut, { backgroundColor: colors.background }]}>
            <Command size={10} color={colors.textSecondary} />
            <Text style={[styles.searchShortcutText, { color: colors.textSecondary }]}>K</Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Items */}
        <ScrollView style={styles.navSection} showsVerticalScrollIndicator={false}>
          <View style={styles.navItems}>
            {/* Workspace Section */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Workspace</Text>
            </View>
            {sidebarItems.filter(i => i.section === "workspace").map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[
                    styles.navItem, 
                    active && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }
                  ]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.navItemContent}>
                    <Icon size={20} color={active ? colors.text : colors.textSecondary} strokeWidth={1.5} />
                    <Text style={[
                      styles.navItemText, 
                      { color: active ? colors.text : colors.textSecondary },
                      active && styles.navItemTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Spacer between Workspace and Social */}
            <View style={{ height: 16 }} />

            {/* Social Section */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Social</Text>
            </View>
            {sidebarItems.filter(i => i.section === "social").map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[
                    styles.navItem, 
                    active && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }
                  ]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.navItemContent}>
                    <Icon size={20} color={active ? colors.text : colors.textSecondary} strokeWidth={1.5} />
                    <Text style={[
                      styles.navItemText, 
                      { color: active ? colors.text : colors.textSecondary },
                      active && styles.navItemTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Inbox Section (after Social) */}
            {sidebarItems.filter(i => i.section === "inbox").map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[
                    styles.navItem, 
                    active && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }
                  ]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.navItemContent}>
                    <Icon size={20} color={active ? colors.text : colors.textSecondary} strokeWidth={1.5} />
                    <Text style={[
                      styles.navItemText, 
                      { color: active ? colors.text : colors.textSecondary },
                      active && styles.navItemTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Settings Button at Bottom */}
        <View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={20} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.settingsText, { color: colors.textSecondary }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <SettingsModal 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Command Palette */}
      <CommandPalette
        visible={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSearch={handleSearch}
        onSelectLabel={handleSelectLabel}
        onSelectPriority={handleSelectPriority}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: "100vh",
    borderRightWidth: 1,
    flexDirection: "column",
  },
  logoSection: {
    padding: 24,
    paddingBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  searchShortcut: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  searchShortcutText: {
    fontSize: 10,
    fontWeight: "600",
  },
  navSection: {
    flex: 1,
    paddingVertical: 16,
  },
  navItems: {
    paddingHorizontal: 12,
    gap: 4,
  },
  navItem: {
    position: "relative",
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  navItemTextActive: {
    fontWeight: "600",
  },
  sectionDivider: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomSection: {
    padding: 12,
    borderTopWidth: 1,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
