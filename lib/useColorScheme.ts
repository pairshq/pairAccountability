import { useColorScheme as useNativeColorScheme } from "react-native";
import { useThemeStore } from "@/stores/themeStore";

export function useColorScheme() {
  const theme = useThemeStore((state) => state.theme);
  return theme;
}

export function useColors() {
  const colorScheme = useColorScheme();
  
  return {
    isDark: colorScheme === "dark",
    background: colorScheme === "dark" ? "#0E0E0E" : "#FFFFFF",
    card: colorScheme === "dark" ? "#141414" : "#FFFFFF",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    textSecondary: colorScheme === "dark" ? "#A0A0A0" : "#6B6B6B",
    border: colorScheme === "dark" ? "#1E1E1E" : "#EAEAEA",
    accent: "#FAB300",
    success: "#2ECC71",
    missed: "#E74C3C",
  };
}

