import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications and get the token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push notification permissions");
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = pushToken.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      description: "Group chat messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00A884",
    });

    await Notifications.setNotificationChannelAsync("calls", {
      name: "Calls",
      description: "Voice and video calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#FF4444",
    });
  }

  return token;
}

// Save push token to user's profile in database
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    // Using any to bypass type checking since push_token column needs to be added
    await (supabase as any)
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}

// Send a local notification (for testing or immediate feedback)
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
}

// Schedule a notification for later
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
  return id;
}

// Cancel a scheduled notification
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Add notification received listener
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Remove notification listener
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  Notifications.removeNotificationSubscription(subscription);
}

// Types for notification payloads
export interface MessageNotificationData {
  type: "message";
  groupId: string;
  groupName: string;
  messageId: string;
  senderId: string;
  senderName: string;
}

export interface CallNotificationData {
  type: "call";
  callId: string;
  groupId: string;
  groupName: string;
  callType: "voice" | "video";
  callerId: string;
  callerName: string;
}

export interface ReminderNotificationData {
  type: "reminder";
  goalId: string;
  goalTitle: string;
}

export type NotificationData =
  | MessageNotificationData
  | CallNotificationData
  | ReminderNotificationData;
