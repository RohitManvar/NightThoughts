import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { audioService } from '../services/audioService';
import { transcribeAudio } from '../services/whisperService';
import { saveNote } from '../database/db';
import { formatDuration } from '../utils/formatDuration';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';
import { TabParamList } from '../types';

type Status = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone access',
      message: 'NightThoughts needs the microphone to record your thoughts.',
      buttonPositive: 'Allow',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function RecordScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Record'>>();
  const autoStartKey = route.params?.autoStartKey;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [status, setStatus] = useState<Status>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPathRef = useRef('');
  const pulse = useRef(new Animated.Value(1)).current;
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioService.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (status === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [status, pulse]);

  // Quick Settings tile: a fresh autoStartKey means "start recording now".
  useEffect(() => {
    if (!autoStartKey) return;
    if (
      statusRef.current === 'recording' ||
      statusRef.current === 'transcribing'
    ) {
      return; // already busy capturing — don't interrupt
    }
    setTranscript('');
    setLanguage('');
    setErrorMsg('');
    startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartKey]);

  async function startRecording() {
    const ok = await ensureMicPermission();
    if (!ok) {
      Alert.alert(
        'Permission needed',
        'Please allow microphone access in Settings to record thoughts.',
      );
      return;
    }
    try {
      const path = await audioService.start();
      audioPathRef.current = path;
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setErrorMsg('Could not start recording. Please try again.');
      setStatus('error');
    }
  }

  async function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    // Snapshot the elapsed time at stop, before any awaits below.
    const recordedSeconds = seconds;
    try {
      await audioService.stop();
      setStatus('transcribing');

      const result = await transcribeAudio(audioPathRef.current);
      setTranscript(result.text);
      setLanguage(result.language);

      await saveNote({
        title: result.text.slice(0, 50) || 'Untitled thought',
        transcript: result.text,
        audioPath: audioPathRef.current,
        language: result.language,
        duration: recordedSeconds,
      });
      setStatus('done');
    } catch {
      // Save the voice note even when transcription fails — the recording
      // itself is the primary capture, text is secondary.
      try {
        await saveNote({
          title: 'Voice note (no transcript)',
          transcript: '',
          audioPath: audioPathRef.current,
          language: 'unknown',
          duration: recordedSeconds,
        });
        setErrorMsg(
          'Transcription failed, but your voice note was saved. You can listen to it in Notes.',
        );
      } catch {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setTranscript('');
    setLanguage('');
    setErrorMsg('');
    setSeconds(0);
  }

  return (
    <View style={styles.container}>
      {status === 'idle' && (
        <View style={styles.center}>
          <TouchableOpacity
            style={styles.micOuter}
            activeOpacity={0.8}
            onPress={startRecording}>
            <View style={styles.micInner}>
              <Icon name="microphone" size={44} color={colors.accentFg} />
            </View>
          </TouchableOpacity>
          <Text style={styles.bigHint}>Tap and speak your mind</Text>
          <Text style={styles.smallHint}>Everything stays on your phone</Text>
        </View>
      )}

      {status === 'recording' && (
        <View style={styles.center}>
          <Animated.View
            style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}
          />
          <TouchableOpacity
            style={styles.stopOuter}
            activeOpacity={0.8}
            onPress={stopRecording}>
            <View style={styles.stopInner}>
              <Icon name="stop" size={36} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.timer}>{formatDuration(seconds)}</Text>
          <Text style={styles.smallHint}>Listening… tap to finish</Text>
        </View>
      )}

      {status === 'transcribing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={styles.bigHint}>Writing it down…</Text>
        </View>
      )}

      {status === 'done' && (
        <ScrollView
          contentContainerStyle={styles.doneWrap}
          showsVerticalScrollIndicator={false}>
          <View style={styles.checkBadge}>
            <Icon name="check" size={26} color={colors.text} />
          </View>
          <Text style={styles.doneTitle}>Saved</Text>
          <View style={styles.resultBox}>
            {!!language && language !== 'unknown' && (
              <Text style={styles.langTag}>{language.toUpperCase()}</Text>
            )}
            <Text style={styles.transcriptText}>
              {transcript || 'No speech detected.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Icon name="plus" size={20} color={colors.accentFg} />
            <Text style={styles.primaryBtnText}>Capture another</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={44} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Icon name="refresh" size={20} color={colors.accentFg} />
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const RING = 150;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    micOuter: {
      width: RING,
      height: RING,
      borderRadius: radius.full,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    micInner: {
      width: RING - 40,
      height: RING - 40,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: RING + 40,
      height: RING + 40,
      borderRadius: radius.full,
      backgroundColor: colors.accentGlow,
    },
    stopOuter: {
      width: RING,
      height: RING,
      borderRadius: radius.full,
      backgroundColor: '#FF5C7A22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopInner: {
      width: RING - 40,
      height: RING - 40,
      borderRadius: radius.full,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timer: {
      fontSize: 44,
      fontWeight: '200',
      color: colors.text,
      letterSpacing: 6,
      fontVariant: ['tabular-nums'],
    },
    bigHint: {
      color: colors.text,
      fontSize: 20,
      fontFamily: 'serif',
      fontStyle: 'italic',
    },
    smallHint: { color: colors.textDim, fontSize: 13 },
    errorText: {
      color: colors.textDim,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.lg,
    },
    doneWrap: { paddingTop: 80, alignItems: 'center' },
    checkBadge: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    doneTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: spacing.lg,
    },
    resultBox: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      width: '100%',
      marginBottom: spacing.lg,
    },
    langTag: {
      color: colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: spacing.sm,
    },
    transcriptText: { color: colors.text, fontSize: 16, lineHeight: 26 },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: 15,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      alignSelf: 'stretch',
    },
    primaryBtnText: {
      color: colors.accentFg,
      fontSize: 15,
      fontWeight: '600',
    },
  });
