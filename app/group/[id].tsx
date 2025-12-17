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
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Send, Copy, Users, ChevronLeft, Target, MessageCircle, UserPlus, Flame, CheckCircle2, TrendingUp, RefreshCw, Search, Phone, MoreVertical, Paperclip, Mic, Smile, X, Image as ImageIcon, Video, File, Music, Link, Plus } from "lucide-react-native";
import { Avatar } from "@/components/ui";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore, MemberProgress } from "@/stores/groupStore";
import { useResponsive } from "@/hooks/useResponsive";

type Tab = "objectives" | "chat" | "members";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop } = useResponsive();
  const {
    currentGroup,
    groups,
    messages,
    memberProgress,
    isLoadingProgress,
    fetchGroup,
    fetchGroups,
    fetchMessages,
    fetchMemberProgress,
    sendMessage,
    subscribeToMessages,
  } = useGroupStore();

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupsList, setShowGroupsList] = useState(true);
  const [groupsSearch, setGroupsSearch] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id && user?.id) {
      fetchGroup(id);
      fetchMessages(id);
      fetchMemberProgress(id);
      fetchGroups(user.id);
      const unsubscribe = subscribeToMessages(id);
      return () => unsubscribe();
    }
  }, [id, user?.id]);

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

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(groupsSearch.toLowerCase())
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Left Sidebar - Groups List */}
        {showGroupsList && (
          <View style={[styles.groupsSidebar, { backgroundColor: colors.background, borderRightColor: colors.border }]}>
            {/* Search Bar */}
            <View style={[styles.groupsSearchContainer, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push("/(tabs)/groups")} style={styles.sidebarBackButton}>
                <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                <Search size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholder="Search"
                  placeholderTextColor={colors.textSecondary}
                  value={groupsSearch}
                  onChangeText={setGroupsSearch}
                />
              </View>
            </View>

            {/* Groups List */}
            <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
              {filteredGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupListItem,
                    group.id === id && styles.groupListItemActive,
                    group.id === id && { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }
                  ]}
                  onPress={() => router.push(`/group/${group.id}`)}
                >
                  <View style={styles.groupListItemLeft}>
                    {group.avatar_url ? (
                      <Image source={{ uri: group.avatar_url }} style={styles.groupListAvatar} />
                    ) : (
                      <View style={[styles.groupListAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                        <Users size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.groupListInfo}>
                      <Text style={[styles.groupListName, { color: colors.text }]} numberOfLines={1}>
                        {group.name}
                      </Text>
                      <Text style={[styles.groupListMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                        {group.member_count} members
                      </Text>
                    </View>
                  </View>
                  {group.id !== id && (
                    <View style={styles.groupListTime}>
                      <Text style={[styles.groupListTimeText, { color: colors.textSecondary }]}>2m ago</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Chat Area */}
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.chatHeaderInfo}>
            {currentGroup.avatar_url ? (
              <Image source={{ uri: currentGroup.avatar_url }} style={styles.chatHeaderAvatar} />
            ) : (
              <View style={[styles.chatHeaderAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                <Users size={20} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.chatHeaderText}>
              <Text style={[styles.chatHeaderTitle, { color: colors.text }]} numberOfLines={1}>
                {currentGroup.name}
              </Text>
              <Text style={[styles.chatHeaderSubtitle, { color: colors.textSecondary }]}>
                {currentGroup.member_count || 0} members, {currentGroup.online_count || 0} online
              </Text>
            </View>
          </View>
          <View style={styles.chatHeaderActions}>
            <TouchableOpacity 
              style={[styles.headerActionButton, activeTab === "chat" && styles.headerActionButtonActive]}
              onPress={() => setActiveTab("chat")}
            >
              <MessageCircle size={20} color={activeTab === "chat" ? "#00A884" : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerActionButton, activeTab === "objectives" && styles.headerActionButtonActive]}
              onPress={() => setActiveTab("objectives")}
            >
              <Target size={20} color={activeTab === "objectives" ? "#00A884" : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Video size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Phone size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Search size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setShowGroupInfo(!showGroupInfo)}
            >
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Content */}
        {activeTab === "chat" && (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={[styles.messagesContainer, { backgroundColor: colors.isDark ? "#0A0A0A" : "#E5DDD5" }]}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
            >
              {/* Background Pattern */}
              <View style={[styles.chatBackground, { opacity: colors.isDark ? 0.05 : 0.08 }]} />
              
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
                messages.map((message, index) => {
                  const isOwnMessage = message.user_id === user?.id;
                  const isSystemMessage = message.message_type === "system";
                  const currentDate = new Date(message.created_at).toDateString();
                  const previousDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
                  const showDateLabel = currentDate !== previousDate;

                  return (
                    <View key={message.id}>
                      {/* Date Label */}
                      {showDateLabel && (
                        <View style={styles.dateLabelContainer}>
                          <View style={[styles.dateLabelBadge, { backgroundColor: colors.isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }]}>
                            <Text style={[styles.dateLabelText, { color: colors.isDark ? "#E0E0E0" : "#54656F" }]}>
                              {new Date(message.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* System Message */}
                      {isSystemMessage ? (
                        <View style={styles.systemMessageContainer}>
                          <View style={[styles.systemMessageBadge, { backgroundColor: colors.isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)" }]}>
                            <Text style={[styles.systemMessageText, { color: colors.isDark ? "#E0E0E0" : "#54656F" }]}>
                              {message.content}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        /* Regular Message */
                        <View
                          style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}
                        >
                          <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
                            {!isOwnMessage && (
                              <Text style={[styles.messageSender, { color: "#00A884" }]}>
                                {(message as any).user?.username}
                              </Text>
                            )}
                            <View
                              style={[
                                styles.messageBubble,
                                isOwnMessage
                                  ? styles.ownMessageBubble
                                  : { backgroundColor: colors.isDark ? "#1F2C33" : "#FFFFFF" },
                              ]}
                            >
                              <Text style={[styles.messageText, { color: isOwnMessage ? "#FFFFFF" : colors.isDark ? "#E9EDEF" : "#111B21" }]}>
                                {message.content}
                              </Text>
                              <View style={styles.messageFooter}>
                                <Text style={[styles.messageTime, { color: isOwnMessage ? "rgba(255,255,255,0.6)" : colors.isDark ? "rgba(233,237,239,0.6)" : "rgba(17,27,33,0.5)" }]}>
                                  {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F0F2F5" }]}>
              {/* Plus Button */}
              <TouchableOpacity 
                style={styles.plusButton}
                onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
                activeOpacity={0.7}
              >
                <Plus size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Input Field */}
              <View style={[styles.inputWrapper, { backgroundColor: colors.isDark ? "#2A3942" : "#FFFFFF" }]}>
                <TextInput
                  style={[
                    styles.messageInput,
                    { color: colors.text },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholder="Type a message"
                  placeholderTextColor={colors.textSecondary}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={500}
                />
              </View>

              {/* Emoji Button */}
              <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
                <Smile size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Mic/Send Button */}
              {messageText.trim() ? (
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: "#00A884" }]}
                  onPress={handleSendMessage}
                  disabled={isSending}
                  activeOpacity={0.8}
                >
                  <Send size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micButton} activeOpacity={0.8}>
                  <Mic size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {/* Attachment Menu */}
              {showAttachmentMenu && (
                <View style={[styles.attachmentMenu, { backgroundColor: colors.isDark ? "#2A2A2A" : "#FFFFFF" }]}>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => setShowAttachmentMenu(false)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentIcon, { backgroundColor: "#5561C5" }]}>
                      <File size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentText, { color: colors.text }]}>File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => setShowAttachmentMenu(false)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentIcon, { backgroundColor: "#007AFF" }]}>
                      <ImageIcon size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentText, { color: colors.text }]}>Photos & videos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => setShowAttachmentMenu(false)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentIcon, { backgroundColor: "#FF9500" }]}>
                      <Users size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentText, { color: colors.text }]}>Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => setShowAttachmentMenu(false)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentIcon, { backgroundColor: "#FFB800" }]}>
                      <Target size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentText, { color: colors.text }]}>Poll</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.attachmentMenuItem}
                    onPress={() => setShowAttachmentMenu(false)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentIcon, { backgroundColor: "#FF3B30" }]}>
                      <MessageCircle size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentText, { color: colors.text }]}>Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Objectives Content */}
        {activeTab === "objectives" && (
          <ScrollView 
            style={[styles.goalsContainer, { backgroundColor: colors.isDark ? "#0A0A0A" : "#F0F2F5" }]}
            contentContainerStyle={styles.goalsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.goalsHeader}>
              <Text style={[styles.goalsTitle, { color: colors.text }]}>Group Objectives</Text>
              <Text style={[styles.goalsSubtitle, { color: colors.textSecondary }]}>
                Track everyone's progress and stay accountable together
              </Text>
            </View>

            {memberProgress.map((member) => (
              <View 
                key={member.id} 
                style={[styles.goalCard, { 
                  backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF",
                  borderColor: colors.isDark ? "#2A2A2A" : "#E5E7EB"
                }]}
              >
                {/* Member Header */}
                <View style={styles.goalCardHeader}>
                  <View style={styles.goalMemberInfo}>
                    <View style={[styles.goalAvatar, { backgroundColor: "#00A884" }]}>
                      <Text style={styles.goalAvatarText}>
                        {member.username?.charAt(0).toUpperCase() || "U"}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.goalMemberName, { color: colors.text }]}>
                        {member.username}
                      </Text>
                      <Text style={[styles.goalMemberStats, { color: colors.textSecondary }]}>
                        {member.tasksCompletedToday} tasks today
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.goalProgressBadge, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F3F4F6" }]}>
                    <Text style={[styles.goalProgressText, { color: "#00A884" }]}>
                      {member.tasksCompletedThisWeek} this week
                    </Text>
                  </View>
                </View>

                {/* Objectives List */}
                <View style={styles.goalsListContainer}>
                  {member.goals && member.goals.length > 0 ? (
                    member.goals.map((goal, index) => (
                      <View key={index} style={styles.goalsListItem}>
                        <View style={[styles.goalCheckbox, goal.todayCheckedIn && styles.goalCheckboxCompleted]}>
                          {goal.todayCheckedIn && <CheckCircle2 size={16} color="#00A884" />}
                        </View>
                        <View style={styles.goalItemContent}>
                          <Text style={[styles.goalItemTitle, { color: colors.text }, goal.todayCheckedIn && styles.goalItemCompleted]}>
                            {goal.title}
                          </Text>
                          <Text style={[styles.goalItemDescription, { color: colors.textSecondary }]}>
                            {goal.current_streak} day streak 🔥 • {goal.frequency}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noGoalsText, { color: colors.textSecondary }]}>
                      No objectives set yet
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {memberProgress.length === 0 && (
              <View style={styles.emptyGoals}>
                <View style={[styles.emptyGoalsIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                  <Target size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyGoalsTitle, { color: colors.text }]}>No objectives yet</Text>
                <Text style={[styles.emptyGoalsText, { color: colors.textSecondary }]}>
                  Members haven't set their objectives yet
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Group Info Sidebar */}
        {showGroupInfo && (
          <View style={[styles.groupInfoSidebar, { backgroundColor: colors.background, borderLeftColor: colors.border }]}>
            {/* Sidebar Header */}
            <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sidebarTitle, { color: colors.text }]}>Group Info</Text>
              <TouchableOpacity onPress={() => setShowGroupInfo(false)} style={styles.closeSidebarButton}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {/* Group Description Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
                  {currentGroup.description || "No description available for this group."}
                </Text>
              </View>

              {/* Files Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Files</Text>
                
                <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F9F9F9" }]}>
                  <View style={styles.fileItemLeft}>
                    <ImageIcon size={16} color={colors.textSecondary} />
                    <Text style={[styles.fileItemText, { color: colors.text }]}>265 photos</Text>
                  </View>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F9F9F9" }]}>
                  <View style={styles.fileItemLeft}>
                    <Video size={16} color={colors.textSecondary} />
                    <Text style={[styles.fileItemText, { color: colors.text }]}>13 videos</Text>
                  </View>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F9F9F9" }]}>
                  <View style={styles.fileItemLeft}>
                    <File size={16} color={colors.textSecondary} />
                    <Text style={[styles.fileItemText, { color: colors.text }]}>378 files</Text>
                  </View>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F9F9F9" }]}>
                  <View style={styles.fileItemLeft}>
                    <Music size={16} color={colors.textSecondary} />
                    <Text style={[styles.fileItemText, { color: colors.text }]}>21 audio files</Text>
                  </View>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.fileItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F9F9F9" }]}>
                  <View style={styles.fileItemLeft}>
                    <Link size={16} color={colors.textSecondary} />
                    <Text style={[styles.fileItemText, { color: colors.text }]}>45 shared links</Text>
                  </View>
                  <ChevronLeft size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
              </View>

              {/* Members Section */}
              <View style={styles.sidebarSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{currentGroup.member_count} members</Text>
                  <TouchableOpacity onPress={() => setShowGroupInfo(false)}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {currentGroup.members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    {member.avatar_url ? (
                      <Image source={{ uri: member.avatar_url }} style={styles.memberItemAvatar} />
                    ) : (
                      <View style={[styles.memberItemAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                        <Text style={[styles.memberItemInitial, { color: colors.text }]}>
                          {member.username?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberItemInfo}>
                      <Text style={[styles.memberItemName, { color: colors.text }]}>{member.username}</Text>
                      {member.role === "admin" && (
                        <Text style={[styles.memberItemRole, { color: colors.textSecondary }]}>admin</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Objectives Tab Content */}
        {activeTab === "objectives" && (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.tabContentPadding}
            showsVerticalScrollIndicator={false}
          >
            {isLoadingProgress ? (
              <View style={styles.loadingContainer}>
                <RefreshCw size={24} color={colors.textSecondary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 8 }]}>
                  Loading progress...
                </Text>
              </View>
            ) : memberProgress.length === 0 || memberProgress.every(m => m.goals.length === 0) ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                  <Target size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No shared objectives yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Members can share their objectives with this group to track progress together
                </Text>
              </View>
            ) : (
              <View style={styles.progressList}>
                {memberProgress.map((member) => (
                  <View 
                    key={member.id} 
                    style={[styles.memberProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    {/* Member Header */}
                    <View style={styles.memberProgressHeader}>
                      <View style={[styles.memberAvatarLarge, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                        <Text style={[styles.memberInitialLarge, { color: colors.text }]}>
                          {member.username?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                      <View style={styles.memberProgressInfo}>
                        <Text style={[styles.memberProgressName, { color: colors.text }]}>
                          {member.username}
                          {member.id === user?.id && (
                            <Text style={{ color: colors.textSecondary }}> (You)</Text>
                          )}
                        </Text>
                        <View style={styles.memberStats}>
                          <View style={styles.memberStatItem}>
                            <CheckCircle2 size={14} color="#22C55E" />
                            <Text style={[styles.memberStatText, { color: colors.textSecondary }]}>
                              {member.tasksCompletedToday} today
                            </Text>
                          </View>
                          <View style={styles.memberStatItem}>
                            <TrendingUp size={14} color="#3B82F6" />
                            <Text style={[styles.memberStatText, { color: colors.textSecondary }]}>
                              {member.tasksCompletedThisWeek} this week
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Member Objectives */}
                    {member.goals.length > 0 ? (
                      <View style={styles.memberGoalsList}>
                        {member.goals.map((goal) => (
                          <View 
                            key={goal.id} 
                            style={[styles.goalItem, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}
                          >
                            <View style={styles.goalHeader}>
                              <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={1}>
                                {goal.title}
                              </Text>
                              {goal.todayCheckedIn && (
                                <View style={[styles.checkedInBadge, { backgroundColor: "#22C55E20" }]}>
                                  <CheckCircle2 size={12} color="#22C55E" />
                                  <Text style={styles.checkedInText}>Done</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.goalStats}>
                              <View style={styles.goalStatItem}>
                                <Flame size={14} color="#F59E0B" />
                                <Text style={[styles.goalStatText, { color: colors.textSecondary }]}>
                                  {goal.current_streak} day streak
                                </Text>
                              </View>
                              <View style={[styles.categoryBadge, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E5E5" }]}>
                                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                                  {goal.category}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.noGoalsMessage, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
                        <Text style={[styles.noGoalsText, { color: colors.textSecondary }]}>
                          No objectives shared with this group yet
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {activeTab === "members" && (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
            <View style={styles.membersGrid}>
              {currentGroup.members.map((member) => (
                <View 
                  key={member.id} 
                  style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  {/* Avatar and Name Row */}
                  <View style={styles.memberCardHeader}>
                    <View style={[styles.memberCardAvatar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E5E5" }]}>
                      <Text style={[styles.memberCardInitial, { color: colors.text }]}>
                        {member.username?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={styles.memberCardInfo}>
                      <Text style={[styles.memberCardName, { color: colors.text }]} numberOfLines={1}>
                        {member.username}
                      </Text>
                      <Text style={[styles.memberCardRole, { color: colors.textSecondary }]}>
                        {member.role === "admin" ? "Admin" : "Member"}
                      </Text>
                    </View>
                  </View>

                  {/* Username */}
                  <View style={styles.memberCardDetail}>
                    <Text style={[styles.memberCardLabel, { color: colors.textSecondary }]}>Username</Text>
                    <Text style={[styles.memberCardValue, { color: colors.text }]} numberOfLines={1}>
                      @{member.username}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.memberCardActions}>
                    <TouchableOpacity 
                      style={[styles.memberCardButton, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.memberCardButtonText, { color: colors.text }]}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.memberCardButtonFilled, { backgroundColor: colors.isDark ? "#2A2A2A" : "#1A1A1A" }]}
                    >
                      <Text style={styles.memberCardButtonFilledText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
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
    position: "relative",
  },
  chatBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
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
  dateLabelContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateLabelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  systemMessageContainer: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  systemMessageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  systemMessageText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
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
  messageContainer: {
    maxWidth: "75%",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: "#005C4B",
    borderTopRightRadius: 2,
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
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "relative",
  },
  plusButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  inputIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messageInput: {
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 0,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00A884",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  micButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentMenu: {
    position: "absolute",
    bottom: 60,
    left: 12,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  attachmentMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentText: {
    fontSize: 15,
    fontWeight: "500",
  },
  progressList: {
    gap: 16,
  },
  memberProgressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  memberProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  memberProgressInfo: {
    flex: 1,
  },
  memberProgressName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  memberStats: {
    flexDirection: "row",
    gap: 16,
  },
  memberStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  memberStatText: {
    fontSize: 13,
  },
  memberGoalsList: {
    gap: 8,
  },
  goalItem: {
    padding: 12,
    borderRadius: 10,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22C55E",
  },
  goalStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalStatText: {
    fontSize: 13,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  noGoalsMessage: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  noGoalsText: {
    fontSize: 14,
  },
  membersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  memberCard: {
    width: "48%",
    minWidth: 160,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexGrow: 1,
  },
  memberCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  memberCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  memberCardInitial: {
    fontSize: 20,
    fontWeight: "600",
  },
  memberCardInfo: {
    flex: 1,
  },
  memberCardName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  memberCardRole: {
    fontSize: 13,
  },
  memberCardDetail: {
    marginBottom: 16,
  },
  memberCardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  memberCardValue: {
    fontSize: 14,
  },
  memberCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  memberCardButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  memberCardButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  memberCardButtonFilled: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  memberCardButtonFilledText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  groupAvatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  chatHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chatHeaderText: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  groupInfoSidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    borderLeftWidth: 1,
    zIndex: 10,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeSidebarButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fileItemText: {
    fontSize: 14,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  memberItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberItemInitial: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  memberItemRole: {
    fontSize: 12,
  },
  groupsSidebar: {
    width: 280,
    borderRightWidth: 1,
  },
  groupsSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sidebarBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  groupsList: {
    flex: 1,
  },
  groupListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  groupListItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: "#FAB300",
  },
  groupListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  groupListAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  groupListInfo: {
    flex: 1,
  },
  groupListName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupListMessage: {
    fontSize: 13,
  },
  groupListTime: {
    marginLeft: 8,
  },
  groupListTimeText: {
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
  },
  // Tab Navigation Styles
  tabNavigation: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    position: "relative",
  },
  tabButtonActive: {
    // Active state handled by indicator
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#00A884",
    borderRadius: 2,
  },
  headerActionButtonActive: {
    backgroundColor: "rgba(0, 168, 132, 0.1)",
  },
  // Objectives View Styles
  goalsContainer: {
    flex: 1,
  },
  goalsContent: {
    padding: 20,
  },
  goalsHeader: {
    marginBottom: 24,
  },
  goalsTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  goalsSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  goalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  goalMemberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  goalAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  goalMemberName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  goalMemberStats: {
    fontSize: 13,
  },
  goalProgressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: "700",
  },
  goalsListContainer: {
    gap: 12,
  },
  goalsListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  goalCheckboxCompleted: {
    backgroundColor: "#D1FAE5",
    borderColor: "#00A884",
  },
  goalItemContent: {
    flex: 1,
  },
  goalItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 20,
  },
  goalItemCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  goalItemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  noGoalsText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  emptyGoals: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyGoalsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyGoalsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyGoalsText: {
    fontSize: 15,
    textAlign: "center",
  },
});
