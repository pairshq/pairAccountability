import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = "@pair_theme";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  
  initialize: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        set({ theme: savedTheme });
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  },
  
  setTheme: async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      set({ theme });
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  },
}));

