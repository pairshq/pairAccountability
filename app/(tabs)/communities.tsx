import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { 
  Globe, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video,
  Mic,
  Eye,
  X,
  Calendar,
  Target,
  Zap,
  Coffee,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore, FocusSessionWithDetails, SessionType, SessionMode, SessionStep } from "@/stores/sessionStore";

type TabType = "all" | "featured" | "community" | "my_sessions";
type FilterType = "all" | "focus" | "recharge" | "accountability" | "coworking";

export default function CommunitiesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const {
    sessions,
    mySessions,
    currentSession,
    isLoading,
    selectedDate,
    setSelectedDate,
    fetchSessions,
    fetchMySessions,
    fetchSession,
    createSession,
    registerForSession,
    unregisterFromSession,
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<FocusSessionWithDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create session form state
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [newSessionType, setNewSessionType] = useState<SessionType>("focus");
  const [newSessionMode, setNewSessionMode] = useState<SessionMode>("virtual_presence");
  const [newSessionDuration, setNewSessionDuration] = useState("25");
  const [newSessionTime, setNewSessionTime] = useState("10:00 AM");
  const [newSessionMaxParticipants, setNewSessionMaxParticipants] = useState("20");
  const [newSessionHasWaitingRoom, setNewSessionHasWaitingRoom] = useState(false);
  const [newSessionRequiresIntention, setNewSessionRequiresIntention] = useState(true);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    if (activeTab === "my_sessions" && user?.id) {
      fetchMySessions(user.id);
    } else {
      const filterType = activeFilter === "all" ? undefined : activeFilter;
      fetchSessions(selectedDate, filterType as any);
    }
  }, [activeTab, activeFilter, selectedDate, user?.id]);

  useEffect(() => {
    if (selectedSession?.id) {
      fetchSession(selectedSession.id, user?.id);
    }
  }, [selectedSession?.id, user?.id]);

  const handleRefresh = useCallback(() => {
    if (activeTab === "my_sessions" && user?.id) {
      fetchMySessions(user.id);
    } else {
      fetchSessions(selectedDate);
    }
  }, [activeTab, selectedDate, user?.id]);

  const handleRegister = async () => {
    if (!selectedSession || !user?.id) return;
    const result = await registerForSession(selectedSession.id, user.id);
    if (result.error) {
      Alert.alert("Error", result.error);
    } else {
      Alert.alert("Success", "You've registered for this session!");
      handleRefresh();
    }
  };

  const handleUnregister = async () => {
    if (!selectedSession || !user?.id) return;
    Alert.alert("Unregister", "Are you sure you want to unregister?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unregister",
        style: "destructive",
        onPress: async () => {
          const result = await unregisterFromSession(selectedSession.id, user.id);
          if (result.error) Alert.alert("Error", result.error);
          else { handleRefresh(); setSelectedSession(null); }
        },
      },
    ]);
  };

  const handleCreateSession = async () => {
    if (!user?.id || !newSessionTitle.trim()) {
      Alert.alert("Error", "Please fill in the session title");
      return;
    }

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

    const timeParsed = parseTime(newSessionTime);
    if (!timeParsed) {
      Alert.alert("Error", "Invalid time format");
      return;
    }

    const startDate = new Date(selectedDate);
    startDate.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
    const duration = parseInt(newSessionDuration) || 25;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const structure: SessionStep[] = [
      { name: "Welcome & Intros", duration: 1 },
      { name: "Share Intentions", duration: 3 },
      { name: "Deep Work", duration: duration - 5 },
      { name: "Celebrate & Farewell", duration: 1 },
    ];

    const result = await createSession(user.id, {
      title: newSessionTitle.trim(),
      description: newSessionDescription.trim() || undefined,
      session_type: newSessionType,
      session_mode: newSessionMode,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration,
      max_participants: parseInt(newSessionMaxParticipants) || 20,
      has_waiting_room: newSessionHasWaitingRoom,
      requires_intention: newSessionRequiresIntention,
      structure,
      tags: [],
    });

    if (result.error) {
      Alert.alert("Error", result.error);
    } else {
      setShowCreateModal(false);
      setNewSessionTitle("");
      setNewSessionDescription("");
      handleRefresh();
      Alert.alert("Success", "Session created!");
    }
  };

  const displayedSessions = activeTab === "my_sessions" ? mySessions : sessions;
  const filteredSessions = displayedSessions.filter((s) =>
    !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTypeIcon = (type: SessionType) => {
    switch (type) {
      case "focus": return <Target size={16} color="#10B981" />;
      case "recharge": return <Coffee size={16} color="#F59E0B" />;
      case "accountability": return <Users size={16} color="#8B5CF6" />;
      default: return <Globe size={16} color="#3B82F6" />;
    }
  };

  const getModeIcon = (mode: SessionMode) => {
    switch (mode) {
      case "video": return <Video size={14} color="#6B7280" />;
      case "audio": return <Mic size={14} color="#6B7280" />;
      default: return <Eye size={14} color="#6B7280" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation */}
      <View style={[styles.topNav, { borderBottomColor: colors.border }]}>
        <View style={styles.tabsContainer}>
          {[
            { key: "all", label: "All" },
            { key: "featured", label: "★ Featured" },
            { key: "community", label: "Community" },
            { key: "my_sessions", label: "My sessions" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? "#10B981" : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createButtonText}>Create session</Text>
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Panel */}
        <View style={[styles.leftPanel, { borderRightColor: colors.border }]}>
          {/* Date Picker */}
          <View style={styles.datePicker}>
            <TouchableOpacity style={styles.dateNavBtn} onPress={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 7);
              setSelectedDate(d);
            }}>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContent}>
              {dates.map((date, i) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity key={i} style={styles.dateItem} onPress={() => setSelectedDate(date)}>
                    <Text style={[styles.dateDay, { color: isSelected ? "#10B981" : colors.textSecondary }]}>
                      {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <Text style={[styles.dateDayName, { color: isSelected ? "#10B981" : colors.text }]}>
                      {isToday ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    {isSelected && <View style={styles.dateIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.dateNavBtn} onPress={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 7);
              setSelectedDate(d);
            }}>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sessions List */}
          <ScrollView style={styles.sessionsList} contentContainerStyle={styles.sessionsContent}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 48 }} />
            ) : filteredSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Globe size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No sessions found</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {activeTab === "my_sessions" ? "Register for sessions to see them here." : "Create a session to get started!"}
                </Text>
              </View>
            ) : (
              filteredSessions.map((session) => {
                const isLive = session.status === "live";
                const isSelected = selectedSession?.id === session.id;
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.sessionCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF" },
                      isSelected && styles.sessionCardSelected, isLive && styles.sessionCardLive]}
                    onPress={() => setSelectedSession(session)}
                  >
                    {isLive && (
                      <View style={styles.liveRow}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Live now</Text>
                      </View>
                    )}
                    <View style={styles.sessionHeader}>
                      <View style={styles.hostAvatar}>
                        {session.host?.avatar_url ? (
                          <Image source={{ uri: session.host.avatar_url }} style={styles.hostImg} />
                        ) : (
                          <View style={[styles.hostPlaceholder, { backgroundColor: "#7C3AED" }]}>
                            <Text style={styles.hostInitial}>{session.host?.username?.[0]?.toUpperCase() || "?"}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.sessionInfo}>
                        <View style={styles.titleRow}>
                          {getTypeIcon(session.session_type)}
                          <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{session.title}</Text>
                        </View>
                        <Text style={[styles.sessionHost, { color: colors.textSecondary }]}>with {session.host?.username || "Unknown"}</Text>
                      </View>
                      {getModeIcon(session.session_mode)}
                    </View>
                    <View style={styles.sessionFooter}>
                      <View style={styles.timeRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(session.start_time)} ({formatDuration(session.duration)})</Text>
                      </View>
                      <View style={styles.participantsRow}>
                        <Users size={14} color={colors.textSecondary} />
                        <Text style={[styles.participantsText, { color: colors.textSecondary }]}>{session.participant_count || 0}/{session.max_participants}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Right Panel - Details */}
        <View style={[styles.rightPanel, { backgroundColor: colors.isDark ? "#0A0A0A" : "#FAFAFA" }]}>
          {selectedSession ? (
            <ScrollView style={styles.detailsScroll}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsTitleRow}>
                  {getTypeIcon(selectedSession.session_type)}
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>{selectedSession.title}</Text>
                </View>
                <View style={styles.detailsDate}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={[styles.detailsDateText, { color: colors.textSecondary }]}>
                    {new Date(selectedSession.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                {selectedSession.description && (
                  <Text style={[styles.detailsDesc, { color: colors.textSecondary }]}>{selectedSession.description}</Text>
                )}
              </View>

              {/* Structure Progress */}
              {selectedSession.structure?.length > 0 && (
                <View style={styles.progressBar}>
                  {selectedSession.structure.map((step, i) => {
                    const total = selectedSession.structure.reduce((a, s) => a + s.duration, 0);
                    const width = (step.duration / total) * 100;
                    const clrs = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];
                    return <View key={i} style={[styles.progressSeg, { width: `${width}%`, backgroundColor: clrs[i % clrs.length] }]} />;
                  })}
                </View>
              )}

              {/* How it works */}
              <View style={styles.howSection}>
                <Text style={[styles.howTitle, { color: colors.text }]}>How it works</Text>
                {selectedSession.structure?.map((step, i) => (
                  <View key={i} style={styles.howItem}>
                    <Text style={[styles.howDur, { color: colors.textSecondary }]}>{step.duration} min</Text>
                    <Text style={[styles.howName, { color: colors.text }]}>• {step.name}</Text>
                  </View>
                ))}
                <View style={styles.features}>
                  <View style={styles.featureRow}>
                    <Users size={14} color="#10B981" />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{selectedSession.max_participants} max</Text>
                  </View>
                  {selectedSession.session_mode === "video" && (
                    <View style={styles.featureRow}>
                      <Video size={14} color="#10B981" />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>Camera recommended</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Host */}
              <View style={styles.hostSection}>
                <View style={styles.hostAvatarLg}>
                  {selectedSession.host?.avatar_url ? (
                    <Image source={{ uri: selectedSession.host.avatar_url }} style={styles.hostImgLg} />
                  ) : (
                    <View style={[styles.hostPlaceholderLg, { backgroundColor: "#7C3AED" }]}>
                      <Text style={styles.hostInitialLg}>{selectedSession.host?.username?.[0]?.toUpperCase() || "?"}</Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text style={[styles.hostNameLg, { color: colors.text }]}>{selectedSession.host?.username}</Text>
                  <Text style={[styles.hostRoleLg, { color: colors.textSecondary }]}>★ Session host</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {currentSession?.is_registered || selectedSession.host_id === user?.id ? (
                  <>
                    <TouchableOpacity 
                      style={styles.joinBtn}
                      onPress={() => router.push(`/session/${selectedSession.id}`)}
                    >
                      <Text style={styles.joinBtnText}>{selectedSession.status === "live" ? "Join now" : "Enter Session"}</Text>
                    </TouchableOpacity>
                    {selectedSession.host_id !== user?.id && (
                      <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleUnregister}>
                        <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Unregister</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <TouchableOpacity style={styles.joinBtn} onPress={handleRegister}>
                    <Text style={styles.joinBtnText}>Register</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noSelection}>
              <Globe size={64} color={colors.textSecondary} />
              <Text style={[styles.noSelectionText, { color: colors.textSecondary }]}>Select a session to see details</Text>
            </View>
          )}
        </View>
      </View>

      {/* Create Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Session</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                value={newSessionTitle}
                onChangeText={setNewSessionTitle}
                placeholder="e.g., 1h Deep Focus"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                value={newSessionDescription}
                onChangeText={setNewSessionDescription}
                placeholder="What's this session about?"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.typeRow}>
                {(["focus", "recharge", "accountability", "coworking"] as SessionType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, newSessionType === t && styles.typeBtnActive]}
                    onPress={() => setNewSessionType(t)}
                  >
                    <Text style={[styles.typeBtnText, { color: newSessionType === t ? "#10B981" : colors.text }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mode</Text>
              <View style={styles.typeRow}>
                {(["virtual_presence", "video", "audio"] as SessionMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.typeBtn, newSessionMode === m && styles.typeBtnActive]}
                    onPress={() => setNewSessionMode(m)}
                  >
                    <Text style={[styles.typeBtnText, { color: newSessionMode === m ? "#10B981" : colors.text }]}>{m.replace("_", " ")}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (min)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                    value={newSessionDuration}
                    onChangeText={setNewSessionDuration}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Max Participants</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                    value={newSessionMaxParticipants}
                    onChangeText={setNewSessionMaxParticipants}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Start Time</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                value={newSessionTime}
                onChangeText={setNewSessionTime}
                placeholder="e.g., 10:00 AM"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity style={styles.checkRow} onPress={() => setNewSessionHasWaitingRoom(!newSessionHasWaitingRoom)}>
                <View style={[styles.checkbox, newSessionHasWaitingRoom && styles.checkboxActive]}>
                  {newSessionHasWaitingRoom && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>Enable waiting room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkRow} onPress={() => setNewSessionRequiresIntention(!newSessionRequiresIntention)}>
                <View style={[styles.checkbox, newSessionRequiresIntention && styles.checkboxActive]}>
                  {newSessionRequiresIntention && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>Require focus intention</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateSession}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1 },
  tabsContainer: { flexDirection: "row", gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "transparent" },
  tabActive: { borderColor: "#10B981" },
  tabText: { fontSize: 14, fontWeight: "500" },
  createButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#10B981", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  createButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  mainContent: { flex: 1, flexDirection: "row" },
  leftPanel: { flex: 1, borderRightWidth: 1 },
  datePicker: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  dateNavBtn: { padding: 8 },
  datesContent: { paddingHorizontal: 8, gap: 8 },
  dateItem: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, minWidth: 70 },
  dateDay: { fontSize: 13, fontWeight: "500" },
  dateDayName: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  dateIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#10B981", marginTop: 4 },
  sessionsList: { flex: 1 },
  sessionsContent: { padding: 16 },
  emptyState: { alignItems: "center", paddingTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: "center", marginTop: 8 },
  sessionCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "transparent" },
  sessionCardSelected: { borderColor: "#10B981" },
  sessionCardLive: { borderColor: "#10B981", borderWidth: 2 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  liveText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  sessionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  hostAvatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  hostImg: { width: "100%", height: "100%" },
  hostPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  hostInitial: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  sessionInfo: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sessionTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  sessionHost: { fontSize: 13, marginTop: 2 },
  sessionFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB20" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 12 },
  participantsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  participantsText: { fontSize: 12 },
  rightPanel: { width: 380 },
  detailsScroll: { flex: 1, padding: 24 },
  detailsHeader: { marginBottom: 24 },
  detailsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  detailsTitle: { fontSize: 24, fontWeight: "700" },
  detailsDate: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  detailsDateText: { fontSize: 14 },
  detailsDesc: { fontSize: 14, lineHeight: 20 },
  progressBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 24 },
  progressSeg: { height: "100%" },
  howSection: { marginBottom: 24 },
  howTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  howItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  howDur: { fontSize: 13, width: 50 },
  howName: { fontSize: 14 },
  features: { gap: 8, marginTop: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13 },
  hostSection: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB", marginBottom: 16 },
  hostAvatarLg: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  hostImgLg: { width: "100%", height: "100%" },
  hostPlaceholderLg: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  hostInitialLg: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  hostNameLg: { fontSize: 16, fontWeight: "600" },
  hostRoleLg: { fontSize: 13, marginTop: 2 },
  actions: { gap: 12 },
  joinBtn: { backgroundColor: "#1A1A1A", paddingVertical: 16, borderRadius: 10, alignItems: "center" },
  joinBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  secondaryBtn: { paddingVertical: 14, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: "500" },
  noSelection: { flex: 1, alignItems: "center", justifyContent: "center" },
  noSelectionText: { fontSize: 16, marginTop: 16 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modal: { width: "90%", maxWidth: 500, maxHeight: "85%", borderRadius: 16, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 8, marginTop: 16 },
  input: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F5F5F5" },
  typeBtnActive: { backgroundColor: "#10B98120", borderWidth: 1, borderColor: "#10B981" },
  typeBtnText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  checkText: { fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", backgroundColor: "#10B981" },
  createBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
});
