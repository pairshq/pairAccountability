import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, Redirect } from "expo-router";
import { Flame, User, Users, Trash2, ChevronLeft, Calendar, Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react-native";
import { CheckInGroup, Avatar, PairLoader } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { useResponsive } from "@/hooks/useResponsive";
import { Categories } from "@/lib/constants";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { goals, todayGoals, checkIn, deleteGoal } = useGoalStore();
  const { isDesktop } = useResponsive();

  // Auth protection
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <PairLoader size={64} color={colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the goal from either goals or todayGoals
  const goal = [...goals, ...todayGoals].find((g) => g.id === id);

  useEffect(() => {
    if (goal?.today_check_in?.reflection) {
      setReflection(goal.today_check_in.reflection);
    }
  }, [goal?.today_check_in?.reflection]);

  if (!goal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Goal</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Goal not found
          </Text>
        </View>
      </View>
    );
  }

  const category = Categories.find((c) => c.id === goal.category);
  const checkInStatus = goal.today_check_in?.status || null;

  const handleCheckIn = async (status: "completed" | "missed") => {
    if (!user) return;
    
    setIsSubmitting(true);
    const { error } = await checkIn(goal.id, user.id, status, reflection || undefined);
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteGoal(goal.id);
            if (error) {
              Alert.alert("Error", error);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Goal Details</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Goal Info Card */}
          <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {category?.label || goal.category}
              </Text>
            </View>
            <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
            {goal.description && (
              <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
                {goal.description}
              </Text>
            )}
            
            <View style={styles.goalMeta}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Target size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Started {new Date(goal.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
                <Flame size={20} color="#FAB300" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{goal.current_streak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                <TrendingUp size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{goal.longest_streak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
                <CheckCircle2 size={20} color="#2ECC71" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{goal.total_completions || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completions</Text>
            </View>
          </View>

          {/* Accountability Partner/Group */}
          {(goal.partner || goal.group) && (
            <View style={[styles.accountabilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Accountability</Text>
              <View style={styles.accountabilityRow}>
                {goal.partner ? (
                  <>
                    <View style={[styles.partnerAvatar, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                      <User size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.accountabilityInfo}>
                      <Text style={[styles.accountabilityName, { color: colors.text }]}>
                        {goal.partner.username}
                      </Text>
                      <Text style={[styles.accountabilityType, { color: colors.textSecondary }]}>
                        Accountability Partner
                      </Text>
                    </View>
                  </>
                ) : goal.group ? (
                  <>
                    <View style={[styles.partnerAvatar, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                      <Users size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.accountabilityInfo}>
                      <Text style={[styles.accountabilityName, { color: colors.text }]}>
                        {goal.group.name}
                      </Text>
                      <Text style={[styles.accountabilityType, { color: colors.textSecondary }]}>
                        Group Challenge
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          )}

          {/* Check-In Section */}
          <View style={[styles.checkInCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Check-in</Text>
            
            {checkInStatus ? (
              <View style={styles.checkInStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: checkInStatus === "completed" ? "#E8F5E9" : "#FFEBEE" }
                ]}>
                  {checkInStatus === "completed" ? (
                    <CheckCircle2 size={20} color="#2ECC71" />
                  ) : (
                    <XCircle size={20} color="#E74C3C" />
                  )}
                  <Text style={[
                    styles.statusText,
                    { color: checkInStatus === "completed" ? "#2ECC71" : "#E74C3C" }
                  ]}>
                    {checkInStatus === "completed" ? "Completed" : "Missed"}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.checkInButtons}>
                <TouchableOpacity
                  style={[styles.checkInButton, styles.completedButton]}
                  onPress={() => handleCheckIn("completed")}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 size={24} color="#FFFFFF" />
                  <Text style={styles.checkInButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkInButton, styles.missedButton]}
                  onPress={() => handleCheckIn("missed")}
                  disabled={isSubmitting}
                >
                  <XCircle size={24} color="#FFFFFF" />
                  <Text style={styles.checkInButtonText}>Missed</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reflection */}
            <View style={styles.reflectionContainer}>
              <Text style={[styles.reflectionLabel, { color: colors.textSecondary }]}>
                {checkInStatus === "completed"
                  ? "What helped today?"
                  : checkInStatus === "missed"
                  ? "What got in the way?"
                  : "Add a reflection (optional)"}
              </Text>
              <TextInput
                style={[
                  styles.reflectionInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                  },
                ]}
                placeholder="Write your thoughts..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={reflection}
                onChangeText={setReflection}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 44,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    maxWidth: 800,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
  },
  goalCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  goalMeta: {
    flexDirection: "row",
    gap: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
  accountabilityCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  accountabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  accountabilityInfo: {
    flex: 1,
  },
  accountabilityName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  accountabilityType: {
    fontSize: 14,
  },
  checkInCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  checkInStatus: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkInButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  checkInButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completedButton: {
    backgroundColor: "#2ECC71",
  },
  missedButton: {
    backgroundColor: "#E74C3C",
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  reflectionContainer: {
    marginTop: 8,
  },
  reflectionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  reflectionInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
});
