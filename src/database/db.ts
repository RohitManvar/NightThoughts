import { open } from '@op-engineering/op-sqlite';
import { Note } from '../types';

const db = open({ name: 'nightthoughts.db' });

export function initDatabase() {
  db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT    NOT NULL,
      transcript TEXT   NOT NULL,
      audioPath TEXT    NOT NULL,
      language  TEXT    NOT NULL DEFAULT 'en',
      duration  INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT    NOT NULL
    );
  `);
}

export async function saveNote(
  note: Omit<Note, 'id' | 'createdAt'>,
): Promise<void> {
  db.execute(
    `INSERT INTO notes (title, transcript, audioPath, language, duration, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      note.title,
      note.transcript,
      note.audioPath,
      note.language,
      note.duration,
      new Date().toISOString(),
    ],
  );
}

export async function getNotes(): Promise<Note[]> {
  const result = db.execute(
    'SELECT * FROM notes ORDER BY createdAt DESC',
  );
  return (result.rows?._array ?? []) as Note[];
}

export async function deleteNote(id: number): Promise<void> {
  db.execute('DELETE FROM notes WHERE id = ?', [id]);
}
