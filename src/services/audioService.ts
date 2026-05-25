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

  async play(
    path: string,
    onProgress: (seconds: number) => void,
  ): Promise<void> {
    await recorder.startPlayer(path);
    recorder.addPlayBackListener(e => {
      onProgress(Math.floor(e.currentPosition / 1000));
      if (e.currentPosition >= e.duration) {
        recorder.stopPlayer();
        recorder.removePlayBackListener();
      }
    });
  },

  async stopPlay(): Promise<void> {
    await recorder.stopPlayer();
    recorder.removePlayBackListener();
  },
};
