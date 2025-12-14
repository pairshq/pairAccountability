// Design System Constants
export const Colors = {
  // Brand
  accent: "#FAB300",
  
  // Light Mode
  light: {
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#000000",
    textSecondary: "#6B6B6B",
    border: "#EAEAEA",
  },
  
  // Dark Mode
  dark: {
    background: "#0E0E0E",
    card: "#141414",
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    border: "#1E1E1E",
  },
  
  // Status
  success: "#2ECC71",
  missed: "#E74C3C",
  
  // Logo
  slate: "#1E293B",
} as const;

export const Categories = [
  { id: "personal", label: "Personal", icon: "User" },
  { id: "fitness", label: "Fitness", icon: "Dumbbell" },
  { id: "study", label: "Study", icon: "BookOpen" },
  { id: "professional", label: "Professional", icon: "Briefcase" },
  { id: "financial", label: "Financial", icon: "DollarSign" },
  { id: "wellness", label: "Wellness", icon: "Heart" },
] as const;

export const Frequencies = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
] as const;

export const AccountabilityTypes = [
  { id: "self", label: "Self (Streak)", description: "Track your own streak" },
  { id: "pair", label: "Pair", description: "One accountability partner" },
  { id: "group", label: "Group", description: "Share with a group" },
] as const;

export const Visibility = [
  { id: "private", label: "Private" },
  { id: "partner", label: "Shared with partner" },
  { id: "group", label: "Shared with group" },
] as const;

