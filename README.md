# Night Thoughts

A fully offline voice-first thought capture app for bedtime.
Speak your thoughts — they are recorded, transcribed (on-device), and saved as notes.
Works in 99+ languages with no internet connection required.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Download Whisper model
Download `ggml-base.bin` from https://huggingface.co/ggerganov/whisper.cpp

- **Android**: place in `android/app/src/main/assets/ggml-base.bin`
- **iOS**: add to Xcode project bundle

### 3. Run
```bash
# Android
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

## Project Structure

```
src/
  screens/        HomeScreen, RecordScreen, NotesScreen, PlaybackScreen
  components/     NoteCard
  services/       audioService, whisperService
  database/       db (SQLite via op-sqlite)
  navigation/     AppNavigator
  types/          TypeScript interfaces
  utils/          formatDuration
```

## Tech Stack

| Layer        | Library                          |
|-------------|----------------------------------|
| Framework    | React Native 0.73                |
| Transcription| whisper.rn (on-device)           |
| Audio        | react-native-audio-recorder-player |
| Database     | op-sqlite (SQLite)               |
| Storage      | react-native-fs                  |
| Navigation   | React Navigation 6               |
| Notifications| notifee                          |
