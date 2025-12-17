import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Users, X, Search, UserPlus, Sparkles, ArrowRight, MessageCircle, Camera, Lock, Eye, EyeOff, Wifi } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { useResponsive } from "@/hooks/useResponsive";

const GRADIENT_COLORS = [
  ["#9333EA", "#EC4899", "#EF4444"],
  ["#3B82F6", "#06B6D4", "#14B8A6"],
  ["#374151", "#1F2937", "#000000"],
  ["#F97316", "#EF4444", "#EC4899"],
  ["#F59E0B", "#EAB308", "#84CC16"],
  ["#6366F1", "#8B5CF6", "#EC4899"],
];

const getGradientColor = (index: number) => {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length][0];
};

export default function GroupsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { groups, isLoading, fetchGroups, createGroup, joinGroup } = useGroupStore();
  const { isDesktop } = useResponsive();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [customInviteCode, setCustomInviteCode] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    console.log("Groups screen - user:", user?.id);
    console.log("Groups screen - groups:", groups);
    if (user) {
      fetchGroups(user.id);
    }
  }, [user]);

  useEffect(() => {
    console.log("Groups updated:", groups.length, groups);
  }, [groups]);

  const handleRefresh = () => {
    if (user) {
      fetchGroups(user.id);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setGroupAvatar(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user) return;
    if (!customInviteCode.trim()) {
      Alert.alert("Error", "Please enter a Group ID");
      return;
    }

    setIsSubmitting(true);
    const { error, group } = await createGroup({
      name: groupName.trim(),
      description: groupDescription.trim() || null,
      avatarUri: groupAvatar,
      inviteCode: customInviteCode.trim(),
      password: groupPassword.trim() || null,
      userId: user.id,
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setShowCreateModal(false);
      setGroupName("");
      setGroupDescription("");
      setGroupAvatar(null);
      setCustomInviteCode("");
      setGroupPassword("");
      fetchGroups(user.id);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await joinGroup(inviteCode.trim(), user.id, joinPassword.trim() || undefined);
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setShowJoinModal(false);
      setInviteCode("");
      setJoinPassword("");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Groups</Text>
            
            {/* Search Bar - Centered */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                placeholder="Search for groups..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                onPress={() => setShowJoinModal(true)}
                style={styles.heroSecondaryButton}
                activeOpacity={0.8}
              >
                <UserPlus size={18} color="#FFFFFF" />
                <Text style={styles.heroSecondaryButtonText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={styles.heroPrimaryButton}
                activeOpacity={0.8}
              >
                <Plus size={20} color="#000000" />
                <Text style={styles.heroPrimaryButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Groups Section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Groups</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {filteredGroups.length} {filteredGroups.length === 1 ? "group" : "groups"} available
          </Text>
        </View>

        {filteredGroups.length > 0 ? (
          <View style={[styles.groupsGrid, isDesktop && styles.groupsGridDesktop]}>
            {filteredGroups.map((group, index) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.isDark ? "#1A1A1A" : "#F9FAFB", borderColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  {/* Group Avatar */}
                  <View style={styles.avatarContainer}>
                    {group.avatar_url ? (
                      <Image source={{ uri: group.avatar_url }} style={styles.groupAvatar} />
                    ) : (
                      <View style={[styles.groupAvatar, { backgroundColor: getGradientColor(index) }]}>
                        <Users size={24} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* Group Info */}
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {group.description || "No description"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.memberStats}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                      {group.member_count}
                    </Text>
                    <Text style={[styles.statDot, { color: colors.textSecondary }]}>•</Text>
                    <Wifi size={14} color="#22C55E" />
                    <Text style={[styles.activeGoals, { color: "#22C55E" }]}>
                      {group.online_count || 0} online
                    </Text>
                  </View>

                  {/* Enter Button */}
                  <TouchableOpacity style={styles.enterButton}>
                    <ArrowRight size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={80} color={colors.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No groups found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try a different search or create a new group
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContainer, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                  setGroupDescription("");
                  setGroupAvatar(null);
                  setCustomInviteCode("");
                  setGroupPassword("");
                }}
              >
                <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Plus size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Group</Text>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Set up your accountability group
            </Text>

            {/* Avatar Picker */}
            <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
              {groupAvatar ? (
                <Image source={{ uri: groupAvatar }} style={styles.avatarPreview} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6" }]}>
                  <Camera size={32} color={colors.textSecondary} />
                  <Text style={[styles.avatarPlaceholderText, { color: colors.textSecondary }]}>
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Group Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Group Name *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                    color: colors.text,
                    borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                  }
                ]}
                placeholder="e.g., Morning Runners"
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalTextarea,
                  { 
                    backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                    color: colors.text,
                    borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                  }
                ]}
                placeholder="What's this group about?"
                placeholderTextColor={colors.textSecondary}
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Group ID (Invite Code) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Group ID *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.codeInput,
                  { 
                    backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                    color: colors.text,
                    borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                  }
                ]}
                placeholder="MYGROUP"
                placeholderTextColor={colors.textSecondary}
                value={customInviteCode}
                onChangeText={(text) => setCustomInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                autoCapitalize="characters"
                maxLength={12}
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                This is how others will find your group
              </Text>
            </View>

            {/* Password (Required) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password *
              </Text>
              <View style={styles.passwordInputContainer}>
                <Lock size={18} color={colors.textSecondary} style={styles.passwordIcon} />
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.passwordInput,
                    { 
                      backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                      color: colors.text,
                      borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                    }
                  ]}
                  placeholder="Set a password for this group"
                  placeholderTextColor={colors.textSecondary}
                  value={groupPassword}
                  onChangeText={setGroupPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                  setGroupDescription("");
                  setGroupAvatar(null);
                  setCustomInviteCode("");
                  setGroupPassword("");
                }}
                style={[styles.modalCancelButton, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}
              >
                <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || !customInviteCode.trim() || !groupPassword.trim() || isSubmitting}
                style={[
                  styles.modalButton,
                  (!groupName.trim() || !customInviteCode.trim() || !groupPassword.trim() || isSubmitting) && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? "Creating..." : "Create Group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "center" }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => {
                setShowJoinModal(false);
                setInviteCode("");
                setJoinPassword("");
              }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <UserPlus size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Join Group</Text>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the group ID to join
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Group ID *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.codeInput,
                  { 
                    backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                    color: colors.text,
                    borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                  }
                ]}
                placeholder="GROUPID"
                placeholderTextColor={colors.textSecondary}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={12}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password *
              </Text>
              <View style={styles.passwordInputContainer}>
                <Lock size={18} color={colors.textSecondary} style={styles.passwordIcon} />
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.passwordInput,
                    { 
                      backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6",
                      color: colors.text,
                      borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB",
                    }
                  ]}
                  placeholder="Enter group password"
                  placeholderTextColor={colors.textSecondary}
                  value={joinPassword}
                  onChangeText={setJoinPassword}
                  secureTextEntry={!showJoinPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowJoinPassword(!showJoinPassword)}
                >
                  {showJoinPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode("");
                  setJoinPassword("");
                }}
                style={[styles.modalCancelButton, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}
              >
                <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={!inviteCode.trim() || !joinPassword.trim() || isSubmitting}
                style={[
                  styles.modalButton,
                  (!inviteCode.trim() || !joinPassword.trim() || isSubmitting) && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? "Joining..." : "Join Group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  heroContent: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    minWidth: 100,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  heroButtons: {
    flexDirection: "row",
    gap: 12,
  },
  heroSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  heroPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 480,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  sectionHeader: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
  },
  groupsGrid: {
    gap: 20,
  },
  groupsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  groupCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    flexGrow: 1,
    flexBasis: "30%",
    maxWidth: 400,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  groupInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberCount: {
    fontSize: 12,
  },
  statDot: {
    fontSize: 12,
  },
  activeGoals: {
    fontSize: 12,
  },
  enterButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    opacity: 0.2,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 24,
    padding: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    gap: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  modalTextarea: {
    minHeight: 100,
    paddingTop: 16,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 4,
    textAlign: "center",
  },
  inputHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  modalButtonDisabled: {
    opacity: 0.3,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalScrollView: {
    flex: 1,
    width: "100%",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  avatarPicker: {
    alignSelf: "center",
    marginBottom: 24,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#9CA3AF",
  },
  avatarPlaceholderText: {
    fontSize: 12,
    marginTop: 4,
  },
  passwordInputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  passwordInput: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 44,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    zIndex: 1,
  },
});
