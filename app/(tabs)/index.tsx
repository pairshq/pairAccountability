import { useEffect } from "react";
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
} from "lucide-react-native";
import { GoalItem } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { todayGoals, isLoading, fetchTodayGoals } = useGoalStore();

  useEffect(() => {
    if (user) {
      fetchTodayGoals(user.id);
    }
  }, [user]);

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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = profile?.full_name || profile?.username || "User";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>Pair Accountability</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <View style={styles.avatar}>
              <User size={18} color="#000000" />
            </View>
            <Text style={styles.profileName}>{displayName.split(" ")[0]}</Text>
            <ChevronRight size={16} color="#6B6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#6B6B6B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search information"
          placeholderTextColor="#6B6B6B"
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FAB300"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
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
          <TouchableOpacity style={styles.closeBanner}>
            <Text style={styles.closeBannerText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Title */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.printButton}>
            <Text style={styles.printText}>Print</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
              <CheckCircle2 size={24} color="#2ECC71" />
            </View>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
              <Clock size={24} color="#FAB300" />
            </View>
            <Text style={styles.statValue}>{totalCount - completedCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
              <TrendingUp size={24} color="#4285F4" />
            </View>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* User Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Profile</Text>
          <View style={styles.profileCardContent}>
            <View style={styles.profileAvatar}>
              <User size={32} color="#6B6B6B" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileInfoText}>
                <Text style={styles.profileInfoLabel}>Name: </Text>
                {displayName}
              </Text>
              <Text style={styles.profileInfoText}>
                <Text style={styles.profileInfoLabel}>Date of Joining: </Text>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </Text>
              <Text style={styles.profileInfoText}>
                <Text style={styles.profileInfoLabel}>Username: </Text>
                {profile?.username || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Goals</Text>
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
                    <View style={styles.goalDivider} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyGoals}>
              <View style={styles.emptyIcon}>
                <Target size={32} color="#6B6B6B" />
              </View>
              <Text style={styles.emptyTitle}>No goals for today</Text>
              <Text style={styles.emptyText}>
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Check-ins</Text>
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
                    <Text style={styles.activityTitle}>{goal.title}</Text>
                    <Text style={styles.activityTime}>
                      {goal.today_check_in?.status === "completed"
                        ? "Completed"
                        : "Missed"}{" "}
                      • {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            {todayGoals.filter((g) => g.today_check_in).length === 0 && (
              <Text style={styles.noActivityText}>No recent check-ins</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "Inter",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontFamily: "Inter",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    fontFamily: "Inter",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    fontFamily: "Inter",
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#A0A0A0",
    marginBottom: 16,
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  closeBanner: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBannerText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  printButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  printText: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    fontFamily: "Inter",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    fontFamily: "Inter",
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
    fontFamily: "Inter",
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
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 20,
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FAB300",
    fontWeight: "500",
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  activityTime: {
    fontSize: 12,
    color: "#6B6B6B",
    fontFamily: "Inter",
  },
  noActivityText: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    paddingVertical: 20,
    fontFamily: "Inter",
  },
});
