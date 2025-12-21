import { supabase } from "./supabase";

// Free STUN servers (Google's public servers)
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

// Full HD 1080p video constraints for maximum clarity
const HD_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  frameRate: { ideal: 30, min: 24 },
  facingMode: "user",
  aspectRatio: { ideal: 16 / 9 },
};

// High quality audio constraints
const HD_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join" | "leave";
  from: string;
  to?: string;
  payload?: any;
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private callId: string;
  private userId: string;
  private channel: any = null;
  private onRemoteStream: (userId: string, stream: MediaStream) => void;
  private onParticipantLeft: (userId: string) => void;
  private onLocalStream: (stream: MediaStream) => void;

  constructor(
    callId: string,
    userId: string,
    callbacks: {
      onRemoteStream: (userId: string, stream: MediaStream) => void;
      onParticipantLeft: (userId: string) => void;
      onLocalStream: (stream: MediaStream) => void;
    }
  ) {
    this.callId = callId;
    this.userId = userId;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onParticipantLeft = callbacks.onParticipantLeft;
    this.onLocalStream = callbacks.onLocalStream;
  }

  async initialize(isVideo: boolean = true): Promise<boolean> {
    try {
      console.log("WebRTC: Requesting media access, video:", isVideo);
      
      // Get local media stream with HD quality constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? HD_VIDEO_CONSTRAINTS : false,
        audio: HD_AUDIO_CONSTRAINTS,
      });
      
      console.log("WebRTC: Got local stream with tracks:", this.localStream.getTracks().map(t => t.kind));
      
      this.onLocalStream(this.localStream);

      // Setup Supabase Realtime channel for signaling
      this.channel = supabase.channel(`call:${this.callId}`, {
        config: {
          broadcast: { self: false },
        },
      });

      this.channel
        .on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalingMessage }) => {
          this.handleSignalingMessage(payload);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            // Announce joining
            await this.broadcast({
              type: "join",
              from: this.userId,
            });
          }
        });

      return true;
    } catch (error) {
      console.error("Failed to initialize WebRTC:", error);
      return false;
    }
  }

  private async broadcast(message: SignalingMessage) {
    if (this.channel) {
      await this.channel.send({
        type: "broadcast",
        event: "signal",
        payload: message,
      });
    }
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (message.from === this.userId) return;

    switch (message.type) {
      case "join":
        // New participant joined, create offer
        await this.createPeerConnection(message.from, true);
        break;

      case "offer":
        if (message.to === this.userId) {
          await this.handleOffer(message.from, message.payload);
        }
        break;

      case "answer":
        if (message.to === this.userId) {
          await this.handleAnswer(message.from, message.payload);
        }
        break;

      case "ice-candidate":
        if (message.to === this.userId) {
          await this.handleIceCandidate(message.from, message.payload);
        }
        break;

      case "leave":
        this.handleParticipantLeft(message.from);
        break;
    }
  }

  private async createPeerConnection(remoteUserId: string, createOffer: boolean): Promise<RTCPeerConnection> {
    // Close existing connection if any
    if (this.peerConnections.has(remoteUserId)) {
      this.peerConnections.get(remoteUserId)?.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnections.set(remoteUserId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.broadcast({
          type: "ice-candidate",
          from: this.userId,
          to: remoteUserId,
          payload: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.onRemoteStream(remoteUserId, event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        this.handleParticipantLeft(remoteUserId);
      }
    };

    // Create and send offer if needed
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await this.broadcast({
        type: "offer",
        from: this.userId,
        to: remoteUserId,
        payload: offer,
      });
    }

    return pc;
  }

  private async handleOffer(remoteUserId: string, offer: RTCSessionDescriptionInit) {
    const pc = await this.createPeerConnection(remoteUserId, false);
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.broadcast({
      type: "answer",
      from: this.userId,
      to: remoteUserId,
      payload: answer,
    });
  }

  private async handleAnswer(remoteUserId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIceCandidate(remoteUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private handleParticipantLeft(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }
    this.onParticipantLeft(remoteUserId);
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Returns true if muted
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled; // Returns true if video is on
      }
    }
    return false;
  }

  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && "getCapabilities" in videoTrack) {
        // This is a simplified version - full implementation would enumerate devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          if (videoDevices.length > 1) {
            // Switch to next camera
            const currentDeviceId = videoTrack.getSettings().deviceId;
            const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % videoDevices.length;
            
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: videoDevices[nextIndex].deviceId },
              audio: false,
            });
            
            const newVideoTrack = newStream.getVideoTracks()[0];
            
            // Replace track in all peer connections
            this.peerConnections.forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              }
            });
            
            // Update local stream
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);
            videoTrack.stop();
          }
        } catch (error) {
          console.error("Failed to switch camera:", error);
        }
      }
    }
  }

  async leave() {
    // Announce leaving
    await this.broadcast({
      type: "leave",
      from: this.userId,
    });

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Unsubscribe from channel
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}
