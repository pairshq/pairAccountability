import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface UserPresence {
  oderId: string;
  username: string;
  avatarUrl: string | null;
  status: "online" | "away" | "offline";
  lastSeen: string;
}

export interface PresenceState {
  [key: string]: UserPresence[];
}

// Type assertion for profiles table with presence fields
const db = supabase as any;

class PresenceManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private globalChannel: RealtimeChannel | null = null;
  private oderId: string | null = null;
  private username: string = "";
  private avatarUrl: string | null = null;
  private onPresenceChange: ((groupId: string, users: UserPresence[]) => void) | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Initialize presence for the current user
  async initialize(oderId: string, username: string, avatarUrl: string | null) {
    this.oderId = oderId;
    this.username = username;
    this.avatarUrl = avatarUrl;

    // Update last_seen in profiles table
    await this.updateLastSeen();

    // Start heartbeat to keep updating last_seen
    this.startHeartbeat();

    // Subscribe to global presence channel
    this.subscribeToGlobalPresence();
  }

  // Update last_seen timestamp in database
  private async updateLastSeen() {
    if (!this.oderId) return;

    await db
      .from("profiles")
      .update({ 
        last_seen: new Date().toISOString(),
        is_online: true 
      })
      .eq("id", this.oderId);
  }

  // Start heartbeat to update last_seen every 30 seconds
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.updateLastSeen();
    }, 30000); // Every 30 seconds
  }

  // Subscribe to global presence channel
  private subscribeToGlobalPresence() {
    if (!this.oderId) return;

    this.globalChannel = supabase.channel("presence:global", {
      config: {
        presence: {
          key: this.oderId,
        },
      },
    });

    this.globalChannel
      .on("presence", { event: "sync" }, () => {
        const state = this.globalChannel?.presenceState() || {};
        console.log("Global presence sync:", Object.keys(state).length, "users online");
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await this.globalChannel?.track({
            oderId: this.oderId,
            username: this.username,
            avatarUrl: this.avatarUrl,
            status: "online",
            lastSeen: new Date().toISOString(),
          });
        }
      });
  }

  // Subscribe to a specific group's presence
  subscribeToGroup(
    groupId: string,
    onUpdate: (users: UserPresence[]) => void
  ): () => void {
    if (!this.oderId) return () => {};

    // Store the callback
    this.onPresenceChange = (gId, users) => {
      if (gId === groupId) {
        onUpdate(users);
      }
    };

    const channel = supabase.channel(`presence:group:${groupId}`, {
      config: {
        presence: {
          key: this.oderId,
        },
      },
    });

    this.channels.set(groupId, channel);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = this.parsePresenceState(state);
        onUpdate(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const state = channel.presenceState();
        const users = this.parsePresenceState(state);
        onUpdate(users);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const state = channel.presenceState();
        const users = this.parsePresenceState(state);
        onUpdate(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            oderId: this.oderId,
            username: this.username,
            avatarUrl: this.avatarUrl,
            status: "online",
            lastSeen: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      this.channels.delete(groupId);
    };
  }

  // Parse presence state into UserPresence array
  private parsePresenceState(state: any): UserPresence[] {
    const users: UserPresence[] = [];
    
    for (const [key, presences] of Object.entries(state)) {
      if (Array.isArray(presences) && presences.length > 0) {
        const presence = presences[0] as any;
        users.push({
          oderId: presence.oderId || key,
          username: presence.username || "Unknown",
          avatarUrl: presence.avatarUrl || null,
          status: presence.status || "online",
          lastSeen: presence.lastSeen || new Date().toISOString(),
        });
      }
    }

    return users;
  }

  // Get online users count for a group
  async getOnlineCount(groupId: string): Promise<number> {
    const channel = this.channels.get(groupId);
    if (channel) {
      const state = channel.presenceState();
      return Object.keys(state).length;
    }
    return 0;
  }

  // Set user status (online, away, offline)
  async setStatus(status: "online" | "away" | "offline") {
    if (!this.oderId) return;

    // Update in database
    await db
      .from("profiles")
      .update({ 
        is_online: status !== "offline",
        last_seen: new Date().toISOString()
      })
      .eq("id", this.oderId);

    // Update in all presence channels
    const presenceData = {
      oderId: this.oderId,
      username: this.username,
      avatarUrl: this.avatarUrl,
      status,
      lastSeen: new Date().toISOString(),
    };

    if (this.globalChannel) {
      await this.globalChannel.track(presenceData);
    }

    for (const channel of this.channels.values()) {
      await channel.track(presenceData);
    }
  }

  // Clean up when user logs out or app closes
  async cleanup() {
    // Set offline status
    if (this.oderId) {
      await db
        .from("profiles")
        .update({ 
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq("id", this.oderId);
    }

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Unsubscribe from all channels
    if (this.globalChannel) {
      await this.globalChannel.unsubscribe();
      this.globalChannel = null;
    }

    for (const channel of this.channels.values()) {
      await channel.unsubscribe();
    }
    this.channels.clear();

    this.oderId = null;
  }
}

// Singleton instance
export const presenceManager = new PresenceManager();

// Helper function to format "last seen" time
export function formatLastSeen(lastSeen: string): string {
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now.getTime() - seen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return seen.toLocaleDateString();
}

// Check if user is considered online (seen within last 5 minutes)
export function isUserOnline(lastSeen: string): boolean {
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now.getTime() - seen.getTime();
  return diffMs < 5 * 60 * 1000; // 5 minutes
}
