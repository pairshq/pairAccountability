import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import {
  X,
  User,
  Settings,
  Bell,
  Moon,
  Sun,
  Globe,
  Palette,
  Shield,
  Link,
  Download,
  LogOut,
  ChevronRight,
  Check,
  Smartphone,
  Clock,
  Calendar,
  Wifi,
  HelpCircle,
  Info,
} from "lucide-react-native";
import { Avatar } from "./Avatar";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useRouter } from "expo-router";

type SettingsSection = 
  | "account"
  | "preferences"
  | "notifications"
  | "connections"
  | "offline"
  | "general"
  | "theme"
  | "language"
  | "about";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  section: "account" | "preferences" | "workspace" | "support";
}

const settingsNavItems: SettingsNavItem[] = [
  // Account Section
  { id: "account", label: "Account", icon: User, section: "account" },
  
  // Preferences Section
  { id: "preferences", label: "Preferences", icon: Settings, section: "preferences" },
  { id: "notifications", label: "Notifications", icon: Bell, section: "preferences" },
  { id: "theme", label: "Theme", icon: Palette, section: "preferences" },
  { id: "language", label: "Language & Time", icon: Globe, section: "preferences" },
  
  // Workspace Section
  { id: "connections", label: "Connections", icon: Link, section: "workspace" },
  { id: "offline", label: "Offline", icon: Wifi, section: "workspace" },
  
  // Support Section
  { id: "about", label: "About", icon: Info, section: "support" },
];

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const colors = useColors();
  const router = useRouter();
  const { profile, signOut, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [weekStartsMonday, setWeekStartsMonday] = useState(false);
  const [autoTimezone, setAutoTimezone] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            onClose();
            await signOut();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const userEmail = user?.email || "No email";

  const renderNavItem = (item: SettingsNavItem) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.navItem,
          isActive && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" },
        ]}
        onPress={() => setActiveSection(item.id)}
      >
        <Icon size={18} color={isActive ? colors.text : colors.textSecondary} strokeWidth={1.5} />
        <Text style={[
          styles.navItemText,
          { color: isActive ? colors.text : colors.textSecondary },
          isActive && { fontWeight: "600" },
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const SettingRow = ({
    label,
    description,
    value,
    onPress,
    toggle,
    onToggle,
    showChevron,
  }: {
    label: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    toggle?: boolean;
    onToggle?: (value: boolean) => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !onToggle}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
        {toggle !== undefined && onToggle && (
          <Switch
            value={toggle}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: "#FAB300" }}
            thumbColor="#FFFFFF"
          />
        )}
        {showChevron && (
          <ChevronRight size={18} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Account</Text>
            
            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Avatar
                uri={profile?.avatar_url}
                name={displayName}
                size={64}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
              </View>
              <TouchableOpacity style={[styles.editButton, { borderColor: colors.border }]}>
                <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Profile</Text>
              <SettingRow
                label="Full name"
                value={profile?.full_name || "Not set"}
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Username"
                value={`@${profile?.username || "username"}`}
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Email"
                value={userEmail}
                onPress={() => {}}
                showChevron
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Account</Text>
              <SettingRow
                label="Change password"
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Two-factor authentication"
                description="Add an extra layer of security"
                onPress={() => {}}
                showChevron
              />
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <LogOut size={18} color="#E74C3C" strokeWidth={1.5} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        );

      case "preferences":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Preferences</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Customize how Pair looks on your device.
            </Text>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Appearance</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { borderColor: theme === "light" ? "#FAB300" : colors.border },
                    theme === "light" && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme("light")}
                >
                  <Sun size={24} color={theme === "light" ? "#FAB300" : colors.textSecondary} />
                  <Text style={[styles.themeOptionText, { color: colors.text }]}>Light</Text>
                  {theme === "light" && (
                    <View style={styles.themeCheck}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { borderColor: theme === "dark" ? "#FAB300" : colors.border },
                    theme === "dark" && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme("dark")}
                >
                  <Moon size={24} color={theme === "dark" ? "#FAB300" : colors.textSecondary} />
                  <Text style={[styles.themeOptionText, { color: colors.text }]}>Dark</Text>
                  {theme === "dark" && (
                    <View style={styles.themeCheck}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Display</Text>
              <SettingRow
                label="Compact mode"
                description="Show more content on screen"
                toggle={false}
                onToggle={() => {}}
              />
              <SettingRow
                label="Show completed tasks"
                toggle={true}
                onToggle={() => {}}
              />
            </View>
          </View>
        );

      case "notifications":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Manage how you receive notifications.
            </Text>

            <View style={styles.settingsGroup}>
              <SettingRow
                label="Enable notifications"
                description="Receive notifications from Pair"
                toggle={notificationsEnabled}
                onToggle={setNotificationsEnabled}
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Channels</Text>
              <SettingRow
                label="Push notifications"
                description="Get notified on your device"
                toggle={pushNotifications}
                onToggle={setPushNotifications}
              />
              <SettingRow
                label="Email notifications"
                description="Receive updates via email"
                toggle={emailNotifications}
                onToggle={setEmailNotifications}
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Types</Text>
              <SettingRow
                label="Goal reminders"
                description="Get reminded about upcoming check-ins"
                toggle={reminderNotifications}
                onToggle={setReminderNotifications}
              />
              <SettingRow
                label="Partner activity"
                description="When your accountability partner checks in"
                toggle={true}
                onToggle={() => {}}
              />
              <SettingRow
                label="Group messages"
                description="New messages in your groups"
                toggle={true}
                onToggle={() => {}}
              />
              <SettingRow
                label="Achievements"
                description="Streak milestones and badges"
                toggle={true}
                onToggle={() => {}}
              />
            </View>
          </View>
        );

      case "theme":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Choose your preferred color scheme.
            </Text>

            <View style={styles.themeGrid}>
              <TouchableOpacity
                style={[
                  styles.themeCard,
                  { backgroundColor: "#FFFFFF", borderColor: theme === "light" ? "#FAB300" : "#E0E0E0" },
                ]}
                onPress={() => setTheme("light")}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.previewSidebar, { backgroundColor: "#F5F5F5" }]} />
                  <View style={styles.previewContent}>
                    <View style={[styles.previewHeader, { backgroundColor: "#F5F5F5" }]} />
                    <View style={[styles.previewCard, { backgroundColor: "#F5F5F5" }]} />
                  </View>
                </View>
                <Text style={[styles.themeCardLabel, { color: "#000000" }]}>Light</Text>
                {theme === "light" && (
                  <View style={styles.themeCardCheck}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeCard,
                  { backgroundColor: "#0E0E0E", borderColor: theme === "dark" ? "#FAB300" : "#2A2A2A" },
                ]}
                onPress={() => setTheme("dark")}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.previewSidebar, { backgroundColor: "#1A1A1A" }]} />
                  <View style={styles.previewContent}>
                    <View style={[styles.previewHeader, { backgroundColor: "#1A1A1A" }]} />
                    <View style={[styles.previewCard, { backgroundColor: "#1A1A1A" }]} />
                  </View>
                </View>
                <Text style={[styles.themeCardLabel, { color: "#FFFFFF" }]}>Dark</Text>
                {theme === "dark" && (
                  <View style={styles.themeCardCheck}>
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case "language":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Language & Time</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Change the language and time settings.
            </Text>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Language</Text>
              <SettingRow
                label="Language"
                description="Change the language used in the interface"
                value="English (US)"
                onPress={() => {}}
                showChevron
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Time</Text>
              <SettingRow
                label="Start week on Monday"
                description="This will change how calendars look"
                toggle={weekStartsMonday}
                onToggle={setWeekStartsMonday}
              />
              <SettingRow
                label="Set timezone automatically"
                description="Based on your location"
                toggle={autoTimezone}
                onToggle={setAutoTimezone}
              />
              <SettingRow
                label="Timezone"
                value={profile?.timezone?.split("/").pop()?.replace("_", " ") || "Auto"}
                onPress={() => {}}
                showChevron
              />
            </View>
          </View>
        );

      case "connections":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Connections</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Connect external services and calendars.
            </Text>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Calendars</Text>
              <SettingRow
                label="Google Calendar"
                description="Sync your goals with Google Calendar"
                value="Not connected"
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Apple Calendar"
                description="Sync your goals with Apple Calendar"
                value="Not connected"
                onPress={() => {}}
                showChevron
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Integrations</Text>
              <SettingRow
                label="Slack"
                description="Get notifications in Slack"
                value="Not connected"
                onPress={() => {}}
                showChevron
              />
            </View>
          </View>
        );

      case "offline":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>Offline</Text>
            <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>
              Access your goals even without internet.
            </Text>

            <View style={styles.settingsGroup}>
              <SettingRow
                label="Enable offline mode"
                description="Save data for offline access"
                toggle={true}
                onToggle={() => {}}
              />
              <SettingRow
                label="Sync on Wi-Fi only"
                description="Save mobile data"
                toggle={false}
                onToggle={() => {}}
              />
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Storage</Text>
              <SettingRow
                label="Clear offline data"
                description="Free up space on your device"
                onPress={() => {}}
                showChevron
              />
            </View>
          </View>
        );

      case "about":
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>About</Text>
            
            <View style={styles.aboutHeader}>
              <View style={[styles.appIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                <Text style={styles.appIconText}>P</Text>
              </View>
              <Text style={[styles.appName, { color: colors.text }]}>Pair Accountability</Text>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            </View>

            <View style={styles.settingsGroup}>
              <SettingRow
                label="What's new"
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Help & Support"
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Privacy Policy"
                onPress={() => {}}
                showChevron
              />
              <SettingRow
                label="Terms of Service"
                onPress={() => {}}
                showChevron
              />
            </View>

            <Text style={[styles.copyright, { color: colors.textSecondary }]}>
              © 2024 Pair Accountability. All rights reserved.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.modal, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Sidebar Navigation */}
          <View style={[styles.sidebar, { borderRightColor: colors.border }]}>
            {/* Account Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: colors.textSecondary }]}>
                Account
              </Text>
              <TouchableOpacity
                style={[styles.accountItem, activeSection === "account" && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
                onPress={() => setActiveSection("account")}
              >
                <Avatar
                  uri={profile?.avatar_url}
                  name={displayName}
                  size={28}
                />
                <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
              </TouchableOpacity>
              {renderNavItem(settingsNavItems.find(i => i.id === "preferences")!)}
              {renderNavItem(settingsNavItems.find(i => i.id === "notifications")!)}
              {renderNavItem(settingsNavItems.find(i => i.id === "connections")!)}
              {renderNavItem(settingsNavItems.find(i => i.id === "offline")!)}
            </View>

            {/* Workspace Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: colors.textSecondary }]}>
                App Settings
              </Text>
              {renderNavItem(settingsNavItems.find(i => i.id === "theme")!)}
              {renderNavItem(settingsNavItems.find(i => i.id === "language")!)}
              {renderNavItem(settingsNavItems.find(i => i.id === "about")!)}
            </View>
          </View>

          {/* Content Area */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxWidth: 800,
    height: "85%",
    maxHeight: 600,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    paddingTop: 16,
  },
  sidebarSection: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 32,
    paddingRight: 48,
  },
  contentSection: {},
  contentTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    color: "#E74C3C",
  },
  themeOptions: {
    flexDirection: "row",
    gap: 16,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    position: "relative",
  },
  themeOptionActive: {
    backgroundColor: "rgba(250, 179, 0, 0.1)",
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FAB300",
    alignItems: "center",
    justifyContent: "center",
  },
  themeGrid: {
    flexDirection: "row",
    gap: 16,
  },
  themeCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    position: "relative",
  },
  themePreview: {
    flexDirection: "row",
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  previewSidebar: {
    width: 30,
  },
  previewContent: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  previewHeader: {
    height: 12,
    borderRadius: 4,
  },
  previewCard: {
    flex: 1,
    borderRadius: 4,
  },
  themeCardLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  themeCardCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FAB300",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appIconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FAB300",
  },
  appName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  copyright: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});



