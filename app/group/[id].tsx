import { useEffect, useState, useRef, useCallback } from "react";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Send, Copy, Users, ChevronLeft, Target, MessageCircle, UserPlus, Flame, CheckCircle2, TrendingUp, RefreshCw, Search, Phone, MoreVertical, Paperclip, Mic, Smile, X, Image as ImageIcon, Video, File, Music, Link, Plus } from "lucide-react-native";
import { Avatar, Spreadsheet } from "@/components/ui";
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
    sheets,
    events,
    isLoading,
    isLoadingProgress,
    isLoadingSheets,
    isLoadingEvents,
    fetchGroup,
    fetchGroups,
    fetchMessages,
    fetchMemberProgress,
    fetchSheets,
    fetchEvents,
    createSheet,
    updateSheet,
    deleteSheet,
    createEvent,
    deleteEvent,
    sendMessage,
    subscribeToMessages,
    clearGroupData,
  } = useGroupStore();

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupsList, setShowGroupsList] = useState(true);
  const [groupsSearch, setGroupsSearch] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  // Objectives/Tasks state
  const [objectivesView, setObjectivesView] = useState<"tasks" | "overview" | "calendar" | "sheet">("tasks");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [selectedMemberForTask, setSelectedMemberForTask] = useState<string | null>(null);
  // Sheet state - now using Supabase via groupStore
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  // Calendar/Event state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"video_call" | "voice_call" | "focus_session" | "meeting" | "other">("meeting");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventParticipants, setNewEventParticipants] = useState<string[]>([]);
  const [participantMode, setParticipantMode] = useState<"all" | "specific">("all");
  const scrollViewRef = useRef<ScrollView>(null);

  // Load all sheet files for this group from database
  useEffect(() => {
    if (id) {
      fetchSheets(id);
      fetchEvents(id);
    }
  }, [id, fetchSheets, fetchEvents]);

  // Create new sheet - now uses Supabase
  const handleCreateNewSheet = useCallback(async (name: string) => {
    console.log("handleCreateNewSheet called with:", name, "id:", id, "user:", user?.id);
    
    if (!id || !user?.id || !name.trim()) {
      console.log("Early return - missing data:", { id, userId: user?.id, name: name.trim() });
      return;
    }
    
    // Check if a sheet with this name already exists
    const trimmedName = name.trim().toLowerCase();
    console.log("Checking for existing sheet with name:", trimmedName, "in sheets:", sheets);
    const existingSheet = sheets.find(
      (sheet: any) => sheet.name.toLowerCase() === trimmedName
    );
    
    if (existingSheet) {
      console.log("Found existing sheet:", existingSheet);
      Alert.alert(
        "Name Already Exists",
        `A spreadsheet named "${name.trim()}" already exists. Please choose a different name.`,
        [{ text: "OK" }]
      );
      return;
    }
    
    console.log("Creating new sheet...");
    const result = await createSheet(id, user.id, name);
    console.log("Create sheet result:", result);
    
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    
    // Open the new sheet
    if (result.sheet) {
      setActiveSheet(result.sheet);
    }
    setShowCreateSheet(false);
    setNewSheetName("");
  }, [id, user?.id, createSheet, sheets]);

  // Open existing sheet
  const openSheet = useCallback((sheet: any) => {
    setActiveSheet(sheet);
  }, []);

  // Close sheet and go back to list
  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  // Save sheet from Spreadsheet component - now uses Supabase
  const handleSaveSheet = useCallback(async (sheetData: any) => {
    if (!activeSheet) return;
    
    const result = await updateSheet(
      activeSheet.id,
      sheetData.cells || {},
      sheetData.columnWidths,
      sheetData.rowHeights
    );
    
    if (result.error) {
      Alert.alert("Error", "Failed to save spreadsheet");
    } else {
      // Update local active sheet state
      setActiveSheet((prev: any) => prev ? { ...prev, cells: sheetData.cells || {} } : null);
    }
  }, [activeSheet, updateSheet]);

  // Delete sheet - now uses Supabase
  const handleDeleteSheet = useCallback(async (sheetId: string) => {
    Alert.alert(
      "Delete Sheet",
      "Are you sure you want to delete this spreadsheet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteSheet(sheetId);
            if (result.error) {
              Alert.alert("Error", result.error);
              return;
            }
            if (activeSheet?.id === sheetId) {
              closeSheet();
            }
          },
        },
      ]
    );
  }, [activeSheet, closeSheet, deleteSheet]);

  // Clear previous group data and fetch new group data when switching groups
  useEffect(() => {
    if (id && user?.id) {
      // Clear previous group data first to show loading state
      clearGroupData();
      setActiveSheet(null);
      
      // Fetch new group data
      fetchGroup(id);
      fetchMessages(id);
      fetchMemberProgress(id);
      fetchSheets(id);
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

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(groupsSearch.toLowerCase())
  );

  // Check if we're loading (for content area only)
  const isContentLoading = !currentGroup || isLoading;

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
          {/* Show loading state in content area only */}
          {isContentLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={[styles.contentLoadingText, { color: colors.text }]}>Loading...</Text>
            </View>
          ) : (
          <>
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

        {/* Objectives Content - Kanban Board */}
        {activeTab === "objectives" && (
          <View style={[styles.kanbanContainer, { backgroundColor: colors.isDark ? "#0D0D0D" : "#F5F5F5" }]}>
            {/* Top Navigation Menu */}
            <View style={[styles.objectivesNav, { backgroundColor: colors.isDark ? "#0D0D0D" : "#F5F5F5", borderBottomColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.objectivesNavContent}
              >
                <TouchableOpacity 
                  style={[styles.objectivesNavItem, objectivesView === "overview" && styles.objectivesNavItemActive]}
                  onPress={() => setObjectivesView("overview")}
                >
                  <Text style={[styles.objectivesNavText, objectivesView === "overview" ? { color: colors.text, fontWeight: "600" } : { color: colors.textSecondary }]}>Overview</Text>
                  {objectivesView === "overview" && <View style={styles.objectivesNavIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.objectivesNavItem, objectivesView === "tasks" && styles.objectivesNavItemActive]}
                  onPress={() => setObjectivesView("tasks")}
                >
                  <Text style={[styles.objectivesNavText, objectivesView === "tasks" ? { color: colors.text, fontWeight: "600" } : { color: colors.textSecondary }]}>Tasks</Text>
                  {objectivesView === "tasks" && <View style={styles.objectivesNavIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.objectivesNavItem, objectivesView === "calendar" && styles.objectivesNavItemActive]}
                  onPress={() => setObjectivesView("calendar")}
                >
                  <Text style={[styles.objectivesNavText, objectivesView === "calendar" ? { color: colors.text, fontWeight: "600" } : { color: colors.textSecondary }]}>Calendar</Text>
                  {objectivesView === "calendar" && <View style={styles.objectivesNavIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.objectivesNavItem, objectivesView === "sheet" && styles.objectivesNavItemActive]}
                  onPress={() => setObjectivesView("sheet")}
                >
                  <Text style={[styles.objectivesNavText, objectivesView === "sheet" ? { color: colors.text, fontWeight: "600" } : { color: colors.textSecondary }]}>Sheet</Text>
                  {objectivesView === "sheet" && <View style={styles.objectivesNavIndicator} />}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Tasks View - Kanban Board */}
            {objectivesView === "tasks" && (
              <ScrollView 
                horizontal
                style={styles.kanbanScrollView}
                contentContainerStyle={styles.kanbanScrollContent}
                showsHorizontalScrollIndicator={false}
              >
                {/* Member Columns - Each column represents one member's tasks for the day */}
                {memberProgress.map((member, index) => (
                  <View key={member.id} style={styles.kanbanColumn}>
                    <View style={styles.kanbanColumnHeaderCompact}>
                      <Text style={[styles.kanbanColumnTitle, { color: colors.text }]}>{member.username}</Text>
                      <Text style={[styles.kanbanColumnCount, { color: colors.textSecondary }]}>{member.goals?.length || 0} Tasks</Text>
                      <TouchableOpacity 
                        style={styles.kanbanColumnAction}
                        onPress={() => {
                          setSelectedMemberForTask(member.id);
                          setShowAddTaskModal(true);
                        }}
                      >
                        <Plus size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.kanbanColumnAction}>
                        <MoreVertical size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.kanbanColumnContent} showsVerticalScrollIndicator={false}>
                      {member.goals && member.goals.length > 0 ? (
                        member.goals.map((goal, goalIndex) => (
                          <TouchableOpacity 
                            key={goal.id} 
                            style={[styles.kanbanCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}
                            onPress={() => {
                              setSelectedTask({ ...goal, memberUsername: member.username, memberIndex: index });
                              setShowTaskModal(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.kanbanCardTags}>
                              <View style={[styles.kanbanTag, { backgroundColor: goal.todayCheckedIn ? "#10B981" : "#7C3AED" }]}>
                                <Text style={styles.kanbanTagText}>{goal.category || "Task"}</Text>
                              </View>
                              {goal.todayCheckedIn && (
                                <View style={[styles.kanbanTag, { backgroundColor: "#10B981" }]}>
                                  <Text style={styles.kanbanTagText}>Done</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.kanbanCardTitle, { color: colors.text }]}>{goal.title}</Text>
                            <View style={styles.kanbanCardFooter}>
                              <View style={styles.kanbanCardAvatars}>
                                <View style={[styles.kanbanAvatar, { backgroundColor: ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"][index % 5] }]}>
                                  <Text style={styles.kanbanAvatarText}>{member.username?.charAt(0).toUpperCase() || "U"}</Text>
                                </View>
                              </View>
                              <View style={styles.kanbanCardMeta}>
                                <View style={styles.kanbanCardStats}>
                                  <Flame size={12} color="#F59E0B" />
                                  <Text style={[styles.kanbanCardStatText, { color: colors.textSecondary }]}>{goal.current_streak}</Text>
                                </View>
                                <Text style={[styles.kanbanCardTimeText, { color: colors.textSecondary }]}>{goal.frequency}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={[styles.kanbanCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF", alignItems: "center", paddingVertical: 24 }]}>
                          <Text style={[styles.kanbanCardTitle, { color: colors.textSecondary, textAlign: "center" }]}>No tasks for today</Text>
                          <TouchableOpacity 
                            style={[styles.addTaskButton, { marginTop: 12 }]}
                            onPress={() => {
                              setSelectedMemberForTask(member.id);
                              setShowAddTaskModal(true);
                            }}
                          >
                            <Plus size={16} color="#7C3AED" />
                            <Text style={styles.addTaskButtonText}>Add Task</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                ))}

                {/* Empty state if no members */}
                {memberProgress.length === 0 && (
                  <View style={styles.emptyKanban}>
                    <Text style={[styles.emptyKanbanText, { color: colors.textSecondary }]}>No members with tasks yet</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Overview View */}
            {objectivesView === "overview" && (
              <ScrollView style={styles.overviewContainer} contentContainerStyle={styles.overviewContent}>
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#7C3AED20" }]}>
                      <Target size={24} color="#7C3AED" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {memberProgress.reduce((acc, m) => acc + (m.goals?.length || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Tasks</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#10B98120" }]}>
                      <CheckCircle2 size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {memberProgress.reduce((acc, m) => acc + (m.goals?.filter(g => g.todayCheckedIn).length || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Today</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#F59E0B20" }]}>
                      <Flame size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {Math.max(...memberProgress.flatMap(m => m.goals?.map(g => g.current_streak) || [0]), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#3B82F620" }]}>
                      <Users size={24} color="#3B82F6" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{memberProgress.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Members</Text>
                  </View>
                </View>

                {/* Member Progress */}
                <Text style={[styles.overviewSectionTitle, { color: colors.text }]}>Member Progress</Text>
                {memberProgress.map((member, index) => {
                  const completedTasks = member.goals?.filter(g => g.todayCheckedIn).length || 0;
                  const totalTasks = member.goals?.length || 0;
                  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                  
                  return (
                    <View key={member.id} style={[styles.memberProgressRow, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                      <View style={[styles.memberProgressAvatar, { backgroundColor: ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"][index % 5] }]}>
                        <Text style={styles.memberProgressAvatarText}>{member.username?.charAt(0).toUpperCase() || "U"}</Text>
                      </View>
                      <View style={styles.memberProgressInfo}>
                        <Text style={[styles.memberProgressName, { color: colors.text }]}>{member.username}</Text>
                        <View style={[styles.memberProgressBar, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}>
                          <View style={[styles.memberProgressFill, { width: `${progress}%`, backgroundColor: "#7C3AED" }]} />
                        </View>
                      </View>
                      <Text style={[styles.memberProgressPercent, { color: "#7C3AED" }]}>{Math.round(progress)}%</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Calendar View - Redesigned */}
            {objectivesView === "calendar" && (
              <View style={styles.calendarViewContainer}>
                {/* Left Side - Calendar */}
                <View style={styles.calendarLeftPanel}>
                  {/* Header */}
                  <View style={styles.calendarHeader}>
                    <View>
                      <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'short' })}' {selectedDate.getFullYear()}
                      </Text>
                      <Text style={[styles.calendarSubtitle, { color: colors.textSecondary }]}>
                        Here all your planned events. You will find information for each event as well you can planned new one.
                      </Text>
                    </View>
                    <View style={styles.calendarHeaderActions}>
                      <TouchableOpacity 
                        onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                        style={styles.calendarNavButton}
                      >
                        <Text style={{ color: colors.textSecondary }}>{"<"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.calendarNavDot}>
                        <Text style={{ color: colors.textSecondary }}>•</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                        style={styles.calendarNavButton}
                      >
                        <Text style={{ color: colors.textSecondary }}>{">"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGridNew}>
                    {/* Day Headers */}
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => (
                      <Text key={day} style={[styles.calendarDayHeaderNew, { color: day === "FRI" ? "#E85D04" : colors.textSecondary }]}>{day}</Text>
                    ))}
                    {/* Calendar Days */}
                    {(() => {
                      const year = selectedDate.getFullYear();
                      const month = selectedDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const daysInPrevMonth = new Date(year, month, 0).getDate();
                      const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
                      const today = new Date();
                      const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
                      const todayDate = today.getDate();
                      
                      const days = [];
                      // Previous month days
                      for (let i = startOffset - 1; i >= 0; i--) {
                        days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrev: true });
                      }
                      // Current month days
                      for (let i = 1; i <= daysInMonth; i++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                        const hasEvents = events.some(e => e.start_time.startsWith(dateStr));
                        days.push({ day: i, isCurrentMonth: true, isToday: isCurrentMonth && i === todayDate, hasEvents, dateStr });
                      }
                      // Next month days
                      const remaining = 42 - days.length;
                      for (let i = 1; i <= remaining; i++) {
                        days.push({ day: i, isCurrentMonth: false, isNext: true });
                      }
                      
                      return days.map((d, idx) => {
                        const isSelected = d.isCurrentMonth && d.day === selectedDate.getDate();
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.calendarDayNew,
                              isSelected && styles.calendarDaySelected,
                            ]}
                            onPress={() => {
                              if (d.isCurrentMonth) {
                                setSelectedDate(new Date(year, month, d.day));
                              }
                            }}
                          >
                            <Text style={[
                              styles.calendarDayTextNew,
                              { color: d.isCurrentMonth ? (isSelected ? "#E85D04" : colors.text) : colors.textSecondary },
                              isSelected && { fontWeight: "700" }
                            ]}>
                              {d.day}
                            </Text>
                            {d.hasEvents && (
                              <View style={styles.calendarEventDots}>
                                <View style={[styles.calendarEventDotSmall, { backgroundColor: "#E85D04" }]} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>
                </View>

                {/* Right Side - Events List */}
                <View style={[styles.calendarRightPanel, { backgroundColor: colors.isDark ? "#0A0A0A" : "#FAFAFA" }]}>
                  {/* Date Header */}
                  <View style={styles.eventDateHeader}>
                    <Text style={[styles.eventDateText, { color: colors.textSecondary }]}>
                      {selectedDate.toLocaleDateString('en-US', { day: '2-digit' })}'{selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}, {selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                    </Text>
                    <TouchableOpacity 
                      style={styles.addEventButton}
                      onPress={() => setShowCreateEvent(true)}
                    >
                      <Text style={styles.addEventButtonText}>Add event</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Events List */}
                  <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                    {isLoadingEvents ? (
                      <View style={styles.eventsLoading}>
                        <ActivityIndicator size="small" color="#E85D04" />
                        <Text style={[styles.eventsLoadingText, { color: colors.textSecondary }]}>Loading events...</Text>
                      </View>
                    ) : (
                      (() => {
                        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                        const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
                        
                        if (dayEvents.length === 0) {
                          return (
                            <View style={styles.noEventsContainer}>
                              <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>No events scheduled for this day</Text>
                              <TouchableOpacity 
                                style={styles.createEventLink}
                                onPress={() => setShowCreateEvent(true)}
                              >
                                <Text style={styles.createEventLinkText}>+ Create an event</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                        
                        return dayEvents.map((event, idx) => {
                          const startTime = new Date(event.start_time);
                          const endTime = new Date(event.end_time);
                          const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                          const isVideoCall = event.event_type === "video_call";
                          const isHighlighted = event.event_type === "video_call" || event.event_type === "focus_session";
                          
                          return (
                            <TouchableOpacity 
                              key={event.id} 
                              style={[
                                styles.eventCard,
                                isHighlighted && styles.eventCardHighlighted,
                                { backgroundColor: isHighlighted ? "#1A1A1A" : (colors.isDark ? "#1A1A1A" : "#FFFFFF") }
                              ]}
                              onLongPress={() => {
                                Alert.alert(
                                  "Delete Event",
                                  `Are you sure you want to delete "${event.title}"?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete", style: "destructive", onPress: () => deleteEvent(event.id) }
                                  ]
                                );
                              }}
                            >
                              <Text style={[styles.eventTime, isHighlighted && { color: "#E85D04" }]}>{timeStr}</Text>
                              <Text style={[styles.eventTitle, { color: isHighlighted ? "#FFFFFF" : colors.text }]}>{event.title}</Text>
                              {event.location && (
                                <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>{event.location}</Text>
                              )}
                              {isVideoCall && (
                                <Text style={[styles.eventType, { color: colors.textSecondary }]}>Video call</Text>
                              )}
                              {/* Participant Avatars */}
                              <View style={styles.eventParticipants}>
                                {(event.participant_details && event.participant_details.length > 0 
                                  ? event.participant_details 
                                  : currentGroup?.members || []
                                ).slice(0, 4).map((p: any, pIdx: number) => (
                                  <View 
                                    key={p.id} 
                                    style={[
                                      styles.eventParticipantAvatar,
                                      { marginLeft: pIdx > 0 ? -8 : 0, zIndex: 10 - pIdx }
                                    ]}
                                  >
                                    {p.avatar_url ? (
                                      <Image source={{ uri: p.avatar_url }} style={styles.eventParticipantImage} />
                                    ) : (
                                      <View style={[styles.eventParticipantPlaceholder, { backgroundColor: "#7C3AED" }]}>
                                        <Text style={styles.eventParticipantInitial}>{p.username?.[0]?.toUpperCase() || "?"}</Text>
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            </TouchableOpacity>
                          );
                        });
                      })()
                    )}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Sheet View */}
            {objectivesView === "sheet" && (
              <View style={styles.sheetContainer}>
                {/* Show file list if no active sheet */}
                {!activeSheet ? (
                  <View style={styles.sheetFileListContainer}>
                    {/* Header */}
                    <View style={styles.sheetListHeader}>
                      <Text style={[styles.sheetListTitle, { color: colors.text }]}>My documents</Text>
                      <TouchableOpacity onPress={() => setShowCreateSheet(true)}>
                        <Text style={styles.sheetShowAllLink}>+ New spreadsheet</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.sheetFilterTabs}>
                      <TouchableOpacity style={[styles.sheetFilterTab, styles.sheetFilterTabActive]}>
                        <View style={[styles.sheetFilterDot, { backgroundColor: "#1A73E8" }]} />
                        <Text style={[styles.sheetFilterTabText, { color: colors.text }]}>Recent</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.sheetFilterTab}>
                        <Users size={14} color={colors.textSecondary} />
                        <Text style={[styles.sheetFilterTabText, { color: colors.textSecondary }]}>Shared</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      <View style={[styles.sheetSearchBox, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                        <Search size={16} color={colors.textSecondary} />
                        <TextInput
                          style={[styles.sheetSearchInput, { color: colors.text }]}
                          placeholder="Filter by name or person"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>

                    {/* Table Header */}
                    <View style={[styles.sheetTableHeader, { borderBottomColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}>
                      <Text style={[styles.sheetTableHeaderText, styles.sheetTableNameCol, { color: colors.textSecondary }]}>Name</Text>
                      <Text style={[styles.sheetTableHeaderText, styles.sheetTableOpenedCol, { color: colors.textSecondary }]}>Opened</Text>
                      <Text style={[styles.sheetTableHeaderText, styles.sheetTableOwnerCol, { color: colors.textSecondary }]}>Owner</Text>
                    </View>

                    {/* Loading state */}
                    {isLoadingSheets && (
                      <View style={styles.sheetLoadingContainer}>
                        <ActivityIndicator size="small" color="#7C3AED" />
                        <Text style={[styles.sheetLoadingText, { color: colors.textSecondary }]}>Loading sheets...</Text>
                      </View>
                    )}

                    {/* Empty state */}
                    {!isLoadingSheets && sheets.length === 0 && (
                      <View style={styles.sheetEmptyState}>
                        <View style={[styles.sheetEmptyIcon, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                          <File size={48} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.sheetEmptyTitle, { color: colors.text }]}>No spreadsheets yet</Text>
                        <Text style={[styles.sheetEmptyText, { color: colors.textSecondary }]}>
                          Create a new spreadsheet to start tracking data with your group
                        </Text>
                        <TouchableOpacity 
                          style={[styles.sheetEmptyButton, { backgroundColor: "#7C3AED" }]}
                          onPress={() => setShowCreateSheet(true)}
                        >
                          <Plus size={20} color="#FFFFFF" />
                          <Text style={styles.sheetEmptyButtonText}>Create Spreadsheet</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* File list - Table Style */}
                    {!isLoadingSheets && sheets.length > 0 && (
                      <ScrollView style={styles.sheetTableList} showsVerticalScrollIndicator={false}>
                        {sheets.map((file: any) => {
                          // Find owner from memberProgress or currentGroup members
                          const owner = currentGroup?.members?.find((m: any) => m.id === file.created_by);
                          const ownerName = owner?.username || "Unknown";
                          
                          // Format date like "Nov 12" or "Oct 24"
                          const openedDate = new Date(file.updated_at);
                          const formattedDate = openedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          
                          return (
                            <TouchableOpacity
                              key={file.id}
                              style={[styles.sheetTableRow, { borderBottomColor: colors.isDark ? "#2A2A2A" : "#F0F0F0" }]}
                              onPress={() => openSheet(file)}
                              onLongPress={() => handleDeleteSheet(file.id)}
                            >
                              <View style={[styles.sheetTableNameCol, styles.sheetTableNameCell]}>
                                <View style={[styles.sheetDocIcon, { backgroundColor: "#4285F420" }]}>
                                  <File size={18} color="#4285F4" />
                                </View>
                                <View style={styles.sheetDocInfo}>
                                  <Text style={[styles.sheetDocName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                                  <Text style={[styles.sheetDocSubtext, { color: colors.textSecondary }]}>My Files</Text>
                                </View>
                              </View>
                              <Text style={[styles.sheetTableOpenedCol, styles.sheetTableCellText, { color: colors.textSecondary }]}>
                                {formattedDate}
                              </Text>
                              <Text style={[styles.sheetTableOwnerCol, styles.sheetTableCellText, { color: colors.textSecondary }]}>
                                {ownerName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  /* Sheet Editor - Using Spreadsheet Component */
                  <Spreadsheet
                    initialData={{ cells: activeSheet.cells, columnWidths: [], rowHeights: [], frozenRows: 0, frozenCols: 0, hiddenRows: new Set(), hiddenCols: new Set(), mergedCells: [] }}
                    sheetName={activeSheet.name}
                    onClose={closeSheet}
                    onSave={handleSaveSheet}
                    isDark={colors.isDark}
                    colors={colors}
                  />
                )}

                {/* Create Sheet Modal */}
                {showCreateSheet && (
                  <View style={styles.modalOverlay}>
                    <View style={[styles.createSheetModal, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                      <Text style={[styles.createSheetModalTitle, { color: colors.text }]}>New Spreadsheet</Text>
                      <TextInput
                        style={[styles.createSheetInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB" }]}
                        value={newSheetName}
                        onChangeText={setNewSheetName}
                        placeholder="Enter spreadsheet name..."
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                      />
                      <View style={styles.createSheetModalActions}>
                        <TouchableOpacity 
                          style={[styles.createSheetModalButton, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                          onPress={() => {
                            setShowCreateSheet(false);
                            setNewSheetName("");
                          }}
                        >
                          <Text style={[styles.createSheetModalButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.createSheetModalButton, { backgroundColor: "#7C3AED" }]}
                          onPress={() => handleCreateNewSheet(newSheetName)}
                        >
                          <Text style={[styles.createSheetModalButtonText, { color: "#FFFFFF" }]}>Create</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Create Event Modal - Global */}
        {showCreateEvent && (
          <View style={styles.modalOverlay}>
            <View style={[styles.createEventModal, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
              <View style={styles.createEventModalHeader}>
                <Text style={[styles.createEventModalTitle, { color: colors.text }]}>New Event</Text>
                <TouchableOpacity onPress={() => {
                  setShowCreateEvent(false);
                  setNewEventTitle("");
                  setNewEventType("meeting");
                  setNewEventStartTime("");
                  setNewEventEndTime("");
                  setNewEventLocation("");
                  setNewEventParticipants([]);
                  setParticipantMode("all");
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.createEventModalContent} showsVerticalScrollIndicator={false}>
                {/* Event Title */}
                <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Event Title</Text>
                <TextInput
                  style={[styles.createEventInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB" }]}
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                  placeholder="Enter event title..."
                  placeholderTextColor={colors.textSecondary}
                />

                {/* Event Type */}
                <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Event Type</Text>
                <View style={styles.eventTypeOptions}>
                  {[
                    { value: "video_call", label: "Video Call", icon: "📹" },
                    { value: "voice_call", label: "Voice Call", icon: "📞" },
                    { value: "focus_session", label: "Focus Session", icon: "🎯" },
                    { value: "meeting", label: "Meeting", icon: "👥" },
                    { value: "other", label: "Other", icon: "📌" },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.eventTypeOption,
                        newEventType === type.value && styles.eventTypeOptionActive,
                        { backgroundColor: newEventType === type.value ? "#E85D0420" : (colors.isDark ? "#2A2A2A" : "#F5F5F5") }
                      ]}
                      onPress={() => setNewEventType(type.value as any)}
                    >
                      <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                      <Text style={[styles.eventTypeLabel, { color: newEventType === type.value ? "#E85D04" : colors.text }]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date & Time */}
                <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Date</Text>
                <View style={[styles.createEventDateDisplay, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                  <Text style={[styles.createEventDateText, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Start Time</Text>
                    <TextInput
                      style={[styles.createEventInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB" }]}
                      value={newEventStartTime}
                      onChangeText={setNewEventStartTime}
                      placeholder="e.g. 10:00 AM"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>End Time</Text>
                    <TextInput
                      style={[styles.createEventInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB" }]}
                      value={newEventEndTime}
                      onChangeText={setNewEventEndTime}
                      placeholder="e.g. 11:00 AM"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                {/* Location */}
                <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Location (optional)</Text>
                <TextInput
                  style={[styles.createEventInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", borderColor: colors.isDark ? "#3A3A3A" : "#E5E7EB" }]}
                  value={newEventLocation}
                  onChangeText={setNewEventLocation}
                  placeholder="Enter location or meeting link..."
                  placeholderTextColor={colors.textSecondary}
                />

                {/* Participants */}
                <Text style={[styles.createEventLabel, { color: colors.textSecondary }]}>Participants</Text>
                <View style={styles.participantModeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.participantModeOption,
                      participantMode === "all" && styles.participantModeOptionActive,
                      { backgroundColor: participantMode === "all" ? "#E85D0420" : (colors.isDark ? "#2A2A2A" : "#F5F5F5") }
                    ]}
                    onPress={() => {
                      setParticipantMode("all");
                      setNewEventParticipants([]);
                    }}
                  >
                    <Text style={[styles.participantModeText, { color: participantMode === "all" ? "#E85D04" : colors.text }]}>All Members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.participantModeOption,
                      participantMode === "specific" && styles.participantModeOptionActive,
                      { backgroundColor: participantMode === "specific" ? "#E85D0420" : (colors.isDark ? "#2A2A2A" : "#F5F5F5") }
                    ]}
                    onPress={() => setParticipantMode("specific")}
                  >
                    <Text style={[styles.participantModeText, { color: participantMode === "specific" ? "#E85D04" : colors.text }]}>Specific Members</Text>
                  </TouchableOpacity>
                </View>

                {/* Member Selection */}
                {participantMode === "specific" && (
                  <View style={styles.memberSelectionList}>
                    {currentGroup?.members?.map((member: any) => {
                      const isSelected = newEventParticipants.includes(member.id);
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.memberSelectionItem,
                            isSelected && styles.memberSelectionItemActive,
                            { backgroundColor: isSelected ? "#E85D0420" : (colors.isDark ? "#2A2A2A" : "#F5F5F5") }
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setNewEventParticipants(newEventParticipants.filter(pid => pid !== member.id));
                            } else {
                              setNewEventParticipants([...newEventParticipants, member.id]);
                            }
                          }}
                        >
                          {member.avatar_url ? (
                            <Image source={{ uri: member.avatar_url }} style={styles.memberSelectionAvatar} />
                          ) : (
                            <View style={[styles.memberSelectionAvatarPlaceholder, { backgroundColor: "#7C3AED" }]}>
                              <Text style={styles.memberSelectionAvatarText}>{member.username?.[0]?.toUpperCase() || "?"}</Text>
                            </View>
                          )}
                          <Text style={[styles.memberSelectionName, { color: isSelected ? "#E85D04" : colors.text }]}>{member.username}</Text>
                          {isSelected && (
                            <View style={styles.memberSelectionCheck}>
                              <Text style={{ color: "#E85D04" }}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* Actions */}
              <View style={styles.createEventModalActions}>
                <TouchableOpacity 
                  style={[styles.createEventModalButton, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                  onPress={() => {
                    setShowCreateEvent(false);
                    setNewEventTitle("");
                    setNewEventType("meeting");
                    setNewEventStartTime("");
                    setNewEventEndTime("");
                    setNewEventLocation("");
                    setNewEventParticipants([]);
                    setParticipantMode("all");
                  }}
                >
                  <Text style={[styles.createEventModalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createEventModalButton, { backgroundColor: "#E85D04" }]}
                  onPress={async () => {
                    if (!newEventTitle.trim() || !newEventStartTime || !newEventEndTime) {
                      Alert.alert("Missing Info", "Please fill in the event title and times.");
                      return;
                    }
                    
                    // Parse times
                    const parseTime = (timeStr: string) => {
                      const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
                      if (!match) return null;
                      let hours = parseInt(match[1]);
                      const minutes = parseInt(match[2] || "0");
                      const period = match[3]?.toUpperCase();
                      if (period === "PM" && hours !== 12) hours += 12;
                      if (period === "AM" && hours === 12) hours = 0;
                      return { hours, minutes };
                    };
                    
                    const startParsed = parseTime(newEventStartTime);
                    const endParsed = parseTime(newEventEndTime);
                    
                    if (!startParsed || !endParsed) {
                      Alert.alert("Invalid Time", "Please enter valid times (e.g. 10:00 AM)");
                      return;
                    }
                    
                    const startDate = new Date(selectedDate);
                    startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                    
                    const endDate = new Date(selectedDate);
                    endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                    
                    if (!id || !user?.id) return;
                    
                    const result = await createEvent(id, user.id, {
                      title: newEventTitle.trim(),
                      event_type: newEventType,
                      start_time: startDate.toISOString(),
                      end_time: endDate.toISOString(),
                      location: newEventLocation || undefined,
                      participants: participantMode === "all" ? [] : newEventParticipants,
                    });
                    
                    if (result.error) {
                      Alert.alert("Error", result.error);
                    } else {
                      setShowCreateEvent(false);
                      setNewEventTitle("");
                      setNewEventType("meeting");
                      setNewEventStartTime("");
                      setNewEventEndTime("");
                      setNewEventLocation("");
                      setNewEventParticipants([]);
                      setParticipantMode("all");
                    }
                  }}
                >
                  <Text style={[styles.createEventModalButtonText, { color: "#FFFFFF" }]}>Create Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Task Detail Modal */}
        {showTaskModal && selectedTask && (
          <View style={styles.modalOverlay}>
            <View style={[styles.taskModal, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
              <View style={styles.taskModalHeader}>
                <Text style={[styles.taskModalTitle, { color: colors.text }]}>Task Details</Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.taskModalContent}>
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Title</Text>
                  <Text style={[styles.taskModalValue, { color: colors.text }]}>{selectedTask.title}</Text>
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Category</Text>
                  <View style={[styles.kanbanTag, { backgroundColor: "#7C3AED", alignSelf: "flex-start" }]}>
                    <Text style={styles.kanbanTagText}>{selectedTask.category || "Task"}</Text>
                  </View>
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Assigned To</Text>
                  <View style={styles.taskModalAssignee}>
                    <View style={[styles.kanbanAvatar, { backgroundColor: ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"][selectedTask.memberIndex % 5] }]}>
                      <Text style={styles.kanbanAvatarText}>{selectedTask.memberUsername?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.taskModalValue, { color: colors.text }]}>{selectedTask.memberUsername}</Text>
                  </View>
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={[styles.listStatusBadge, { backgroundColor: selectedTask.todayCheckedIn ? "#10B98120" : "#F59E0B20", alignSelf: "flex-start" }]}>
                    <Text style={[styles.listStatusText, { color: selectedTask.todayCheckedIn ? "#10B981" : "#F59E0B" }]}>
                      {selectedTask.todayCheckedIn ? "Completed Today" : "Pending"}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Streak</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Flame size={20} color="#F59E0B" />
                    <Text style={[styles.taskModalValue, { color: colors.text }]}>{selectedTask.current_streak} day streak</Text>
                  </View>
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Frequency</Text>
                  <Text style={[styles.taskModalValue, { color: colors.text }]}>{selectedTask.frequency}</Text>
                </View>
              </ScrollView>
              
              <View style={styles.taskModalActions}>
                <TouchableOpacity style={[styles.taskModalButton, { backgroundColor: "#7C3AED" }]}>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.taskModalButtonText}>Mark Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.taskModal, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFFFFF" }]}>
              <View style={styles.taskModalHeader}>
                <Text style={[styles.taskModalTitle, { color: colors.text }]}>Add New Task</Text>
                <TouchableOpacity onPress={() => {
                  setShowAddTaskModal(false);
                  setNewTaskTitle("");
                  setNewTaskCategory("");
                }}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.taskModalContent}>
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Task Title</Text>
                  <TextInput
                    style={[styles.taskModalInput, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", color: colors.text }]}
                    placeholder="Enter task title..."
                    placeholderTextColor={colors.textSecondary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                  />
                </View>
                
                <View style={styles.taskModalSection}>
                  <Text style={[styles.taskModalLabel, { color: colors.textSecondary }]}>Category</Text>
                  <TextInput
                    style={[styles.taskModalInput, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5", color: colors.text }]}
                    placeholder="e.g., Work, Health, Learning..."
                    placeholderTextColor={colors.textSecondary}
                    value={newTaskCategory}
                    onChangeText={setNewTaskCategory}
                  />
                </View>
              </View>
              
              <View style={styles.taskModalActions}>
                <TouchableOpacity 
                  style={[styles.taskModalButton, { backgroundColor: colors.isDark ? "#2A2A2A" : "#E5E7EB" }]}
                  onPress={() => {
                    setShowAddTaskModal(false);
                    setNewTaskTitle("");
                    setNewTaskCategory("");
                  }}
                >
                  <Text style={[styles.taskModalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.taskModalButton, { backgroundColor: "#7C3AED" }]}
                  onPress={() => {
                    // TODO: Implement actual task creation
                    setShowAddTaskModal(false);
                    setNewTaskTitle("");
                    setNewTaskCategory("");
                  }}
                >
                  <Plus size={18} color="#FFFFFF" />
                  <Text style={styles.taskModalButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
        </>
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
  tabIndicator2: {
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
  noGoalsText2: {
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
  // Kanban Board Styles
  kanbanContainer: {
    flex: 1,
  },
  objectivesNav: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  objectivesNavContent: {
    paddingVertical: 12,
    gap: 32,
  },
  objectivesNavItem: {
    paddingVertical: 8,
    position: "relative",
  },
  objectivesNavItemActive: {
    // Active state handled by indicator
  },
  objectivesNavText: {
    fontSize: 15,
    fontWeight: "500",
  },
  objectivesNavTextActive: {
    fontWeight: "600",
  },
  objectivesNavIndicator: {
    position: "absolute",
    bottom: -12,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },
  kanbanScrollView: {
    flex: 1,
  },
  kanbanScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  kanbanColumn: {
    width: 320,
    marginRight: 16,
  },
  kanbanColumnHeader: {
    marginBottom: 16,
  },
  kanbanColumnHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  kanbanColumnTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  kanbanColumnCount: {
    fontSize: 13,
    flex: 1,
  },
  kanbanColumnActions: {
    flexDirection: "row",
    gap: 8,
  },
  kanbanColumnAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  kanbanColumnContent: {
    flex: 1,
  },
  kanbanCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  kanbanCardTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  kanbanTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  kanbanTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  kanbanCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 12,
  },
  kanbanCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kanbanCardAvatars: {
    flexDirection: "row",
    marginLeft: -4,
  },
  kanbanAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  kanbanAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  kanbanCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kanbanCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kanbanCardStatText: {
    fontSize: 12,
    marginRight: 8,
  },
  kanbanCardTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  kanbanCardTimeText: {
    fontSize: 12,
  },
  kanbanCardProgress: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kanbanCardProgressText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  kanbanCardEstimate: {
    fontSize: 12,
    marginTop: 8,
  },
  kanbanCardDate: {
    fontSize: 12,
    marginTop: 4,
  },
  kanbanProgressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  kanbanProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  addColumnButton: {
    width: 200,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
  },
  addColumnText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  memberColumnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberColumnAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  memberColumnAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderStyle: "dashed",
  },
  addTaskButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#7C3AED",
  },
  emptyKanban: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyKanbanText: {
    fontSize: 15,
    textAlign: "center",
  },
  // Overview View Styles
  overviewContainer: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  overviewSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  memberProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  memberProgressAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberProgressAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  memberProgressInfo2: {
    flex: 1,
  },
  memberProgressName2: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  memberProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  memberProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  memberProgressPercent: {
    fontSize: 15,
    fontWeight: "600",
  },
  // List View Styles
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  listHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listTaskTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  listTaskCategory: {
    fontSize: 12,
  },
  listAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listAvatarText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listAssignee: {
    fontSize: 13,
  },
  listStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  listStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listStreak: {
    fontSize: 13,
  },
  // Calendar View Styles
  calendarContainer: {
    flex: 1,
  },
  calendarContent: {
    padding: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayHeader: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 8,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  calendarDayToday: {
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
    marginTop: 2,
  },
  calendarEventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  calendarEvent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  calendarEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarEventText: {
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  taskModal: {
    width: "90%",
    maxWidth: 480,
    borderRadius: 16,
    maxHeight: "80%",
  },
  taskModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  taskModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  taskModalContent: {
    padding: 20,
  },
  taskModalSection: {
    marginBottom: 20,
  },
  taskModalLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  taskModalValue: {
    fontSize: 16,
  },
  taskModalAssignee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskModalInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  taskModalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  taskModalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  taskModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Sheet View Styles
  sheetContainer: {
    flex: 1,
  },
  sheetToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetNameInput: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 16,
  },
  sheetToolbarActions: {
    flexDirection: "row",
    gap: 8,
  },
  sheetToolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sheetToolbarButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  formulaBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  formulaCellRef: {
    fontSize: 13,
    fontWeight: "600",
    width: 40,
  },
  formulaInput: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
  },
  sheetScrollContainer: {
    flex: 1,
  },
  sheetHeaderRow: {
    flexDirection: "row",
  },
  sheetRow: {
    flexDirection: "row",
  },
  sheetCornerCell: {
    width: 50,
    height: 32,
  },
  sheetRowHeader: {
    width: 50,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sheetColumnHeader: {
    width: 100,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sheetHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sheetCell: {
    width: 100,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  sheetCellText: {
    fontSize: 13,
  },
  sheetCellInput: {
    fontSize: 13,
    padding: 0,
    margin: 0,
    height: "100%",
  },
  sheetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  sheetFooterText: {
    fontSize: 12,
  },
  // Sheet File List Styles - Google Docs Style
  sheetFileListContainer: {
    flex: 1,
    padding: 20,
  },
  sheetListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetListTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  sheetShowAllLink: {
    fontSize: 14,
    color: "#1A73E8",
    fontWeight: "500",
  },
  sheetFilterTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sheetFilterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sheetFilterTabActive: {
    borderColor: "#1A73E8",
    backgroundColor: "#E8F0FE",
  },
  sheetFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetFilterTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sheetSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 200,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  sheetTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetTableHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  sheetTableNameCol: {
    flex: 1,
    minWidth: 200,
  },
  sheetTableOpenedCol: {
    width: 100,
  },
  sheetTableOwnerCol: {
    width: 120,
  },
  sheetTableList: {
    flex: 1,
  },
  sheetTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetTableNameCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetDocIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDocInfo: {
    flex: 1,
  },
  sheetDocName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  sheetDocSubtext: {
    fontSize: 12,
  },
  sheetTableCellText: {
    fontSize: 13,
  },
  // Legacy styles kept for compatibility
  sheetFileList: {
    flex: 1,
  },
  sheetFileListContent: {
    padding: 20,
  },
  sheetFileListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sheetFileListTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  createSheetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createSheetButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sheetLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    flexDirection: "row",
    gap: 12,
  },
  sheetLoadingText: {
    fontSize: 14,
  },
  sheetEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  sheetEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  sheetEmptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  sheetEmptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sheetEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  sheetEmptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sheetFilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  sheetFileCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  sheetFileIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sheetFileName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  sheetFileDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  sheetFileSize: {
    fontSize: 11,
  },
  sheetEditorContainer: {
    flex: 1,
  },
  sheetBackButton: {
    padding: 4,
    marginRight: 8,
  },
  sheetNameDisplay: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  formulaCellRefBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 50,
    alignItems: "center",
  },
  createSheetModal: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  createSheetModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  createSheetInput: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  createSheetModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  createSheetModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createSheetModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  contentLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentLoadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  // Calendar View Styles - Redesigned
  calendarViewContainer: {
    flex: 1,
    flexDirection: "row",
  },
  calendarLeftPanel: {
    flex: 1,
    padding: 24,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  calendarMonthTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  calendarSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  calendarHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavDot: {
    padding: 4,
  },
  calendarGridNew: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayHeaderNew: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 12,
  },
  calendarDayNew: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  calendarDaySelected: {
    // Selected state styling handled inline
  },
  calendarDayTextNew: {
    fontSize: 15,
    fontWeight: "500",
  },
  calendarEventDots: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
  },
  calendarEventDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarRightPanel: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: "#E5E7EB",
  },
  eventDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  eventDateText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  addEventButton: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addEventButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventsLoading: {
    alignItems: "center",
    paddingTop: 40,
  },
  eventsLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  noEventsContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  noEventsText: {
    fontSize: 14,
    marginBottom: 16,
  },
  createEventLink: {
    padding: 8,
  },
  createEventLinkText: {
    color: "#E85D04",
    fontSize: 14,
    fontWeight: "500",
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventCardHighlighted: {
    borderColor: "#333333",
  },
  eventTime: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666666",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 13,
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    marginBottom: 12,
  },
  eventParticipants: {
    flexDirection: "row",
    marginTop: 8,
  },
  eventParticipantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  eventParticipantImage: {
    width: "100%",
    height: "100%",
  },
  eventParticipantPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  eventParticipantInitial: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  // Create Event Modal Styles
  createEventModal: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  createEventModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  createEventModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  createEventModalContent: {
    padding: 20,
  },
  createEventLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  createEventInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  createEventDateDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createEventDateText: {
    fontSize: 15,
  },
  timeInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  eventTypeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  eventTypeOptionActive: {
    borderColor: "#E85D04",
  },
  eventTypeIcon: {
    fontSize: 16,
  },
  eventTypeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  participantModeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  participantModeOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  participantModeOptionActive: {
    borderColor: "#E85D04",
  },
  participantModeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  memberSelectionList: {
    marginTop: 12,
    gap: 8,
  },
  memberSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  memberSelectionItemActive: {
    borderWidth: 1,
    borderColor: "#E85D04",
  },
  memberSelectionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberSelectionAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberSelectionAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  memberSelectionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  memberSelectionCheck: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  createEventModalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  createEventModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createEventModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
