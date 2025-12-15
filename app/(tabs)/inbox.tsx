import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { 
  Bell, 
  MessageCircle, 
  UserPlus, 
  Target, 
  CheckCircle2,
  AtSign,
  Settings,
  Circle,
  Trash2,
} from "lucide-react-native";
import { useColors } from "@/lib/useColorScheme";
import { useAuthStore } from "@/stores/authStore";
import { useResponsive } from "@/hooks/useResponsive";

type NotificationType = "mention" | "activity" | "invite" | "reminder" | "achievement";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned",
    message: "@john mentioned you in Morning Routine group",
    time: "2 min ago",
    read: false,
    actionUrl: "/group/1",
  },
  {
    id: "2",
    type: "activity",
    title: "New check-in",
    message: "Sarah completed their daily exercise goal",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "invite",
    title: "Group invitation",
    message: "Mike invited you to join 'Productivity Squad'",
    time: "1 hour ago",
    read: false,
    actionUrl: "/group/2",
  },
  {
    id: "4",
    type: "reminder",
    title: "Goal reminder",
    message: "Don't forget to complete your reading goal today",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "achievement",
    title: "Streak milestone! 🔥",
    message: "You've maintained a 7-day streak on meditation",
    time: "Yesterday",
    read: true,
  },
];

const getNotificationIcon = (type: NotificationType, colors: any) => {
  switch (type) {
    case "mention":
      return <AtSign size={20} color="#4285F4" />;
    case "activity":
      return <Target size={20} color="#2ECC71" />;
    case "invite":
      return <UserPlus size={20} color="#9B59B6" />;
    case "reminder":
      return <Bell size={20} color="#FAB300" />;
    case "achievement":
      return <CheckCircle2 size={20} color="#E74C3C" />;
    default:
      return <Bell size={20} color={colors.textSecondary} />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "mention":
      return "#E3F2FD";
    case "activity":
      return "#E8F5E9";
    case "invite":
      return "#F3E5F5";
    case "reminder":
      return "#FFF3E0";
    case "achievement":
      return "#FFEBEE";
    default:
      return "#F5F5F5";
  }
};

export default function InboxScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDesktop } = useResponsive();

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        !notification.read && styles.notificationUnread,
      ]}
      onPress={() => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
          router.push(notification.actionUrl as any);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[
        styles.notificationIcon,
        { backgroundColor: colors.isDark ? "#1E1E1E" : getNotificationColor(notification.type) },
      ]}>
        {getNotificationIcon(notification.type, colors)}
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {notification.title}
          </Text>
          {!notification.read && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
          {notification.time}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(notification.id)}
      >
        <Trash2 size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Inbox</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.settingsButton, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterTabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === "all" ? colors.text : colors.textSecondary },
          ]}>
            All
          </Text>
          {filter === "all" && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === "unread" && styles.filterTabActive]}
          onPress={() => setFilter("unread")}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === "unread" ? colors.text : colors.textSecondary },
          ]}>
            Unread
          </Text>
          {filter === "unread" && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
        <Bell size={18} color={colors.textSecondary} />
        <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
          You'll be notified here for @mentions, page activity, and more
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FAB300"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.isDark ? "#1E1E1E" : "#F5F5F5" }]}>
              <Bell size={40} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === "unread" 
                ? "You're all caught up!" 
                : "When you get notifications, they'll show up here"
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  unreadBadge: {
    backgroundColor: "#E74C3C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingVertical: 14,
    marginRight: 24,
    position: "relative",
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  filterIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#000000",
    borderRadius: 1,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    maxWidth: 700,
  },
  notificationsList: {
    gap: 10,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#FAB300",
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FAB300",
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 280,
  },
});



