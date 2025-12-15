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
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Users, X, Search, UserPlus, ChevronRight, Hash } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { useResponsive } from "@/hooks/useResponsive";

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
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups(user.id);
    }
  }, [user]);

  const handleRefresh = () => {
    if (user) {
      fetchGroups(user.id);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await createGroup(
      groupName.trim(),
      groupDescription.trim() || null,
      user.id
    );
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setShowCreateModal(false);
      setGroupName("");
      setGroupDescription("");
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await joinGroup(inviteCode.trim(), user.id);
    setIsSubmitting(false);

    if (error) {
      Alert.alert("Error", error);
    } else {
      setShowJoinModal(false);
      setInviteCode("");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Groups</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isDesktop && (
            <View style={[styles.searchContainer, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search groups"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <UserPlus size={18} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.primaryButton}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {groups.length > 0 ? (
          <View style={[styles.groupsGrid, isDesktop && styles.groupsGridDesktop]}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                style={[
                  styles.groupCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isDesktop && styles.groupCardDesktop,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Users size={20} color={colors.textSecondary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                      {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>
                
                {group.description && (
                  <Text
                    style={[styles.groupDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {group.description}
                  </Text>
                )}

                <View style={styles.cardStats}>
                  <View style={[styles.statItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {group.active_goals_count}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Active Goals
                    </Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {group.member_count}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Members
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Users size={40} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No groups yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create a group to collaborate with friends or join an existing one with an invite code.
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={styles.emptyPrimaryButton}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyPrimaryButtonText}>Create Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowJoinModal(true)}
                style={[styles.emptySecondaryButton, { borderColor: colors.border }]}
              >
                <Hash size={18} color={colors.text} />
                <Text style={[styles.emptySecondaryButtonText, { color: colors.text }]}>
                  Join with Code
                </Text>
              </TouchableOpacity>
            </View>
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
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create group</Text>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={[styles.modalClose, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Group name</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter group name"
                  placeholderTextColor={colors.textSecondary}
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description (optional)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextarea,
                    { 
                      backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                      color: colors.text,
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

              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || isSubmitting}
                style={[
                  styles.modalButton,
                  (!groupName.trim() || isSubmitting) && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? "Creating..." : "Create Group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Join group</Text>
              <TouchableOpacity 
                onPress={() => setShowJoinModal(false)}
                style={[styles.modalClose, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Invite code</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.codeInput,
                    { 
                      backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                      color: colors.text,
                    }
                  ]}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.textSecondary}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                  Enter the 6-character invite code
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={inviteCode.trim().length !== 6 || isSubmitting}
                style={[
                  styles.modalButton,
                  (inviteCode.trim().length !== 6 || isSubmitting) && styles.modalButtonDisabled,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    minWidth: 240,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
  },
  groupsGrid: {
    gap: 16,
  },
  groupsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  groupCardDesktop: {
    width: "calc(50% - 8px)",
    minWidth: 320,
    maxWidth: 500,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 13,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 320,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
  },
  emptyPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptySecondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 20,
    paddingTop: 0,
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
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalTextarea: {
    minHeight: 100,
    paddingTop: 14,
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
  modalButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
