import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Check, X, ChevronLeft, ChevronRight, Users } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { useGroupStore } from "@/stores/groupStore";
import { Categories, Frequencies, AccountabilityTypes } from "@/lib/constants";

type Step = "title" | "category" | "frequency" | "accountability" | "group";

const baseSteps: Step[] = ["title", "category", "frequency", "accountability"];

export default function CreateGoalScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { createGoal } = useGoalStore();
  const { groups, fetchGroups } = useGroupStore();

  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [accountabilityType, setAccountabilityType] = useState<string>("self");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically add group step if accountability type is "group"
  const steps: Step[] = accountabilityType === "group" 
    ? [...baseSteps, "group"] 
    : baseSteps;

  const currentStepIndex = steps.indexOf(step);

  useEffect(() => {
    if (user) {
      fetchGroups(user.id);
    }
  }, [user]);

  const handleNext = () => {
    if (step === "title" && title.trim()) {
      setStep("category");
    } else if (step === "category" && category) {
      setStep("frequency");
    } else if (step === "frequency" && frequency) {
      setStep("accountability");
    } else if (step === "accountability" && accountabilityType === "group") {
      setStep("group");
    }
  };

  const handleBack = () => {
    if (step === "category") setStep("title");
    else if (step === "frequency") setStep("category");
    else if (step === "accountability") setStep("frequency");
    else if (step === "group") setStep("accountability");
  };

  const handleCreate = async () => {
    if (!user) {
      console.log("No user found");
      return;
    }

    setIsSubmitting(true);
    
    const goalData = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category: category as "personal" | "fitness" | "study" | "professional" | "financial" | "wellness",
      frequency: frequency as "daily" | "weekly",
      accountability_type: accountabilityType as "self" | "pair" | "group",
      visibility: (accountabilityType === "self" ? "private" : accountabilityType === "pair" ? "partner" : "group") as "private" | "partner" | "group",
      partner_id: null,
      group_id: accountabilityType === "group" ? selectedGroupId : null,
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      is_active: true,
    };
    
    console.log("Creating goal with data:", goalData);
    
    const { error } = await createGoal(goalData);

    console.log("Create goal result - error:", error);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      router.replace("/(tabs)/goals");
    }
  };

  const canProceed = () => {
    if (step === "title") return title.trim().length > 0;
    if (step === "category") return category.length > 0;
    if (step === "frequency") return frequency.length > 0;
    if (step === "accountability") return accountabilityType.length > 0;
    if (step === "group") return selectedGroupId !== null;
    return false;
  };

  const isLastStep = () => {
    if (accountabilityType === "group") {
      return step === "group";
    }
    return step === "accountability";
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/goals")} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Goal</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F0F0" }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStepIndex + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step Content */}
          {step === "title" && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                What's your goal?
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Write a clear, specific goal you want to achieve
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Goal Title</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                      color: colors.text,
                    }
                  ]}
                  placeholder="e.g., Exercise for 30 minutes"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description (optional)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    { 
                      backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                      color: colors.text,
                    }
                  ]}
                  placeholder="Add more details about your goal..."
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {step === "category" && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Choose a category
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                This helps organize your goals
              </Text>
              
              <View style={styles.optionsGrid}>
                {Categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: category === cat.id ? "#FAB300" : colors.border,
                        backgroundColor: category === cat.id
                          ? colors.isDark ? "#1A1A0A" : "#FFFBEB"
                          : colors.card,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {cat.label}
                    </Text>
                    {category === cat.id && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === "frequency" && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                How often?
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Set your check-in frequency
              </Text>
              
              <View style={styles.optionsList}>
                {Frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.id}
                    style={[
                      styles.optionRow,
                      {
                        borderColor: frequency === freq.id ? "#FAB300" : colors.border,
                        backgroundColor: frequency === freq.id
                          ? colors.isDark ? "#1A1A0A" : "#FFFBEB"
                          : colors.card,
                      },
                    ]}
                    onPress={() => setFrequency(freq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {freq.label}
                    </Text>
                    {frequency === freq.id && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === "accountability" && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Accountability type
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                How do you want to stay accountable?
              </Text>
              
              <View style={styles.optionsList}>
                {AccountabilityTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionRowLarge,
                      {
                        borderColor: accountabilityType === type.id ? "#FAB300" : colors.border,
                        backgroundColor: accountabilityType === type.id
                          ? colors.isDark ? "#1A1A0A" : "#FFFBEB"
                          : colors.card,
                      },
                    ]}
                    onPress={() => {
                      setAccountabilityType(type.id);
                      if (type.id !== "group") {
                        setSelectedGroupId(null);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTextContent}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>
                        {type.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                        {type.description}
                      </Text>
                    </View>
                    {accountabilityType === type.id && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === "group" && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Select a group
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                Choose which group to share this goal with
              </Text>
              
              {groups.length === 0 ? (
                <View style={[styles.emptyGroupsCard, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                  <Users size={32} color={colors.textSecondary} />
                  <Text style={[styles.emptyGroupsText, { color: colors.textSecondary }]}>
                    You haven't joined any groups yet.
                  </Text>
                  <Text style={[styles.emptyGroupsHint, { color: colors.textSecondary }]}>
                    Create or join a group first to share goals.
                  </Text>
                </View>
              ) : (
                <View style={styles.optionsList}>
                  {groups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupOptionRow,
                        {
                          borderColor: selectedGroupId === group.id ? "#FAB300" : colors.border,
                          backgroundColor: selectedGroupId === group.id
                            ? colors.isDark ? "#1A1A0A" : "#FFFBEB"
                            : colors.card,
                        },
                      ]}
                      onPress={() => setSelectedGroupId(group.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.groupIcon, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E5E5" }]}>
                        <Users size={20} color={colors.textSecondary} />
                      </View>
                      <View style={styles.groupOptionInfo}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                          {group.name}
                        </Text>
                        <Text style={[styles.groupMemberCount, { color: colors.textSecondary }]}>
                          {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      {selectedGroupId === group.id && (
                        <View style={styles.checkBadge}>
                          <Check size={14} color="#000000" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Navigation Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {step !== "title" ? (
            <TouchableOpacity 
              style={[styles.backButton, { borderColor: colors.border }]} 
              onPress={handleBack}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {isLastStep() ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canProceed() || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!canProceed() || isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Creating..." : "Create Goal"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !canProceed() && styles.buttonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
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
  closeButton: {
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FAB300",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: "48%",
    flexGrow: 1,
  },
  optionsList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionRowLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionTextContent: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FAB300",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyGroupsCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    gap: 12,
  },
  emptyGroupsText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyGroupsHint: {
    fontSize: 14,
    textAlign: "center",
  },
  groupOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  groupOptionInfo: {
    flex: 1,
  },
  groupMemberCount: {
    fontSize: 14,
    marginTop: 2,
  },
});
