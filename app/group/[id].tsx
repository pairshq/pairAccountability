import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Send, Copy, Users, ChevronLeft, Target, MessageCircle, UserPlus } from "lucide-react-native";
import { Avatar } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { useResponsive } from "@/hooks/useResponsive";

type Tab = "goals" | "chat" | "members";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop } = useResponsive();
  const {
    currentGroup,
    messages,
    fetchGroup,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
  } = useGroupStore();

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      fetchGroup(id);
      fetchMessages(id);
      const unsubscribe = subscribeToMessages(id);
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !id) return;

    setIsSending(true);
    const text = messageText;
    setMessageText("");
    
    await sendMessage(id, user.id, text.trim());
    setIsSending(false);
  };

  const handleShareInvite = async () => {
    if (!currentGroup) return;
    
    try {
      await Share.share({
        message: `Join my accountability group "${currentGroup.name}" on Pair! Use invite code: ${currentGroup.invite_code}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (!currentGroup) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Group</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {currentGroup.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {currentGroup.member_count} members
            </Text>
          </View>
          <TouchableOpacity onPress={handleShareInvite} style={styles.shareButton}>
            <UserPlus size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Group Info Card */}
        <View style={[styles.groupInfoCard, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
          <View style={styles.memberAvatars}>
            {currentGroup.members.slice(0, 5).map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.avatarWrapper,
                  { 
                    marginLeft: index > 0 ? -10 : 0,
                    borderColor: colors.background,
                  }
                ]}
              >
                <View style={[styles.memberAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                  <Text style={[styles.memberInitial, { color: colors.text }]}>
                    {member.username?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
              </View>
            ))}
            {currentGroup.member_count > 5 && (
              <View style={[styles.moreMembers, { backgroundColor: colors.card, borderColor: colors.background }]}>
                <Text style={[styles.moreMembersText, { color: colors.textSecondary }]}>
                  +{currentGroup.member_count - 5}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.inviteButton, { backgroundColor: colors.background }]}
            onPress={handleShareInvite}
          >
            <Copy size={14} color={colors.textSecondary} />
            <Text style={[styles.inviteCode, { color: colors.text }]}>
              {currentGroup.invite_code}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "chat" && styles.tabActive]}
            onPress={() => setActiveTab("chat")}
          >
            <MessageCircle 
              size={18} 
              color={activeTab === "chat" ? colors.text : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === "chat" ? colors.text : colors.textSecondary }
            ]}>
              Chat
            </Text>
            {activeTab === "chat" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "goals" && styles.tabActive]}
            onPress={() => setActiveTab("goals")}
          >
            <Target 
              size={18} 
              color={activeTab === "goals" ? colors.text : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === "goals" ? colors.text : colors.textSecondary }
            ]}>
              Goals
            </Text>
            {activeTab === "goals" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "members" && styles.tabActive]}
            onPress={() => setActiveTab("members")}
          >
            <Users 
              size={18} 
              color={activeTab === "members" ? colors.text : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === "members" ? colors.text : colors.textSecondary }
            ]}>
              Members
            </Text>
            {activeTab === "members" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "goals" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                <Target size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No shared goals yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Goals shared with this group will appear here
              </Text>
            </View>
          </ScrollView>
        )}

        {activeTab === "members" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
            <View style={styles.membersList}>
              {currentGroup.members.map((member) => (
                <View 
                  key={member.id} 
                  style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.memberAvatarLarge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <Text style={[styles.memberInitialLarge, { color: colors.text }]}>
                      {member.username?.[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.full_name || member.username}
                    </Text>
                    <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>
                      @{member.username}
                    </Text>
                  </View>
                  {member.id === currentGroup.creator_id && (
                    <View style={[styles.adminBadge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                      <Text style={[styles.adminText, { color: colors.textSecondary }]}>Admin</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === "chat" && (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                    <MessageCircle size={32} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Start the conversation</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Send a message to get things going
                  </Text>
                </View>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;
                  const isSystemMessage = message.message_type === "system";

                  if (isSystemMessage) {
                    return (
                      <View key={message.id} style={styles.systemMessage}>
                        <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
                          {message.content}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={message.id}
                      style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}
                    >
                      {!isOwnMessage && (
                        <View style={[styles.messageAvatar, { backgroundColor: colors.isDark ? "#1E1E1E" : "#E0E0E0" }]}>
                          <Text style={[styles.messageAvatarText, { color: colors.text }]}>
                            {(message as any).user?.username?.[0]?.toUpperCase() || "?"}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          isOwnMessage
                            ? { backgroundColor: "#000000" }
                            : { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F0F0" },
                        ]}
                      >
                        {!isOwnMessage && (
                          <Text style={[styles.messageUsername, { color: colors.textSecondary }]}>
                            {(message as any).user?.username}
                          </Text>
                        )}
                        <Text style={[styles.messageText, { color: isOwnMessage ? "#FFFFFF" : colors.text }]}>
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                    color: colors.text,
                  },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: messageText.trim() ? "#000000" : colors.isDark ? "#2A2A2A" : "#E5E5E5" },
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                <Send size={18} color={messageText.trim() ? "#FFFFFF" : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 8,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
  },
  groupInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  memberAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    borderWidth: 2,
    borderRadius: 20,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: {
    fontSize: 14,
    fontWeight: "600",
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
    borderWidth: 2,
  },
  moreMembersText: {
    fontSize: 11,
    fontWeight: "600",
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteCode: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "#000000",
    borderRadius: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabContentPadding: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberInitialLarge: {
    fontSize: 18,
    fontWeight: "600",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 14,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminText: {
    fontSize: 12,
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  systemMessage: {
    alignItems: "center",
    paddingVertical: 12,
  },
  systemMessageText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },
  ownMessageRow: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
