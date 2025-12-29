import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForNotifications() {
  const { status } = await Notifications.getPermissionsAsync();

  let finalStatus = status;

  if (status !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  if (finalStatus !== "granted") {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

