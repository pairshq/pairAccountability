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
import { useRouter } from "expo-router";
import { Plus, Target, Flame, Search, Filter, ChevronRight } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { useResponsive } from "@/hooks/useResponsive";
import { Categories } from "@/lib/constants";

export default function GoalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { goals, isLoading, fetchGoals } = useGoalStore();
  const { isDesktop } = useResponsive();

  useEffect(() => {
    if (user) {
      fetchGoals(user.id);
    }
  }, [user]);

  const handleRefresh = () => {
    if (user) {
      fetchGoals(user.id);
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    return Categories.find((c) => c.id === categoryId)?.label || categoryId;
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Goals</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isDesktop && (
            <View style={[styles.searchContainer, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search goals"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push("/create-goal")}
            style={styles.addButton}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New Goal</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {goals.length > 0 ? (
          <>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Goals</Text>
                <View style={[styles.goalsGrid, isDesktop && styles.goalsGridDesktop]}>
                  {activeGoals.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      onPress={() => router.push(`/goal/${goal.id}`)}
                      style={[
                        styles.goalCard,
                        { 
                          backgroundColor: colors.card, 
                          borderColor: colors.border,
                        },
                        isDesktop && styles.goalCardDesktop,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardTop}>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                            {getCategoryLabel(goal.category)}
                          </Text>
                        </View>
                        {goal.current_streak > 0 && (
                          <View style={styles.streakBadge}>
                            <Flame size={14} color="#FAB300" />
                            <Text style={styles.streakText}>{goal.current_streak}</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={2}>
                        {goal.title}
                      </Text>
                      
                      <View style={styles.cardBottom}>
                        <Text style={[styles.frequencyText, { color: colors.textSecondary }]}>
                          {goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1)}
                        </Text>
                        {goal.partner && (
                          <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                            • with {goal.partner.username}
                          </Text>
                        )}
                      </View>

                      <View style={styles.cardAction}>
                        <Text style={[styles.viewDetailsText, { color: colors.accent }]}>View details</Text>
                        <ChevronRight size={16} color={colors.accent} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed</Text>
                <View style={[styles.goalsGrid, isDesktop && styles.goalsGridDesktop]}>
                  {completedGoals.map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      onPress={() => router.push(`/goal/${goal.id}`)}
                      style={[
                        styles.goalCard,
                        styles.goalCardCompleted,
                        { 
                          backgroundColor: colors.isDark ? "#0D1F0D" : "#F0FFF0", 
                          borderColor: colors.isDark ? "#1B3D1B" : "#D0F0D0",
                        },
                        isDesktop && styles.goalCardDesktop,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={2}>
                        {goal.title}
                      </Text>
                      <Text style={[styles.frequencyText, { color: colors.textSecondary }]}>
                        Completed • {goal.best_streak} day streak
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Target size={40} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No goals yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create your first goal to start building consistency and tracking your progress.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-goal")}
              style={styles.emptyButton}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    minWidth: 240,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  goalsGrid: {
    gap: 12,
  },
  goalsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  goalCardDesktop: {
    width: "calc(33.333% - 8px)",
    minWidth: 280,
    maxWidth: 400,
  },
  goalCardCompleted: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FAB300",
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 24,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  frequencyText: {
    fontSize: 13,
  },
  partnerText: {
    fontSize: 13,
    marginLeft: 4,
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 320,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
