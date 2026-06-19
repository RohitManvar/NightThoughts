import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const { QuickRecord } = NativeModules;

const EVENT_NAME = 'nightthoughts.quickRecord';

/**
 * True when the app was cold-started from the Quick Settings tile.
 * The native side clears the flag once read.
 */
export async function wasLaunchedForQuickRecord(): Promise<boolean> {
  if (Platform.OS !== 'android' || !QuickRecord) return false;
  try {
    return !!(await QuickRecord.getInitialAction());
  } catch {
    return false;
  }
}

/** Fires when the tile is tapped while the app is already running. */
export function onQuickRecord(handler: () => void): () => void {
  const sub = DeviceEventEmitter.addListener(EVENT_NAME, handler);
  return () => sub.remove();
}
