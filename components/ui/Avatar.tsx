import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useColors } from "@/lib/useColorScheme";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = "?", size = 40 }: AvatarProps) {
  const colors = useColors();

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.isDark ? "#2A2A2A" : "#F0F0F0",
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: colors.textSecondary,
            fontSize: size * 0.4,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#E5E5E5",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "600",
  },
});

