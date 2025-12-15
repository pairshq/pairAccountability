import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Check, X } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface CheckInButtonProps {
  type: "complete" | "miss";
  onPress: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function CheckInButton({
  type,
  onPress,
  isSelected = false,
  disabled = false,
}: CheckInButtonProps) {
  const colors = useColors();

  const isComplete = type === "complete";
  const activeColor = isComplete ? colors.success : colors.missed;
  const Icon = isComplete ? Check : X;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: isSelected ? activeColor : "transparent",
          borderColor: isSelected ? activeColor : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon
        size={24}
        color={isSelected ? "#FFFFFF" : colors.textSecondary}
        strokeWidth={2.5}
      />
      <Text
        style={[
          styles.text,
          {
            color: isSelected ? "#FFFFFF" : colors.text,
          },
        ]}
      >
        {isComplete ? "Completed" : "Not completed"}
      </Text>
    </TouchableOpacity>
  );
}

interface CheckInGroupProps {
  status: "completed" | "missed" | null;
  onCheckIn: (status: "completed" | "missed") => void;
  disabled?: boolean;
}

export function CheckInGroup({ status, onCheckIn, disabled }: CheckInGroupProps) {
  return (
    <View style={styles.group}>
      <CheckInButton
        type="complete"
        onPress={() => onCheckIn("completed")}
        isSelected={status === "completed"}
        disabled={disabled}
      />
      <CheckInButton
        type="miss"
        onPress={() => onCheckIn("missed")}
        isSelected={status === "missed"}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
  },
  group: {
    flexDirection: "row",
    gap: 12,
  },
});

