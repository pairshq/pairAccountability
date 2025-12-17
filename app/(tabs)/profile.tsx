import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Globe,
  Shield,
  HelpCircle,
  Mail,
  Edit3,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useResponsive } from "@/hooks/useResponsive";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { isDesktop } = useResponsive();

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
            await signOut();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email || ""}
            </Text>
            {profile?.username && (
              <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                @{profile.username}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
            onPress={() => {}}
          >
            <Edit3 size={18} color={colors.text} />
            <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.created_at
                ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Days Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goals Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsContainer}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <User size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Profile</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Globe size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Timezone</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                    {profile?.timezone?.split("/").pop()?.replace("_", " ") || "Not set"}
                  </Text>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Bell size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    {theme === "dark" ? (
                      <Moon size={18} color={colors.textSecondary} />
                    ) : (
                      <Sun size={18} color={colors.textSecondary} />
                    )}
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {theme === "dark" ? "Dark Mode" : "Light Mode"}
                  </Text>
                </View>
                <Switch
                  value={theme === "dark"}
                  onValueChange={(value) => setTheme(value ? "dark" : "light")}
                  trackColor={{ false: colors.border, true: "#FAB300" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <HelpCircle size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Help Center</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Mail size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Us</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Shield size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutButton, { borderColor: "#E74C3C" }]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#E74C3C" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Pair v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    maxWidth: 800,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 16,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  settingsContainer: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E74C3C",
  },
  version: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
});
