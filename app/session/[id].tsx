import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { PairLoader } from "@/components/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Users,
  Clock,
  Play,
  Pause,
  LogOut,
  Target,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Eye,
  Check,
  Edit3,
  PhoneOff,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore, SessionStep } from "@/stores/sessionStore";
import { WebRTCManager } from "@/lib/webrtc";

export default function SessionRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();

  const {
    currentSession,
    isLoadingSession,
    fetchSession,
    joinSession,
    leaveSession,
    startSession,
    endSession,
    updateParticipantIntention,
    subscribeToSession,
  } = useSessionStore();

  const [intention, setIntention] = useState("");
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isInSession, setIsInSession] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Video/Audio call state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Load session and subscribe to updates
  useEffect(() => {
    if (id) {
      fetchSession(id, user?.id);
      const unsubscribe = subscribeToSession(id);
      return () => unsubscribe();
    }
  }, [id, user?.id]);

  // Check if user is in session
  useEffect(() => {
    if (currentSession && user?.id) {
      const participant = currentSession.participants?.find(
        (p) => p.user_id === user.id && (p.status === "active" || p.status === "waiting")
      );
      setIsInSession(!!participant);
      if (participant?.intention) {
        setIntention(participant.intention);
      }
    }
  }, [currentSession, user?.id]);

  // Timer logic
  useEffect(() => {
    if (currentSession?.status === "live" && currentSession.structure?.length > 0) {
      const sessionStart = new Date(currentSession.start_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStart) / 1000);

      // Calculate current phase based on elapsed time
      let totalSeconds = 0;
      let phaseIndex = 0;
      let phaseTimeRemaining = 0;

      for (let i = 0; i < currentSession.structure.length; i++) {
        const phaseDuration = currentSession.structure[i].duration * 60;
        if (elapsed < totalSeconds + phaseDuration) {
          phaseIndex = i;
          phaseTimeRemaining = totalSeconds + phaseDuration - elapsed;
          break;
        }
        totalSeconds += phaseDuration;
        if (i === currentSession.structure.length - 1) {
          phaseIndex = i;
          phaseTimeRemaining = 0;
        }
      }

      setCurrentPhaseIndex(phaseIndex);
      setTimeRemaining(phaseTimeRemaining);

      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Move to next phase
            setCurrentPhaseIndex((prevPhase) => {
              const nextPhase = prevPhase + 1;
              if (nextPhase < (currentSession.structure?.length || 0)) {
                const nextPhaseDuration = currentSession.structure![nextPhase].duration * 60;
                setTimeRemaining(nextPhaseDuration);
                return nextPhase;
              }
              return prevPhase;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentSession?.status, currentSession?.start_time, currentSession?.structure]);

  // Initialize WebRTC when entering session (regardless of live status)
  useEffect(() => {
    const initializeCall = async () => {
      if (!id || !user?.id || !currentSession) return;
      if (currentSession.session_mode === "virtual_presence") return; // No call for virtual presence
      
      // Only initialize on web with WebRTC support
      if (Platform.OS !== "web" || typeof navigator === "undefined" || !navigator.mediaDevices) {
        setCallError("Video/audio calls require a web browser");
        return;
      }

      try {
        const isVideo = currentSession.session_mode === "video";
        
        // Full HD 1080p constraints for maximum clarity
        const hdVideoConstraints = {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: "user",
          aspectRatio: { ideal: 16 / 9 },
        };
        
        const hdAudioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        };
        
        // Get local media stream with HD quality
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? hdVideoConstraints : false,
          audio: hdAudioConstraints,
        });
        setLocalStream(stream);
        
        // Create WebRTC manager for peer connections
        const manager = new WebRTCManager(id, user.id, {
          onLocalStream: () => {},
          onRemoteStream: (oderId, s) => {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(oderId, s);
              return newMap;
            });
          },
          onParticipantLeft: (oderId) => {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.delete(oderId);
              return newMap;
            });
          },
        });

        webrtcRef.current = manager;
        await manager.initialize(isVideo);
      } catch (err) {
        console.error("Error initializing call:", err);
        setCallError("Failed to access camera/microphone");
      }
    };

    initializeCall();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (webrtcRef.current) {
        webrtcRef.current.leave();
      }
    };
  }, [id, user?.id, currentSession?.session_mode]);

  // Video control handlers
  const handleToggleMute = () => {
    if (webrtcRef.current) {
      const muted = webrtcRef.current.toggleMute();
      setIsMuted(muted);
    } else if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const videoOn = webrtcRef.current.toggleVideo();
      setIsVideoOn(videoOn);
    } else if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const setLocalVideoRef = (el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStream) {
      el.srcObject = localStream;
      el.play().catch(console.error);
    }
  };

  const setRemoteVideoRef = (oderId: string, el: HTMLVideoElement | null) => {
    if (el) {
      remoteVideoRefs.current.set(oderId, el);
      const stream = remoteStreams.get(oderId);
      if (stream) {
        el.srcObject = stream;
        el.play().catch(console.error);
      }
    } else {
      remoteVideoRefs.current.delete(oderId);
    }
  };

  const handleJoinSession = async () => {
    if (!id || !user?.id) return;

    if (currentSession?.requires_intention && !intention.trim()) {
      if (typeof window !== 'undefined') {
        window.alert("Please enter what you'll be focusing on during this session.");
      }
      setIsEditingIntention(true);
      return;
    }

    console.log("Joining session:", id, "user:", user.id);
    const result = await joinSession(id, user.id, intention);
    console.log("Join result:", result);
    
    if (result.error) {
      if (typeof window !== 'undefined') {
        window.alert("Error: " + result.error);
      }
    } else {
      setIsInSession(true);
    }
  };

  const handleLeaveSession = async () => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm("Are you sure you want to leave this session?")
      : true;
    
    if (!confirmed) return;
    
    if (!id || !user?.id) return;
    await leaveSession(id, user.id);
    router.replace("/communities");
  };

  const handleStartSession = async () => {
    if (!id) return;
    console.log("Starting session:", id);
    const result = await startSession(id);
    console.log("Start result:", result);
    if (result.error) {
      if (typeof window !== 'undefined') {
        window.alert("Error: " + result.error);
      }
    }
  };

  const handleEndSession = async () => {
    // Using confirm for web compatibility (Alert.alert doesn't work on web)
    const confirmed = typeof window !== 'undefined' 
      ? window.confirm("Are you sure you want to end this session for everyone?")
      : true;
    
    if (!confirmed) return;
    
    if (!id) return;
    console.log("Ending session:", id);
    const result = await endSession(id);
    console.log("End session result:", result);
    if (result.error) {
      console.error("End session error:", result.error);
      if (typeof window !== 'undefined') {
        window.alert("Error: " + result.error);
      }
    } else {
      router.replace("/communities");
    }
  };

  const handleSaveIntention = async () => {
    if (!id || !user?.id) return;
    await updateParticipantIntention(id, user.id, intention);
    setIsEditingIntention(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isHost = currentSession?.host_id === user?.id;
  const isLive = currentSession?.status === "live";
  const currentPhase = currentSession?.structure?.[currentPhaseIndex];
  const activeParticipants = currentSession?.participants?.filter(
    (p) => p.status === "active" || p.status === "waiting"
  ) || [];

  if (isLoadingSession || !currentSession) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <PairLoader size={64} color="#10B981" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading session...</Text>
      </View>
    );
  }

  // Waiting Room View
  if (currentSession.has_waiting_room && !isLive && !isHost) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.replace("/communities")} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Waiting Room</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.waitingRoom}>
          <View style={styles.waitingIcon}>
            <Clock size={64} color="#10B981" />
          </View>
          <Text style={[styles.waitingTitle, { color: colors.text }]}>
            Waiting for host to start
          </Text>
          <Text style={[styles.waitingSubtitle, { color: colors.textSecondary }]}>
            {currentSession.title}
          </Text>
          <Text style={[styles.waitingTime, { color: colors.textSecondary }]}>
            Scheduled for {formatTimeDisplay(currentSession.start_time)}
          </Text>

          {/* Set intention while waiting */}
          {currentSession.requires_intention && (
            <View style={styles.intentionSection}>
              <Text style={[styles.intentionLabel, { color: colors.text }]}>
                What will you focus on?
              </Text>
              <TextInput
                style={[styles.intentionInput, { color: colors.text, backgroundColor: colors.isDark ? "#2A2A2A" : "#F5F5F5" }]}
                value={intention}
                onChangeText={setIntention}
                placeholder="e.g., Complete project proposal"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.leaveWaitingBtn, { borderColor: colors.border }]}
            onPress={() => router.replace("/communities")}
          >
            <Text style={[styles.leaveWaitingText, { color: colors.text }]}>Leave Waiting Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.isDark ? "#0A0A0A" : "#FAFAFA" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace("/communities")} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {currentSession.title}
          </Text>
          <View style={styles.headerStatus}>
            {isLive ? (
              <>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </>
            ) : (
              <Text style={[styles.scheduledText, { color: colors.textSecondary }]}>
                Starts at {formatTimeDisplay(currentSession.start_time)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <Users size={18} color={colors.textSecondary} />
          <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
            {activeParticipants.length}
          </Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Left Side - Video/Audio Call */}
        <View style={styles.videoSection}>
          {/* Video/Audio Call UI - starts when entering session */}
          {currentSession.session_mode !== "virtual_presence" && Platform.OS === "web" ? (
            <View style={styles.videoCallContainer}>
              {/* Video Grid */}
              <View style={styles.videoGrid}>
                {/* Local Video */}
                {localStream && currentSession.session_mode === "video" && (
                  <View style={[styles.videoTile, remoteStreams.size === 0 && styles.videoTileSolo]}>
                    <video
                      ref={setLocalVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)",
                        borderRadius: 12,
                        backgroundColor: "#000",
                      }}
                    />
                    <View style={styles.videoLabel}>
                      <Text style={styles.videoLabelText}>You</Text>
                    </View>
                    {isMuted && (
                      <View style={styles.mutedIndicator}>
                        <MicOff size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                )}
                
                {/* Remote Videos */}
                {Array.from(remoteStreams.entries()).map(([oderId]) => (
                  <View key={oderId} style={styles.videoTile}>
                    <video
                      ref={(el) => setRemoteVideoRef(oderId, el)}
                      autoPlay
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 12,
                        backgroundColor: "#000",
                      }}
                    />
                  </View>
                ))}
                
                {/* Audio-only mode indicator */}
                {currentSession.session_mode === "audio" && (
                  <View style={styles.audioModeContainer}>
                    <Mic size={48} color="#10B981" />
                    <Text style={[styles.audioModeText, { color: colors.text }]}>Audio Session</Text>
                    <Text style={[styles.audioModeSubtext, { color: colors.textSecondary }]}>
                      {remoteStreams.size + 1} participants connected
                    </Text>
                  </View>
                )}
                
                {/* Waiting for video to load */}
                {!localStream && currentSession.session_mode === "video" && (
                  <View style={styles.videoLoading}>
                    <PairLoader size={48} color="#10B981" />
                    <Text style={[styles.videoLoadingText, { color: colors.textSecondary }]}>
                      Starting camera...
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Call Controls */}
              <View style={styles.callControls}>
                <TouchableOpacity
                  style={[styles.callControlBtn, isMuted && styles.callControlBtnActive]}
                  onPress={handleToggleMute}
                >
                  {isMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </TouchableOpacity>
                
                {currentSession.session_mode === "video" && (
                  <TouchableOpacity
                    style={[styles.callControlBtn, !isVideoOn && styles.callControlBtnActive]}
                    onPress={handleToggleVideo}
                  >
                    {isVideoOn ? <Video size={20} color="#fff" /> : <VideoOff size={20} color="#fff" />}
                  </TouchableOpacity>
                )}
              </View>
              
              {callError && (
                <Text style={styles.callErrorText}>{callError}</Text>
              )}
            </View>
          ) : (
            /* Virtual Presence Mode - No video, just show session info */
            <View style={styles.virtualPresenceContainer}>
              <Eye size={64} color="#10B981" />
              <Text style={[styles.virtualPresenceTitle, { color: colors.text }]}>Virtual Presence</Text>
              <Text style={[styles.virtualPresenceSubtitle, { color: colors.textSecondary }]}>
                Focus together without video or audio
              </Text>
            </View>
          )}
        </View>

        {/* Right Side - Timer & Participants */}
        <View style={[styles.rightSidebar, { backgroundColor: colors.background, borderLeftColor: colors.border }]}>
          {/* Timer Section */}
          <View style={[styles.timerSidebarSection, { borderBottomColor: colors.border }]}>
            {isLive && currentPhase ? (
              <>
                {/* Phase Progress */}
                <View style={styles.phaseProgressSidebar}>
                  {currentSession.structure?.map((step, i) => (
                    <View
                      key={i}
                      style={[
                        styles.phaseIndicatorSidebar,
                        i === currentPhaseIndex && styles.phaseIndicatorActive,
                        i < currentPhaseIndex && styles.phaseIndicatorComplete,
                      ]}
                    />
                  ))}
                </View>

                {/* Current Phase */}
                <Text style={[styles.phaseNameSidebar, { color: colors.textSecondary }]}>
                  {currentPhase.name}
                </Text>

                {/* Timer */}
                <View style={styles.timerDisplaySidebar}>
                  <Text style={[styles.timerTextSidebar, { color: colors.text }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                </View>

                {/* Phase List */}
                <View style={styles.phaseDetailsSidebar}>
                  {currentSession.structure?.map((step, i) => (
                    <View
                      key={i}
                      style={[
                        styles.phaseItemSidebar,
                        i === currentPhaseIndex && styles.phaseItemActive,
                      ]}
                    >
                      <View style={[
                        styles.phaseItemDotSidebar,
                        { backgroundColor: i === currentPhaseIndex ? "#10B981" : i < currentPhaseIndex ? "#10B981" : colors.textSecondary }
                      ]}>
                        {i < currentPhaseIndex && <Check size={8} color="#FFF" />}
                      </View>
                      <Text style={[
                        styles.phaseItemTextSidebar,
                        { color: i === currentPhaseIndex ? colors.text : colors.textSecondary }
                      ]}>
                        {step.duration}m • {step.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.notStartedSidebar}>
                <Clock size={32} color={colors.textSecondary} />
                <Text style={[styles.notStartedTextSidebar, { color: colors.text }]}>
                  {isLive ? "Session in progress" : "Waiting to start"}
                </Text>
                <Text style={[styles.notStartedSubSidebar, { color: colors.textSecondary }]}>
                  {formatTimeDisplay(currentSession.start_time)}
                </Text>
              </View>
            )}

            {/* Host Controls */}
            {isHost && (
              <View style={styles.hostControlsSidebar}>
                {!isLive ? (
                  <TouchableOpacity style={styles.startBtnSidebar} onPress={handleStartSession}>
                    <Play size={16} color="#FFF" fill="#FFF" />
                    <Text style={styles.startBtnTextSidebar}>Start Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.endBtnSidebar} onPress={handleEndSession}>
                    <Pause size={16} color="#FFF" />
                    <Text style={styles.endBtnTextSidebar}>End Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Join/Leave Controls for participants */}
            {!isHost && (
              <View style={styles.participantControlsSidebar}>
                {!isInSession ? (
                  <TouchableOpacity style={styles.joinBtnSidebar} onPress={handleJoinSession}>
                    <Text style={styles.joinBtnTextSidebar}>Join Session</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.leaveBtnSidebar} onPress={handleLeaveSession}>
                    <LogOut size={14} color="#EF4444" />
                    <Text style={styles.leaveBtnTextSidebar}>Leave</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Participants Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Participants ({activeParticipants.length})
          </Text>

          {/* My Intention */}
          {isInSession && currentSession.requires_intention && (
            <View style={[styles.myIntention, { backgroundColor: colors.isDark ? "#1A1A1A" : "#F5F5F5" }]}>
              <View style={styles.myIntentionHeader}>
                <Target size={16} color="#10B981" />
                <Text style={[styles.myIntentionLabel, { color: colors.textSecondary }]}>
                  My Focus
                </Text>
                <TouchableOpacity onPress={() => setIsEditingIntention(!isEditingIntention)}>
                  <Edit3 size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {isEditingIntention ? (
                <View style={styles.editIntention}>
                  <TextInput
                    style={[styles.editIntentionInput, { color: colors.text, borderColor: colors.border }]}
                    value={intention}
                    onChangeText={setIntention}
                    placeholder="What are you focusing on?"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity style={styles.saveIntentionBtn} onPress={handleSaveIntention}>
                    <Check size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.myIntentionText, { color: colors.text }]}>
                  {intention || "Tap to set your focus intention"}
                </Text>
              )}
            </View>
          )}

          <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
            {activeParticipants.map((participant) => (
              <View
                key={participant.id}
                style={[styles.participantCard, { backgroundColor: colors.isDark ? "#1A1A1A" : "#FFF" }]}
              >
                <View style={styles.participantAvatar}>
                  {participant.avatar_url ? (
                    <Image source={{ uri: participant.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: "#7C3AED" }]}>
                      <Text style={styles.avatarInitial}>
                        {participant.username?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  {participant.user_id === currentSession.host_id && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>★</Text>
                    </View>
                  )}
                </View>
                <View style={styles.participantInfo}>
                  <Text style={[styles.participantName, { color: colors.text }]}>
                    {participant.username}
                    {participant.user_id === user?.id && " (You)"}
                  </Text>
                  {participant.intention && (
                    <Text style={[styles.participantIntention, { color: colors.textSecondary }]} numberOfLines={2}>
                      🎯 {participant.intention}
                    </Text>
                  )}
                </View>
                <View style={styles.participantStatus}>
                  {participant.status === "active" ? (
                    <View style={styles.activeIndicator} />
                  ) : (
                    <Text style={[styles.waitingStatus, { color: colors.textSecondary }]}>Waiting</Text>
                  )}
                </View>
              </View>
            ))}

            {activeParticipants.length === 0 && (
              <View style={styles.noParticipants}>
                <Users size={32} color={colors.textSecondary} />
                <Text style={[styles.noParticipantsText, { color: colors.textSecondary }]}>
                  No one has joined yet
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 16, fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerStatus: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 6 },
  liveText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  scheduledText: { fontSize: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  participantCount: { fontSize: 14, fontWeight: "600" },
  mainContent: { flex: 1, flexDirection: "row" },
  timerSection: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  phaseProgress: { flexDirection: "row", gap: 8, marginBottom: 24 },
  phaseIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB" },
  phaseIndicatorActive: { backgroundColor: "#10B981" },
  phaseIndicatorComplete: { backgroundColor: "#10B981" },
  phaseName: { fontSize: 16, fontWeight: "500", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  timerDisplay: { marginBottom: 32 },
  timerText: { fontSize: 96, fontWeight: "200", fontVariant: ["tabular-nums"] },
  phaseDetails: { width: "100%", maxWidth: 300, gap: 12 },
  phaseItem: { flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.5 },
  phaseItemActive: { opacity: 1 },
  phaseItemDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  phaseItemText: { fontSize: 14 },
  notStarted: { alignItems: "center" },
  notStartedText: { fontSize: 20, fontWeight: "600", marginTop: 16 },
  notStartedSub: { fontSize: 14, marginTop: 8 },
  hostControls: { marginTop: 32 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#10B981", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  startBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  endBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF4444", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  endBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  participantControls: { marginTop: 32 },
  joinBtn: { backgroundColor: "#1A1A1A", paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  joinBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  leaveBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  leaveBtnText: { color: "#EF4444", fontSize: 14, fontWeight: "500" },
  participantsSection: { width: 320, borderLeftWidth: 1, borderLeftColor: "#E5E7EB" },
  sectionTitle: { fontSize: 16, fontWeight: "600", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  myIntention: { margin: 16, padding: 16, borderRadius: 12 },
  myIntentionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  myIntentionLabel: { flex: 1, fontSize: 12, fontWeight: "500" },
  myIntentionText: { fontSize: 14, lineHeight: 20 },
  editIntention: { flexDirection: "row", gap: 8 },
  editIntentionInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  saveIntentionBtn: { backgroundColor: "#10B981", padding: 10, borderRadius: 8 },
  participantsList: { flex: 1 },
  participantCard: { flexDirection: "row", alignItems: "center", padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  participantAvatar: { position: "relative" },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  hostBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: "#F59E0B", width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  hostBadgeText: { color: "#FFF", fontSize: 10 },
  participantInfo: { flex: 1, marginLeft: 12 },
  participantName: { fontSize: 15, fontWeight: "600" },
  participantIntention: { fontSize: 13, marginTop: 2 },
  participantStatus: {},
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  waitingStatus: { fontSize: 12 },
  noParticipants: { alignItems: "center", paddingTop: 48 },
  noParticipantsText: { fontSize: 14, marginTop: 12 },
  waitingRoom: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  waitingIcon: { marginBottom: 24 },
  waitingTitle: { fontSize: 24, fontWeight: "600", marginBottom: 8 },
  waitingSubtitle: { fontSize: 16, marginBottom: 4 },
  waitingTime: { fontSize: 14 },
  intentionSection: { width: "100%", maxWidth: 400, marginTop: 32 },
  intentionLabel: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  intentionInput: { borderRadius: 12, padding: 16, fontSize: 15, minHeight: 80 },
  leaveWaitingBtn: { marginTop: 32, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
  leaveWaitingText: { fontSize: 14, fontWeight: "500" },
  // Video call styles
  videoSection: { flex: 1, backgroundColor: "#0A0A0A" },
  videoCallContainer: { flex: 1, padding: 16 },
  videoGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "center" },
  videoTile: { width: 280, height: 210, borderRadius: 12, overflow: "hidden", position: "relative", backgroundColor: "#000" },
  videoTileSolo: { width: "100%", maxWidth: 640, height: 480 },
  videoLabel: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  videoLabelText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  mutedIndicator: { position: "absolute", top: 8, right: 8, backgroundColor: "#EF4444", padding: 6, borderRadius: 20 },
  videoLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  videoLoadingText: { marginTop: 16, fontSize: 14 },
  audioModeContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  audioModeText: { fontSize: 24, fontWeight: "600", marginTop: 16 },
  audioModeSubtext: { fontSize: 14, marginTop: 8 },
  virtualPresenceContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  virtualPresenceTitle: { fontSize: 24, fontWeight: "600", marginTop: 16 },
  virtualPresenceSubtitle: { fontSize: 14, marginTop: 8, textAlign: "center" },
  callControls: { flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 16 },
  callControlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  callControlBtnActive: { backgroundColor: "#EF4444" },
  callErrorText: { color: "#EF4444", fontSize: 14, textAlign: "center", marginTop: 8 },
  // Right sidebar styles
  rightSidebar: { width: 320, borderLeftWidth: 1 },
  timerSidebarSection: { padding: 16, borderBottomWidth: 1, alignItems: "center" },
  phaseProgressSidebar: { flexDirection: "row", gap: 4, marginBottom: 12 },
  phaseIndicatorSidebar: { width: 24, height: 3, borderRadius: 2, backgroundColor: "#E5E7EB" },
  phaseNameSidebar: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  timerDisplaySidebar: { marginBottom: 16 },
  timerTextSidebar: { fontSize: 48, fontWeight: "200", fontVariant: ["tabular-nums"] },
  phaseDetailsSidebar: { width: "100%", gap: 8 },
  phaseItemSidebar: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.5 },
  phaseItemDotSidebar: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  phaseItemTextSidebar: { fontSize: 12 },
  notStartedSidebar: { alignItems: "center", paddingVertical: 16 },
  notStartedTextSidebar: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  notStartedSubSidebar: { fontSize: 12, marginTop: 4 },
  hostControlsSidebar: { marginTop: 16, width: "100%" },
  startBtnSidebar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#10B981", paddingVertical: 10, borderRadius: 8 },
  startBtnTextSidebar: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  endBtnSidebar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EF4444", paddingVertical: 10, borderRadius: 8 },
  endBtnTextSidebar: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  participantControlsSidebar: { marginTop: 16, width: "100%" },
  joinBtnSidebar: { backgroundColor: "#1A1A1A", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  joinBtnTextSidebar: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  leaveBtnSidebar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  leaveBtnTextSidebar: { color: "#EF4444", fontSize: 13, fontWeight: "500" },
});
