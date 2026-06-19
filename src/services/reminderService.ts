import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { getSetting, setSetting } from '../database/db';

const REMINDER_ID = 'bedtime-reminder';
const ENABLED_KEY = 'reminderEnabled';
const TIME_KEY = 'reminderTime';
const DEFAULT_TIME = '22:00'; // 10 PM

function nextReminderTimestamp(hhmm: string): number {
  let [hour, minute] = hhmm.split(':').map(Number);
  // Guard against a malformed stored value producing a NaN timestamp.
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) hour = 22;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) minute = 0;
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

export async function isReminderEnabled(): Promise<boolean> {
  return (await getSetting(ENABLED_KEY)) === 'true';
}

export async function getReminderTime(): Promise<string> {
  return (await getSetting(TIME_KEY)) ?? DEFAULT_TIME;
}

export async function enableReminder(): Promise<boolean> {
  const permission = await notifee.requestPermission();
  if (permission.authorizationStatus < 1) {
    return false; // user denied notifications
  }

  const channelId = await notifee.createChannel({
    id: 'reminders',
    name: 'Bedtime reminders',
    importance: AndroidImportance.DEFAULT,
  });

  const time = await getReminderTime();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextReminderTimestamp(time),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: REMINDER_ID,
      title: 'Night Thoughts 🌙',
      body: 'Anything on your mind? Capture it before you sleep.',
      android: { channelId, pressAction: { id: 'default' } },
    },
    trigger,
  );

  await setSetting(ENABLED_KEY, 'true');
  return true;
}

export async function disableReminder(): Promise<void> {
  await notifee.cancelTriggerNotification(REMINDER_ID);
  await setSetting(ENABLED_KEY, 'false');
}

/** Saves the time and reschedules the notification if reminders are on. */
export async function setReminderTime(hhmm: string): Promise<void> {
  await setSetting(TIME_KEY, hhmm);
  if (await isReminderEnabled()) {
    await enableReminder();
  }
}
