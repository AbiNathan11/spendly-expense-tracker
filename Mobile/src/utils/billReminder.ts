import * as Notifications from "expo-notifications";

/**
 * Schedule a bill reminder notification
 */
export async function scheduleBillReminder(
  billId: string,
  title: string,
  amount: number,
  dueISO: string
) {
  const dueDate = new Date(dueISO);

  // ⏰ Notify 1 day before at 9 AM
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0);

  if (reminderDate <= new Date()) {
    return null; // Don't schedule past notifications
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💸 Bill Reminder",
      body: `${title} ($${amount}) is due tomorrow`,
      sound: "default",
      data: { billId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return notificationId;
}

/**
 * Cancel bill reminder
 */
export async function cancelBillReminder(notificationId: string) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
