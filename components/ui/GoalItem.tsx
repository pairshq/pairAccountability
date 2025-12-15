import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check, Flame, Users, User } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import type { GoalWithDetails } from "@/types";

interface GoalItemProps {
  goal: GoalWithDetails;
  onPress?: () => void;
}

export function GoalItem({ goal, onPress }: GoalItemProps) {
  const colors = useColors();
  
  const isCompleted = goal.today_check_in?.status === "completed";
  const isMissed = goal.today_check_in?.status === "missed";

  const getStatusDot = () => {
    if (isCompleted) {
      return (
        <View style={[styles.statusDot, { backgroundColor: colors.success }]}>
          <Check size={12} color="#FFFFFF" strokeWidth={3} />
        </View>
      );
    }
    if (isMissed) {
      return (
        <View style={[styles.statusDot, { backgroundColor: colors.missed }]} />
      );
    }
    return (
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: "transparent",
            borderWidth: 2,
            borderColor: colors.border,
          },
        ]}
      />
    );
  };

  const getAccountabilityIcon = () => {
    if (goal.accountability_type === "pair" && goal.partner) {
      return <User size={14} color={colors.textSecondary} />;
    }
    if (goal.accountability_type === "group" && goal.group) {
      return <Users size={14} color={colors.textSecondary} />;
    }
    return null;
  };

  const getSubtext = () => {
    const parts = [
      goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1),
    ];
    
    if (goal.partner?.username) {
      parts.push(`with ${goal.partner.username}`);
    } else if (goal.group?.name) {
      parts.push(goal.group.name);
    }
    
    return parts.join(" · ");
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          opacity: isCompleted ? 0.6 : isMissed ? 0.5 : 1,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {getStatusDot()}
      
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              textDecorationLine: isCompleted ? "line-through" : "none",
            },
          ]}
          numberOfLines={1}
        >
          {goal.title}
        </Text>
        <View style={styles.meta}>
          {getAccountabilityIcon()}
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            {getSubtext()}
          </Text>
        </View>
      </View>

      {goal.current_streak > 0 && (
        <View style={styles.streak}>
          <Flame size={14} color={colors.accent} />
          <Text style={[styles.streakText, { color: colors.accent }]}>
            {goal.current_streak}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtext: {
    fontSize: 13,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

