export interface Note {
  id: number;
  title: string;
  transcript: string;
  audioPath: string;
  language: string;
  duration: number; // seconds
  tags: string; // comma-separated Tag values, '' when untagged
  createdAt: string; // ISO date string
}

import type { NavigatorScreenParams } from '@react-navigation/native';

/** Screens in the bottom-tab navigator (nested inside 'Tabs'). */
export type TabParamList = {
  Home: undefined;
  /** autoStartKey: changes on every Quick Settings tile tap to retrigger recording. */
  Record: { autoStartKey?: number } | undefined;
  Notes: undefined;
  Settings: undefined;
};

/** Screens in the root native-stack navigator. */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Playback: { note: Note };
  Digest: undefined;
};
