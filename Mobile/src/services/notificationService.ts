import * as Notifications from 'expo-notifications';

export async function scheduleBillReminder(
  title: string,
  dueISO: string
) {
  const dueDate = new Date(dueISO);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(dueDate.getDate() - 1); // 1 day before

  if (reminderDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bill Reminder 💸',
      body: `${title} is due tomorrow`,
    },
    trigger: reminderDate,
  });
}
