import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import { useColors } from "@/lib/useColorScheme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  noBorder?: boolean;
}

export function Card({ children, style, onPress, noBorder = false }: CardProps) {
  const colors = useColors();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: noBorder ? "transparent" : colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { opacity: 0.7 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
});

