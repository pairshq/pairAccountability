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
import { useLocalSearchParams, Stack } from "expo-router";
import { Send, Copy, Users } from "lucide-react-native";
import { Avatar, Card } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";

type Tab = "goals" | "chat";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user, profile } = useAuthStore();
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
    // Scroll to bottom when new messages arrive
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
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: currentGroup.name,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        {/* Group Info */}
        <View style={[styles.groupInfo, { borderBottomColor: colors.border }]}>
          <View style={styles.memberAvatars}>
            {currentGroup.members.slice(0, 4).map((member, index) => (
              <View
                key={member.id}
                style={[styles.avatarWrapper, { marginLeft: index > 0 ? -8 : 0 }]}
              >
                <Avatar uri={member.avatar_url} name={member.username} size={28} />
              </View>
            ))}
            {currentGroup.member_count > 4 && (
              <View
                style={[
                  styles.moreMembers,
                  { backgroundColor: colors.isDark ? "#2A2A2A" : "#F0F0F0" },
                ]}
              >
                <Text style={[styles.moreMembersText, { color: colors.textSecondary }]}>
                  +{currentGroup.member_count - 4}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.inviteButton, { borderColor: colors.border }]}
            onPress={handleShareInvite}
          >
            <Copy size={16} color={colors.textSecondary} />
            <Text style={[styles.inviteCode, { color: colors.text }]}>
              {currentGroup.invite_code}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "goals" && { borderBottomColor: colors.accent },
            ]}
            onPress={() => setActiveTab("goals")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "goals" ? colors.text : colors.textSecondary,
                  fontWeight: activeTab === "goals" ? "500" : "400",
                },
              ]}
            >
              Goals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "chat" && { borderBottomColor: colors.accent },
            ]}
            onPress={() => setActiveTab("chat")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "chat" ? colors.text : colors.textSecondary,
                  fontWeight: activeTab === "chat" ? "500" : "400",
                },
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "goals" ? (
          <ScrollView style={styles.goalsContent}>
            <View style={styles.goalsEmpty}>
              <Users size={32} color={colors.textSecondary} />
              <Text style={[styles.goalsEmptyText, { color: colors.textSecondary }]}>
                No shared goals yet
              </Text>
            </View>
          </ScrollView>
        ) : (
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
                  <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                    Start the conversation
                  </Text>
                </View>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;
                  const isSystemMessage = message.message_type === "system";

                  if (isSystemMessage) {
                    return (
                      <View key={message.id} style={styles.systemMessage}>
                        <Text
                          style={[styles.systemMessageText, { color: colors.textSecondary }]}
                        >
                          {message.content}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        isOwnMessage && styles.ownMessageRow,
                      ]}
                    >
                      {!isOwnMessage && (
                        <Avatar
                          uri={(message as any).user?.avatar_url}
                          name={(message as any).user?.username || "User"}
                          size={28}
                        />
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          isOwnMessage
                            ? { backgroundColor: colors.accent }
                            : { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F0F0" },
                        ]}
                      >
                        {!isOwnMessage && (
                          <Text
                            style={[
                              styles.messageUsername,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {(message as any).user?.username}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.messageText,
                            { color: isOwnMessage ? "#000000" : colors.text },
                          ]}
                        >
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5",
                    color: colors.text,
                  },
                ]}
                placeholder="Message..."
                placeholderTextColor={colors.textSecondary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: messageText.trim()
                      ? colors.accent
                      : colors.isDark
                      ? "#2A2A2A"
                      : "#E5E5E5",
                  },
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                <Send
                  size={18}
                  color={messageText.trim() ? "#000000" : colors.textSecondary}
                />
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
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 100,
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 16,
  },
  moreMembers: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  moreMembersText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Inter",
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  inviteCode: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter",
    letterSpacing: 1,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  goalsContent: {
    flex: 1,
  },
  goalsEmpty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  goalsEmptyText: {
    fontSize: 15,
    fontFamily: "Inter",
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
  emptyChatText: {
    fontSize: 15,
    fontFamily: "Inter",
  },
  systemMessage: {
    alignItems: "center",
    paddingVertical: 8,
  },
  systemMessageText: {
    fontSize: 13,
    fontFamily: "Inter",
    fontStyle: "italic",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  ownMessageRow: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Inter",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    fontFamily: "Inter",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

