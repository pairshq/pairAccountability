import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Target, Flame } from "lucide-react-native";
import { Card } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { Categories } from "@/lib/constants";

export default function GoalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { goals, isLoading, fetchGoals } = useGoalStore();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
        <TouchableOpacity
          onPress={() => router.push("/create-goal")}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
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
          <View style={styles.goalGrid}>
            {goals.map((goal) => (
              <Card
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                style={styles.goalCard}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.categoryLabel, { color: colors.textSecondary }]}
                  >
                    {getCategoryLabel(goal.category)}
                  </Text>
                  {goal.current_streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Flame size={14} color={colors.accent} />
                      <Text style={[styles.streakText, { color: colors.accent }]}>
                        {goal.current_streak}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text
                  style={[styles.goalTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {goal.title}
                </Text>
                
                <View style={styles.cardFooter}>
                  <Text style={[styles.frequency, { color: colors.textSecondary }]}>
                    {goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1)}
                  </Text>
                  {goal.partner && (
                    <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                      with {goal.partner.username}
                    </Text>
                  )}
                  {goal.group && (
                    <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                      {goal.group.name}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" },
              ]}
            >
              <Target size={32} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No goals yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create your first goal to start building consistency.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-goal")}
              style={styles.emptyButton}
            >
              <Text style={[styles.emptyButtonText, { color: colors.accent }]}>
                Create goal
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  goalGrid: {
    gap: 12,
  },
  goalCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: "Inter",
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
    fontFamily: "Inter",
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 8,
  },
  frequency: {
    fontSize: 13,
    fontFamily: "Inter",
  },
  partnerText: {
    fontSize: 13,
    fontFamily: "Inter",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    padding: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter",
  },
});

