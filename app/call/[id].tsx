import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { PairLoader } from "@/components/ui";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users } from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useCallStore } from "@/stores/callStore";
import { WebRTCManager } from "@/lib/webrtc";

export default function CallScreen() {
  const { id, type, groupId } = useLocalSearchParams<{ id: string; type: string; groupId: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const {
    activeCall,
    leaveCall,
    endCall,
    joinCall,
    subscribeToCall,
  } = useCallStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Callback ref for local video to ensure stream is attached
  const setLocalVideoRef = (el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStream) {
      el.srcObject = localStream;
      el.play().catch(console.error);
    }
  };

  const isVideoCall = type === "video";

  // Initialize WebRTC
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initializeCall = async () => {
      if (!id || !user) {
        console.log("Missing id or user:", { id, user: !!user });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Initializing call, Platform:", Platform.OS, "isVideoCall:", isVideoCall);
        
        // Check if we're on web and have WebRTC support
        if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.mediaDevices) {
          // First, just get the local stream to show the user's video
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: isVideoCall ? { facingMode: "user" } : false,
              audio: true,
            });
            console.log("Got local stream:", stream.getTracks().map(t => t.kind));
            setLocalStream(stream);
          } catch (mediaError) {
            console.error("Media error:", mediaError);
            setError("Failed to access camera/microphone. Please allow permissions.");
            setIsLoading(false);
            return;
          }
          
          // Now setup WebRTC for peer connections
          const manager = new WebRTCManager(id, user.id, {
            onLocalStream: (s) => {
              // Already set above
            },
            onRemoteStream: (oderId, s) => {
              console.log("Got remote stream from:", oderId);
              setRemoteStreams((prev) => {
                const newMap = new Map(prev);
                newMap.set(oderId, s);
                return newMap;
              });
            },
            onParticipantLeft: (oderId) => {
              console.log("Participant left:", oderId);
              setRemoteStreams((prev) => {
                const newMap = new Map(prev);
                newMap.delete(oderId);
                return newMap;
              });
            },
          });

          webrtcRef.current = manager;
          await manager.initialize(isVideoCall);
        } else {
          setError("Video calling requires a web browser with camera access.");
        }
        
        // Join call in database
        await joinCall(id, user.id);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing call:", err);
        setError("Failed to initialize call. Please try again.");
        setIsLoading(false);
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (webrtcRef.current) {
        webrtcRef.current.leave();
      }
    };
  }, [id, user]);

  // Subscribe to call updates
  useEffect(() => {
    if (id) {
      const unsubscribe = subscribeToCall(id);
      return () => unsubscribe();
    }
  }, [id]);

  // Call duration timer
  useEffect(() => {
    if (!isLoading && localStream) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading, localStream]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, oderId) => {
      const videoEl = remoteVideoRefs.current.get(oderId);
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleMute = () => {
    if (webrtcRef.current) {
      const muted = webrtcRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const videoOn = webrtcRef.current.toggleVideo();
      setIsVideoOn(videoOn);
    }
  };

  const handleLeaveCall = async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.leave();
    }
    if (id && user) {
      await leaveCall(id, user.id);
    }
    router.back();
  };

  const handleEndCall = async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.leave();
    }
    if (id) {
      await endCall(id);
    }
    router.back();
  };

  const setRemoteVideoRef = (userId: string, el: HTMLVideoElement | null) => {
    if (el) {
      remoteVideoRefs.current.set(userId, el);
      const stream = remoteStreams.get(userId);
      if (stream) {
        el.srcObject = stream;
      }
    } else {
      remoteVideoRefs.current.delete(userId);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: "#1a1a2e" }]}>
        {/* Call Info */}
        <View style={styles.callInfo}>
          <Text style={styles.callType}>
            {isVideoCall ? "Video Call" : "Voice Call"}
          </Text>
          <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <PairLoader size={64} color="#fff" />
              <Text style={styles.loadingText}>Connecting to call...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{error}</Text>
            </View>
          ) : Platform.OS === "web" ? (
            // Web platform with WebRTC
            <View style={styles.videosWrapper}>
              {/* Remote videos */}
              <View style={styles.remoteVideosContainer}>
                {remoteStreams.size === 0 ? (
                  <View style={styles.waitingContainer}>
                    <Users size={48} color="#fff" />
                    <Text style={styles.waitingText}>Waiting for others to join...</Text>
                  </View>
                ) : (
                  Array.from(remoteStreams.entries()).map(([oderId]) => (
                    <video
                      key={oderId}
                      ref={(el) => setRemoteVideoRef(oderId, el)}
                      autoPlay
                      playsInline
                      style={{
                        width: remoteStreams.size === 1 ? "100%" : "50%",
                        height: "100%",
                        objectFit: "cover",
                        backgroundColor: "#000",
                      }}
                    />
                  ))
                )}
              </View>
              
              {/* Local video (picture-in-picture) */}
              {localStream && isVideoCall && (
                <View style={styles.localVideoContainer}>
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
                    }}
                  />
                </View>
              )}
              
              {/* Show local video prominently when alone */}
              {localStream && isVideoCall && remoteStreams.size === 0 && (
                <View style={styles.soloVideoContainer}>
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => {
                      if (el && localStream) {
                        el.srcObject = localStream;
                        el.play().catch(console.error);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "scaleX(-1)",
                      borderRadius: 12,
                    }}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Video calling is only available on web browsers</Text>
              <Text style={styles.noteSubtext}>Please use a web browser to make video calls</Text>
            </View>
          )}
        </View>

        {/* Call Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={handleToggleMute}
          >
            {isMuted ? (
              <MicOff size={24} color="#fff" />
            ) : (
              <Mic size={24} color="#fff" />
            )}
          </TouchableOpacity>

          {isVideoCall && (
            <TouchableOpacity
              style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
              onPress={handleToggleVideo}
            >
              {isVideoOn ? (
                <Video size={24} color="#fff" />
              ) : (
                <VideoOff size={24} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleLeaveCall}
          >
            <PhoneOff size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* End Call for All (only for call initiator) */}
        {activeCall?.initiated_by === user?.id && (
          <TouchableOpacity
            style={styles.endForAllButton}
            onPress={handleEndCall}
          >
            <Text style={styles.endForAllText}>End Call for Everyone</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  callType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  participantsContainer: {
    flex: 1,
    padding: 20,
  },
  waitingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingText: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 16,
    fontSize: 16,
  },
  participantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  participantCard: {
    width: 120,
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4a4a6a",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlaceholderText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4a4a6a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  participantName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  mutedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    padding: 4,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonActive: {
    backgroundColor: "#ff4444",
  },
  endCallButton: {
    backgroundColor: "#ff4444",
  },
  endForAllButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,68,68,0.3)",
    borderRadius: 12,
    alignItems: "center",
  },
  endForAllText: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "600",
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 16,
    fontSize: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  remoteVideosContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  remoteVideo: {
    flex: 1,
    minWidth: "50%",
    minHeight: 200,
    backgroundColor: "#000",
  },
  localVideoContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  switchCameraButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCallContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videosWrapper: {
    flex: 1,
    position: "relative",
  },
  soloVideoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  noteContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  noteText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
  },
  noteSubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
