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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Users, X } from "lucide-react-native";
import { Card, Button, Input } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";

export default function GroupsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { groups, isLoading, fetchGroups, createGroup, joinGroup } = useGroupStore();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Groups</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Join Group Button */}
      <View style={styles.joinSection}>
        <TouchableOpacity
          onPress={() => setShowJoinModal(true)}
          style={[styles.joinButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.joinButtonText, { color: colors.text }]}>
            Join a group with invite code
          </Text>
        </TouchableOpacity>
      </View>

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
        {groups.length > 0 ? (
          <View style={styles.groupList}>
            {groups.map((group) => (
              <Card
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                style={styles.groupCard}
              >
                <Text style={[styles.groupName, { color: colors.text }]}>
                  {group.name}
                </Text>
                {group.description && (
                  <Text
                    style={[styles.groupDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {group.description}
                  </Text>
                )}
                <View style={styles.groupMeta}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    ·
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {group.active_goals_count} active goal{group.active_goals_count !== 1 ? "s" : ""}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" },
              ]}
            >
              <Users size={32} color={colors.textSecondary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No groups yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create a group or join one with an invite code.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create group
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Input
              label="Group name"
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <Input
              label="Description (optional)"
              placeholder="What's this group about?"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
            />
            <Button
              onPress={handleCreateGroup}
              loading={isSubmitting}
              disabled={!groupName.trim()}
              fullWidth
            >
              Create group
            </Button>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Join group
            </Text>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Input
              label="Invite code"
              placeholder="Enter 6-character code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Button
              onPress={handleJoinGroup}
              loading={isSubmitting}
              disabled={inviteCode.trim().length !== 6}
              fullWidth
            >
              Join group
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  joinSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  joinButton: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 14,
    alignItems: "center",
  },
  joinButtonText: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  groupList: {
    gap: 12,
  },
  groupCard: {
    padding: 16,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    marginBottom: 12,
  },
  groupMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  modalContent: {
    paddingHorizontal: 24,
  },
});

