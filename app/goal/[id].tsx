import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Flame, User, Users, Trash2 } from "lucide-react-native";
import { CheckInGroup, Card, Avatar, Button } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { Categories } from "@/lib/constants";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { goals, todayGoals, checkIn, deleteGoal, fetchTodayGoals } = useGoalStore();

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
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Goal not found
        </Text>
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
      <Stack.Screen
        options={{
          headerTitle: "",
          headerRight: () => (
            <Trash2
              size={20}
              color={colors.missed}
              onPress={handleDelete}
              style={{ padding: 8 }}
            />
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {category?.label || goal.category}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{goal.title}</Text>
          {goal.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {goal.description}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Flame size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {goal.current_streak}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Current streak
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Flame size={20} color={colors.textSecondary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {goal.longest_streak}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Longest streak
            </Text>
          </Card>
        </View>

        {/* Accountability Info */}
        {(goal.partner || goal.group) && (
          <Card style={styles.accountabilityCard}>
            <View style={styles.accountabilityRow}>
              {goal.partner ? (
                <>
                  <Avatar
                    uri={goal.partner.avatar_url}
                    name={goal.partner.username}
                    size={40}
                  />
                  <View>
                    <Text style={[styles.accountabilityLabel, { color: colors.textSecondary }]}>
                      Paired with
                    </Text>
                    <Text style={[styles.accountabilityName, { color: colors.text }]}>
                      {goal.partner.username}
                    </Text>
                  </View>
                </>
              ) : goal.group ? (
                <>
                  <View
                    style={[
                      styles.groupIcon,
                      { backgroundColor: colors.isDark ? "#2A2A2A" : "#F0F0F0" },
                    ]}
                  >
                    <Users size={20} color={colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.accountabilityLabel, { color: colors.textSecondary }]}>
                      Shared with
                    </Text>
                    <Text style={[styles.accountabilityName, { color: colors.text }]}>
                      {goal.group.name}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>
        )}

        {/* Check-In Section */}
        <View style={styles.checkInSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's check-in
          </Text>
          
          <CheckInGroup
            status={checkInStatus}
            onCheckIn={handleCheckIn}
            disabled={isSubmitting}
          />

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
                  borderColor: colors.border,
                  backgroundColor: colors.isDark ? colors.card : "#FAFAFA",
                },
              ]}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={reflection}
              onChangeText={setReflection}
            />
          </View>
        </View>

        {/* Meta Info */}
        <View style={styles.metaSection}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1)} goal
            {" · "}
            Started {new Date(goal.start_date).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    marginBottom: 24,
  },
  category: {
    fontSize: 13,
    fontFamily: "Inter",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter",
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Inter",
  },
  accountabilityCard: {
    marginBottom: 24,
  },
  accountabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  accountabilityLabel: {
    fontSize: 13,
    fontFamily: "Inter",
  },
  accountabilityName: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter",
  },
  checkInSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 16,
  },
  reflectionContainer: {
    marginTop: 16,
  },
  reflectionLabel: {
    fontSize: 14,
    fontFamily: "Inter",
    marginBottom: 8,
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter",
    minHeight: 80,
    textAlignVertical: "top",
  },
  metaSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter",
    textAlign: "center",
  },
});

