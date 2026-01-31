import * as Notifications from "expo-notifications";

export async function scheduleBillReminder(
  billName: string,
  remindAt: Date
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💸 Bill Reminder",
      body: `${billName} is due soon`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: remindAt,
    },
  });
}
