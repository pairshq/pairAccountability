import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Target, 
  Users, 
  Sparkles,
  Camera,
  Check,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

const STEPS = [
  { id: 1, title: "Complete Profile", icon: User },
  { id: 2, title: "Set Your Goal", icon: Target },
  { id: 3, title: "Find Partner", icon: Users },
  { id: 4, title: "Get Started", icon: Sparkles },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [bio, setBio] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ onboarding_completed: true } as any);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      router.replace("/(tabs)");
    }
    setIsLoading(false);
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding and mark as done
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Even when skipping, mark onboarding as completed
    await completeOnboarding();
  };

  const goalCategories = [
    { id: "health", label: "Health & Fitness", emoji: "💪" },
    { id: "productivity", label: "Productivity", emoji: "📈" },
    { id: "learning", label: "Learning", emoji: "📚" },
    { id: "finance", label: "Finance", emoji: "💰" },
    { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
    { id: "creative", label: "Creative", emoji: "🎨" },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {STEPS.map((step, index) => (
              <View key={step.id} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= step.id && styles.progressDotActive,
                    currentStep === step.id && styles.progressDotCurrent,
                  ]}
                >
                  {currentStep > step.id ? (
                    <Check size={12} color="#000" />
                  ) : (
                    <Text style={[
                      styles.progressNumber,
                      currentStep >= step.id && styles.progressNumberActive,
                    ]}>
                      {step.id}
                    </Text>
                  )}
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      currentStep > step.id && styles.progressLineActive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Complete Profile */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Complete Your Profile</Text>
                <Text style={styles.stepSubtitle}>
                  Add a photo and bio to help your accountability partners know you better
                </Text>
              </View>

              {/* Avatar Upload */}
              <TouchableOpacity style={styles.avatarUpload}>
                <View style={styles.avatarPlaceholder}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <>
                      <User size={40} color="#6B6B6B" />
                      <View style={styles.cameraIcon}>
                        <Camera size={16} color="#FFF" />
                      </View>
                    </>
                  )}
                </View>
                <Text style={styles.avatarText}>Tap to add photo</Text>
              </TouchableOpacity>

              {/* Bio Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio (optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us a bit about yourself and your goals..."
                  placeholderTextColor="#6B6B6B"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Step 2: Set Your Goal */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Set Your First Goal</Text>
                <Text style={styles.stepSubtitle}>
                  What would you like to achieve? You can always add more goals later.
                </Text>
              </View>

              {/* Goal Category Selection */}
              <View style={styles.categoryGrid}>
                {goalCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      goalCategory === category.id && styles.categoryCardActive,
                    ]}
                    onPress={() => setGoalCategory(category.id)}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryLabel,
                      goalCategory === category.id && styles.categoryLabelActive,
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Goal Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Exercise 3 times a week"
                  placeholderTextColor="#6B6B6B"
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                />
              </View>
            </View>
          )}

          {/* Step 3: Find Partner */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Find an Accountability Partner</Text>
                <Text style={styles.stepSubtitle}>
                  Invite a friend or join a group to stay accountable together
                </Text>
              </View>

              {/* Options */}
              <TouchableOpacity style={styles.optionCard}>
                <View style={styles.optionIcon}>
                  <Users size={24} color="#FAB300" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Invite a Friend</Text>
                  <Text style={styles.optionSubtitle}>
                    Send an invite link to someone you know
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B6B6B" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard}>
                <View style={styles.optionIcon}>
                  <Target size={24} color="#FAB300" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Join a Group</Text>
                  <Text style={styles.optionSubtitle}>
                    Find a community with similar goals
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B6B6B" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard}>
                <View style={styles.optionIcon}>
                  <Sparkles size={24} color="#FAB300" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Get Matched</Text>
                  <Text style={styles.optionSubtitle}>
                    We'll find a partner based on your goals
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Get Started */}
          {currentStep === 4 && (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>You're All Set! 🎉</Text>
                <Text style={styles.stepSubtitle}>
                  Here's a quick overview of what you can do with Pair
                </Text>
              </View>

              {/* Feature Cards */}
              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>📋</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Track Daily Tasks</Text>
                  <Text style={styles.featureSubtitle}>
                    Create tasks and check them off as you complete them
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>🔥</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Build Streaks</Text>
                  <Text style={styles.featureSubtitle}>
                    Stay consistent and watch your streak grow
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>👥</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Stay Accountable</Text>
                  <Text style={styles.featureSubtitle}>
                    Share progress with your partner and cheer each other on
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>⏱️</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Focus Timer</Text>
                  <Text style={styles.featureSubtitle}>
                    Use the Pomodoro timer to stay focused on your tasks
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ChevronLeft size={20} color="#FFF" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, currentStep === 1 && styles.nextBtnFull]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === 4 ? "Get Started" : "Continue"}
            </Text>
            <ChevronRight size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#27272A",
  },
  progressDotActive: {
    backgroundColor: "#FAB300",
    borderColor: "#FAB300",
  },
  progressDotCurrent: {
    borderColor: "#FAB300",
    backgroundColor: "#FAB300",
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6B6B",
  },
  progressNumberActive: {
    color: "#000",
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: "#27272A",
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: "#FAB300",
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#6B6B6B",
    lineHeight: 24,
  },
  avatarUpload: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#27272A",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FAB300",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#FFFFFF",
  },
  textArea: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#FFFFFF",
    minHeight: 120,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#27272A",
  },
  categoryCardActive: {
    borderColor: "#FAB300",
    backgroundColor: "#FAB30015",
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
  },
  categoryLabelActive: {
    color: "#FAB300",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FAB30015",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAB300",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 4,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
});
