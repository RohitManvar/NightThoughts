export interface Note {
  id: number;
  title: string;
  transcript: string;
  audioPath: string;
  language: string;
  duration: number; // seconds
  createdAt: string; // ISO date string
}

export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Notes: undefined;
  Playback: { note: Note };
};
