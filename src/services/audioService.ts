import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const recorder = new AudioRecorderPlayer();

export const audioService = {
  async start(): Promise<string> {
    const path = `${RNFS.DocumentDirectoryPath}/thought_${Date.now()}.m4a`;
    await recorder.startRecorder(path);
    return path;
  },

  async stop(): Promise<void> {
    await recorder.stopRecorder();
    recorder.removeRecordBackListener();
  },

  /**
   * Plays a file. onProgress fires every tick with the current position and
   * the file's total duration, both in seconds; onEnd fires once when
   * playback reaches the end of the file.
   */
  async play(
    path: string,
    onProgress: (seconds: number, durationSeconds: number) => void,
    onEnd: () => void,
  ): Promise<void> {
    await recorder.startPlayer(path);
    recorder.addPlayBackListener(e => {
      onProgress(
        Math.floor(e.currentPosition / 1000),
        Math.floor(e.duration / 1000),
      );
      if (e.duration > 0 && e.currentPosition >= e.duration) {
        recorder.stopPlayer().catch(() => {});
        recorder.removePlayBackListener();
        onEnd();
      }
    });
  },

  async stopPlay(): Promise<void> {
    try {
      await recorder.stopPlayer();
    } catch {
      // already stopped — safe to ignore
    }
    recorder.removePlayBackListener();
  },
};
