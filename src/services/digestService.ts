import dayjs from 'dayjs';
import { Note } from '../types';
import { Tag, parseTags } from './taggingService';

export interface DayCount {
  /** Single-letter weekday label, e.g. 'M' */
  label: string;
  /** YYYY-MM-DD */
  date: string;
  count: number;
  isToday: boolean;
}

export interface Digest {
  /** Notes captured since the start of this week. */
  weekCount: number;
  /** Seconds of audio captured this week. */
  weekSeconds: number;
  /** Consecutive days with at least one note, ending today or yesterday. */
  streak: number;
  /** Per-day counts for the current week, oldest first. */
  days: DayCount[];
  /** Tag totals for this week's notes. */
  tagCounts: Record<Tag, number>;
}

function dateKey(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

export function computeDigest(notes: Note[], now = dayjs()): Digest {
  const weekStart = now.startOf('week');
  const todayKey = dateKey(now);

  const countsByDay = new Map<string, number>();
  for (const note of notes) {
    const key = dateKey(dayjs(note.createdAt));
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  let weekCount = 0;
  let weekSeconds = 0;
  const tagCounts: Record<Tag, number> = { idea: 0, todo: 0, worry: 0 };
  for (const note of notes) {
    const created = dayjs(note.createdAt);
    if (created.isBefore(weekStart)) continue;
    weekCount += 1;
    weekSeconds += note.duration;
    for (const tag of parseTags(note.tags)) tagCounts[tag] += 1;
  }

  const days: DayCount[] = [];
  for (let i = 0; i < 7; i++) {
    const d = weekStart.add(i, 'day');
    const key = dateKey(d);
    days.push({
      label: d.format('dd').charAt(0),
      date: key,
      count: countsByDay.get(key) ?? 0,
      isToday: key === todayKey,
    });
  }

  // Streak: walk backwards day by day. A missing entry for today doesn't
  // break it (the day isn't over yet) — but a missing yesterday does.
  let streak = 0;
  let cursor = countsByDay.has(todayKey) ? now : now.subtract(1, 'day');
  while (countsByDay.has(dateKey(cursor))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return { weekCount, weekSeconds, streak, days, tagCounts };
}
