import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Globe,
} from "lucide-react-native";
import { Avatar, Card } from "@/components/ui";
import { useColors, useColorScheme } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

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

  const SettingRow = ({
    icon: Icon,
    label,
    value,
    onPress,
    showChevron = true,
    toggle,
    onToggle,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    toggle?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !onToggle}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Icon size={20} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
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
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        )}
        {showChevron && onPress && (
          <ChevronRight size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.full_name || profile?.username || "User"}
            size={80}
          />
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.full_name || profile?.username || "User"}
          </Text>
          <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
            @{profile?.username}
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>
          <Card noBorder style={[styles.settingsCard, { borderColor: colors.border }]}>
            <SettingRow
              icon={User}
              label="Edit profile"
              onPress={() => {}}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow
              icon={Globe}
              label="Timezone"
              value={profile?.timezone?.split("/").pop()?.replace("_", " ")}
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Preferences
          </Text>
          <Card noBorder style={[styles.settingsCard, { borderColor: colors.border }]}>
            <SettingRow
              icon={Bell}
              label="Notifications"
              onPress={() => {}}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow
              icon={Moon}
              label="Dark mode"
              value={colorScheme === "dark" ? "On" : "Off"}
              showChevron={false}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Card noBorder style={[styles.settingsCard, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.signOutRow}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <LogOut size={20} color={colors.missed} strokeWidth={1.5} />
              <Text style={[styles.signOutText, { color: colors.missed }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          PairAccountability v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "600",
    fontFamily: "Inter",
    marginTop: 16,
  },
  profileUsername: {
    fontSize: 15,
    fontFamily: "Inter",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 0,
    borderWidth: 1,
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
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  settingValue: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  version: {
    fontSize: 13,
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 16,
  },
});

