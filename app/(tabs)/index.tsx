import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Bell,
  User,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  X,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoalItem } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { useResponsive } from "@/hooks/useResponsive";
import { useColors } from "@/lib/useColorScheme";

const WELCOME_BANNER_KEY = "@pair_welcome_banner_dismissed";

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, profile } = useAuthStore();
  const { todayGoals, isLoading, fetchTodayGoals } = useGoalStore();
  const { isDesktop } = useResponsive();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodayGoals(user.id);
    }
    // Check if welcome banner was dismissed
    checkWelcomeBanner();
  }, [user]);

  const checkWelcomeBanner = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(WELCOME_BANNER_KEY);
      if (dismissed !== "true") {
        setShowWelcomeBanner(true);
      }
    } catch (error) {
      console.error("Error checking welcome banner:", error);
    }
  };

  const dismissWelcomeBanner = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_BANNER_KEY, "true");
      setShowWelcomeBanner(false);
    } catch (error) {
      console.error("Error dismissing welcome banner:", error);
    }
  };

  const handleRefresh = () => {
    if (user) {
      fetchTodayGoals(user.id);
    }
  };

  const completedCount = todayGoals.filter(
    (g) => g.today_check_in?.status === "completed"
  ).length;
  const totalCount = todayGoals.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const displayName = profile?.full_name || profile?.username || "User";
  const firstName = displayName.split(" ")[0];
  const greeting = getGreeting();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header - Desktop Only */}
      {isDesktop && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.searchContainer, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search information"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Bell size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <View style={[styles.avatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                <User size={18} color={colors.text} />
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName.split(" ")[0]}</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FAB300"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingText, { color: colors.text }]}>
            {greeting}, {firstName}! 👋
          </Text>
          <Text style={[styles.greetingSubtext, { color: colors.textSecondary }]}>
            Here's what's on your plate today
          </Text>
        </View>

        {/* Welcome Banner - Only for new users */}
        {showWelcomeBanner && (
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome to Pair Accountability</Text>
              <Text style={styles.welcomeSubtitle}>
                The best place for accountability partners
              </Text>
              <TouchableOpacity style={styles.learnMoreButton}>
                <Text style={styles.learnMoreText}>Learn More</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBanner} onPress={dismissWelcomeBanner}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Title - Mobile Only */}
        {!isDesktop && (
          <View style={styles.dashboardHeader}>
            <Text style={[styles.dashboardTitle, { color: colors.text }]}>Dashboard</Text>
            <TouchableOpacity style={styles.printButton}>
              <Text style={[styles.printText, { color: colors.textSecondary }]}>Print</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Multi-Column Grid for Desktop */}
        {isDesktop ? (
          <View style={styles.gridContainer}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
              {/* Statistics Cards */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#1B3D1B" : "#E8F5E9" }]}>
                    <CheckCircle2 size={24} color="#2ECC71" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#3D3520" : "#FFF3E0" }]}>
                    <Clock size={24} color="#FAB300" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{totalCount - completedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#1B2D3D" : "#E3F2FD" }]}>
                    <TrendingUp size={24} color="#4285F4" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{completionRate}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
                </View>
              </View>

              {/* User Profile Card */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>User Profile</Text>
                <View style={styles.profileCardContent}>
                  <View style={[styles.profileAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                    <User size={32} color={colors.textSecondary} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileInfoText, { color: colors.text }]}>
                      <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Name: </Text>
                      {displayName}
                    </Text>
                    <Text style={[styles.profileInfoText, { color: colors.text }]}>
                      <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Date of Joining: </Text>
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </Text>
                    <Text style={[styles.profileInfoText, { color: colors.text }]}>
                      <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Username: </Text>
                      {profile?.username || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn}>
              {/* Today's Goals Card */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Goals</Text>
                  <TouchableOpacity
                    onPress={() => router.push("/create-goal")}
                    style={styles.addGoalButton}
                  >
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.addGoalText}>Add Goal</Text>
                  </TouchableOpacity>
                </View>

                {todayGoals.length > 0 ? (
                  <View style={styles.goalsList}>
                    {todayGoals.map((goal, index) => (
                      <View key={goal.id}>
                        <GoalItem
                          goal={goal}
                          onPress={() => router.push(`/goal/${goal.id}`)}
                        />
                        {index < todayGoals.length - 1 && (
                          <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyGoals}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                      <Target size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No goals for today</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Create your first goal to get started
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/create-goal")}
                      style={styles.emptyButton}
                    >
                      <Text style={styles.emptyButtonText}>Create Goal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Recent Activity Card */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Check-ins</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.activityList}>
                  {todayGoals
                    .filter((g) => g.today_check_in)
                    .slice(0, 3)
                    .map((goal) => (
                      <View key={goal.id} style={styles.activityItem}>
                        <View style={styles.activityIcon}>
                          <CheckCircle2
                            size={16}
                            color={
                              goal.today_check_in?.status === "completed"
                                ? "#2ECC71"
                                : "#E74C3C"
                            }
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={[styles.activityTitle, { color: colors.text }]}>{goal.title}</Text>
                          <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                            {goal.today_check_in?.status === "completed"
                              ? "Completed"
                              : "Missed"}{" "}
                            • {new Date().toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  {todayGoals.filter((g) => g.today_check_in).length === 0 && (
                    <Text style={[styles.noActivityText, { color: colors.textSecondary }]}>No recent check-ins</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* Single Column for Mobile */
          <>
            {/* Statistics Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#1B3D1B" : "#E8F5E9" }]}>
                  <CheckCircle2 size={24} color="#2ECC71" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#3D3520" : "#FFF3E0" }]}>
                  <Clock size={24} color="#FAB300" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalCount - completedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#1B2D3D" : "#E3F2FD" }]}>
                  <TrendingUp size={24} color="#4285F4" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{completionRate}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
              </View>
            </View>

            {/* User Profile Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>User Profile</Text>
              <View style={styles.profileCardContent}>
                <View style={[styles.profileAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                  <User size={32} color={colors.textSecondary} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileInfoText, { color: colors.text }]}>
                    <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Name: </Text>
                    {displayName}
                  </Text>
                  <Text style={[styles.profileInfoText, { color: colors.text }]}>
                    <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Date of Joining: </Text>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Text>
                  <Text style={[styles.profileInfoText, { color: colors.text }]}>
                    <Text style={[styles.profileInfoLabel, { color: colors.textSecondary }]}>Username: </Text>
                    {profile?.username || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Today's Goals Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Goals</Text>
                <TouchableOpacity
                  onPress={() => router.push("/create-goal")}
                  style={styles.addGoalButton}
                >
                  <Plus size={18} color="#FFFFFF" />
                  <Text style={styles.addGoalText}>Add Goal</Text>
                </TouchableOpacity>
              </View>

              {todayGoals.length > 0 ? (
                <View style={styles.goalsList}>
                  {todayGoals.map((goal, index) => (
                    <View key={goal.id}>
                      <GoalItem
                        goal={goal}
                        onPress={() => router.push(`/goal/${goal.id}`)}
                      />
                      {index < todayGoals.length - 1 && (
                        <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyGoals}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                    <Target size={32} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No goals for today</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Create your first goal to get started
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/create-goal")}
                    style={styles.emptyButton}
                  >
                    <Text style={styles.emptyButtonText}>Create Goal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Recent Activity Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Check-ins</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityList}>
                {todayGoals
                  .filter((g) => g.today_check_in)
                  .slice(0, 3)
                  .map((goal) => (
                    <View key={goal.id} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <CheckCircle2
                          size={16}
                          color={
                            goal.today_check_in?.status === "completed"
                              ? "#2ECC71"
                              : "#E74C3C"
                          }
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>{goal.title}</Text>
                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                          {goal.today_check_in?.status === "completed"
                            ? "Completed"
                            : "Missed"}{" "}
                          • {new Date().toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                {todayGoals.filter((g) => g.today_check_in).length === 0 && (
                  <Text style={[styles.noActivityText, { color: colors.textSecondary }]}>No recent check-ins</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    minWidth: 300,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 15,
  },
  welcomeBanner: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  welcomeContent: {
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#A0A0A0",
    marginBottom: 16,
  },
  learnMoreButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  closeBanner: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBannerText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  printButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  printText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  // Desktop Grid Layout
  gridContainer: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  leftColumn: {
    flex: 1,
    gap: 24,
  },
  rightColumn: {
    flex: 1,
    gap: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  profileCardContent: {
    flexDirection: "row",
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  profileInfoText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  profileInfoLabel: {
    fontWeight: "600",
    color: "#6B6B6B",
  },
  addGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FAB300",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addGoalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  goalsList: {
    gap: 0,
  },
  goalDivider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 12,
    marginLeft: 0,
  },
  emptyGoals: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#FAB300",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FAB300",
    fontWeight: "500",
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  noActivityText: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    paddingVertical: 20,
  },
});
