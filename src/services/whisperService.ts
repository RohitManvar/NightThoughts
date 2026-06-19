import { Platform } from 'react-native';
import { initWhisper } from 'whisper.rn';
import RNFS from 'react-native-fs';

interface TranscribeResult {
  text: string;
  language: string;
}

const MODEL_FILE = 'ggml-tiny.bin';

type WhisperContext = Awaited<ReturnType<typeof initWhisper>>;

// Cache the in-flight promise, not just the resolved value, so concurrent
// first calls share a single initWhisper instead of loading the model twice.
let contextPromise: Promise<WhisperContext> | null = null;

function getContext(): Promise<WhisperContext> {
  if (!contextPromise) {
    contextPromise = (async () => {
      if (Platform.OS === 'android') {
        // Model ships inside the APK at android/app/src/main/assets/ggml-tiny.bin.
        // whisper.rn cannot read APK assets directly, so copy it to the app's
        // files directory on first run.
        const localPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
        const exists = await RNFS.exists(localPath);
        if (!exists) {
          await RNFS.copyFileAssets(MODEL_FILE, localPath);
        }
        return initWhisper({ filePath: localPath });
      }
      return initWhisper({
        filePath: `${RNFS.MainBundlePath}/${MODEL_FILE}`,
      });
    })().catch(err => {
      // Don't cache a failed init — let the next call retry.
      contextPromise = null;
      throw err;
    });
  }
  return contextPromise;
}

export async function transcribeAudio(
  audioPath: string,
): Promise<TranscribeResult> {
  const ctx = await getContext();

  const { promise } = ctx.transcribe(audioPath, {
    language: 'auto',
  });

  const result = await promise;

  const text = result.segments
    .map((s: { text: string }) => s.text.trim())
    .join(' ')
    .trim();

  const detected = (result as any).language;
  return {
    text,
    // 'auto' is the request mode, not a real result — treat a missing or
    // unresolved language as 'unknown' so the UI can suppress the lang tag.
    language: detected && detected !== 'auto' ? detected : 'unknown',
  };
}
