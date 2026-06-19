import { open } from '@op-engineering/op-sqlite';
import RNFS from 'react-native-fs';
import { Note } from '../types';
import { detectTags, tagsToString } from '../services/taggingService';

const db = open({ name: 'nightthoughts.db' });

let initPromise: Promise<void> | null = null;

export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.execute(
        `CREATE TABLE IF NOT EXISTS notes (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          title     TEXT    NOT NULL,
          transcript TEXT   NOT NULL,
          audioPath TEXT    NOT NULL,
          language  TEXT    NOT NULL DEFAULT 'en',
          duration  INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT    NOT NULL
        );`,
      );
      try {
        await db.execute(
          `ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT ''`,
        );
      } catch {
        // column already exists
      }
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_notes_created
           ON notes(createdAt DESC)`,
      );
      await db.execute(
        `CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );`,
      );
    })();
  }
  return initPromise;
}

// tags are derived from the transcript here, callers never pass them
export async function saveNote(
  note: Omit<Note, 'id' | 'createdAt' | 'tags'>,
): Promise<void> {
  await initDatabase();
  await db.execute(
    `INSERT INTO notes (title, transcript, audioPath, language, duration, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      note.title,
      note.transcript,
      note.audioPath,
      note.language,
      note.duration,
      tagsToString(detectTags(note.transcript)),
      new Date().toISOString(),
    ],
  );
}

export interface NoteQuery {
  /** Case-insensitive substring matched against the transcript. */
  search?: string;
  /** Restrict to notes carrying this tag. */
  tag?: string;
  /** Cap the number of rows returned (e.g. recent-notes list). */
  limit?: number;
}

export async function getNotes(query: NoteQuery = {}): Promise<Note[]> {
  await initDatabase();

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (query.search) {
    where.push('transcript LIKE ? ESCAPE \'\\\'');
    // Escape LIKE wildcards so a literal % or _ in the search isn't a wildcard.
    const escaped = query.search.replace(/[\\%_]/g, c => `\\${c}`);
    params.push(`%${escaped}%`);
  }
  if (query.tag) {
    // tags is a comma-separated list; match the tag as a whole token.
    where.push("(',' || tags || ',') LIKE ?");
    params.push(`%,${query.tag},%`);
  }

  let sql = 'SELECT * FROM notes';
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY createdAt DESC';
  if (query.limit != null) {
    sql += ' LIMIT ?';
    params.push(query.limit);
  }

  const result = await db.execute(sql, params);
  return (result.rows?._array ?? []) as Note[];
}

export async function updateNoteTranscript(
  id: number,
  transcript: string,
): Promise<void> {
  await initDatabase();
  await db.execute(
    'UPDATE notes SET transcript = ?, title = ?, tags = ? WHERE id = ?',
    [
      transcript,
      transcript.slice(0, 50) || 'Untitled thought',
      tagsToString(detectTags(transcript)),
      id,
    ],
  );
}

export async function deleteNote(id: number): Promise<void> {
  await initDatabase();
  // Remove the audio file first so deleting a note doesn't leak recordings.
  const result = await db.execute(
    'SELECT audioPath FROM notes WHERE id = ?',
    [id],
  );
  const audioPath = result.rows?._array?.[0]?.audioPath as string | undefined;
  if (audioPath) {
    try {
      if (await RNFS.exists(audioPath)) {
        await RNFS.unlink(audioPath);
      }
    } catch {
      // file already gone or unreadable — proceed with row deletion
    }
  }
  await db.execute('DELETE FROM notes WHERE id = ?', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  await initDatabase();
  const result = await db.execute(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  const row = result.rows?._array?.[0];
  return row ? (row.value as string) : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await initDatabase();
  await db.execute(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
