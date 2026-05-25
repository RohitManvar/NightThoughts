import { initWhisper } from 'whisper.rn';
import RNFS from 'react-native-fs';

interface TranscribeResult {
  text: string;
  language: string;
}

let whisperContext: Awaited<ReturnType<typeof initWhisper>> | null = null;

async function getContext() {
  if (whisperContext) return whisperContext;

  // whisper.rn model file must be in android/app/src/main/assets/ (Android)
  // or in the app bundle (iOS). Use 'ggml-base' for best offline balance.
  const modelPath =
    RNFS.MainBundlePath
      ? `${RNFS.MainBundlePath}/ggml-base.bin`        // iOS
      : 'ggml-base.bin';                               // Android (assets)

  whisperContext = await initWhisper({ filePath: modelPath });
  return whisperContext;
}

export async function transcribeAudio(
  audioPath: string,
): Promise<TranscribeResult> {
  const ctx = await getContext();

  const { promise } = ctx.transcribe(audioPath, {
    language: 'auto',       // auto-detect language
    maxLen: 1,
    tokenTimestamps: false,
  });

  const result = await promise;

  const text = result.segments
    .map((s: { text: string }) => s.text.trim())
    .join(' ')
    .trim();

  return {
    text: text || '',
    language: result.isAborted ? 'unknown' : (result as any).language ?? 'auto',
  };
}
