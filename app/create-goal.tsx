import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Check } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGoalStore } from "@/stores/goalStore";
import { Categories, Frequencies, AccountabilityTypes } from "@/lib/constants";

type Step = "title" | "category" | "frequency" | "accountability";

export default function CreateGoalScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { createGoal } = useGoalStore();

  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [accountabilityType, setAccountabilityType] = useState<string>("self");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === "title" && title.trim()) {
      setStep("category");
    } else if (step === "category" && category) {
      setStep("frequency");
    } else if (step === "frequency" && frequency) {
      setStep("accountability");
    }
  };

  const handleBack = () => {
    if (step === "category") setStep("title");
    else if (step === "frequency") setStep("category");
    else if (step === "accountability") setStep("frequency");
  };

  const handleCreate = async () => {
    if (!user) return;

    setIsSubmitting(true);
    
    const { error } = await createGoal({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      frequency: frequency as any,
      accountability_type: accountabilityType as any,
      visibility: accountabilityType === "self" ? "private" : accountabilityType === "pair" ? "partner" : "group",
      start_date: new Date().toISOString().split("T")[0],
      is_active: true,
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      router.back();
    }
  };

  const canProceed = () => {
    if (step === "title") return title.trim().length > 0;
    if (step === "category") return category.length > 0;
    if (step === "frequency") return frequency.length > 0;
    if (step === "accountability") return accountabilityType.length > 0;
    return false;
  };

  const SelectOption = ({
    label,
    description,
    selected,
    onPress,
  }: {
    label: string;
    description?: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.option,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected
            ? colors.isDark
              ? "#1A1A0A"
              : "#FFFBEB"
            : colors.card,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {selected && (
        <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
          <Check size={14} color="#000000" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {["title", "category", "frequency", "accountability"].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    step === s
                      ? colors.accent
                      : ["title", "category", "frequency", "accountability"].indexOf(step) > i
                      ? colors.accent
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        {step === "title" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What's your goal?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Write a clear, specific goal
            </Text>
            <Input
              placeholder="e.g., Exercise for 30 minutes"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Input
              label="Description (optional)"
              placeholder="Add more details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {step === "category" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Choose a category
            </Text>
            <View style={styles.optionsGrid}>
              {Categories.map((cat) => (
                <SelectOption
                  key={cat.id}
                  label={cat.label}
                  selected={category === cat.id}
                  onPress={() => setCategory(cat.id)}
                />
              ))}
            </View>
          </View>
        )}

        {step === "frequency" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              How often?
            </Text>
            <View style={styles.optionsList}>
              {Frequencies.map((freq) => (
                <SelectOption
                  key={freq.id}
                  label={freq.label}
                  selected={frequency === freq.id}
                  onPress={() => setFrequency(freq.id)}
                />
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
                <SelectOption
                  key={type.id}
                  label={type.label}
                  description={type.description}
                  selected={accountabilityType === type.id}
                  onPress={() => setAccountabilityType(type.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          {step !== "title" && (
            <Button variant="secondary" onPress={handleBack}>
              Back
            </Button>
          )}
          <View style={{ flex: 1 }} />
          {step === "accountability" ? (
            <Button
              onPress={handleCreate}
              loading={isSubmitting}
              disabled={!canProceed()}
            >
              Create goal
            </Button>
          ) : (
            <Button onPress={handleNext} disabled={!canProceed()}>
              Continue
            </Button>
          )}
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
    flexGrow: 1,
  },
  cancelButton: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: "Inter",
    marginBottom: 24,
  },
  optionsGrid: {
    gap: 12,
  },
  optionsList: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter",
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navigation: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 24,
  },
});

