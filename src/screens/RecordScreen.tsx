import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { audioService } from '../services/audioService';
import { transcribeAudio } from '../services/whisperService';
import { saveNote } from '../database/db';
import { formatDuration } from '../utils/formatDuration';

type Status = 'idle' | 'recording' | 'transcribing' | 'done';

export default function RecordScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPathRef = useRef('');

  async function startRecording() {
    const path = await audioService.start();
    audioPathRef.current = path;
    setStatus('recording');
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }

  async function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
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
      duration: seconds,
    });
    setStatus('done');
  }

  function reset() {
    setStatus('idle');
    setTranscript('');
    setLanguage('');
    setSeconds(0);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture Thought</Text>

      {status === 'idle' && (
        <TouchableOpacity style={styles.micBtn} onPress={startRecording}>
          <Icon name="microphone" size={52} color="#fff" />
          <Text style={styles.hint}>Hold to record · speak freely</Text>
        </TouchableOpacity>
      )}

      {status === 'recording' && (
        <View style={styles.center}>
          <View style={styles.pulse} />
          <Text style={styles.timer}>{formatDuration(seconds)}</Text>
          <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
            <Icon name="stop" size={36} color="#fff" />
            <Text style={styles.stopText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'transcribing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c6aff" />
          <Text style={styles.hint}>Transcribing your thought...</Text>
        </View>
      )}

      {status === 'done' && (
        <ScrollView>
          <View style={styles.resultBox}>
            <Text style={styles.langTag}>{language.toUpperCase()}</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={reset}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.newBtnText}>Capture another</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  micBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  hint: { color: '#888', fontSize: 14 },
  pulse: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#7c6aff33',
    borderWidth: 2, borderColor: '#7c6aff',
  },
  timer: { fontSize: 48, fontWeight: '200', color: '#fff', letterSpacing: 4 },
  stopBtn: {
    backgroundColor: '#ff4444',
    borderRadius: 50,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stopText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  langTag: {
    color: '#7c6aff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  transcriptText: { color: '#eee', fontSize: 16, lineHeight: 26 },
  newBtn: {
    backgroundColor: '#7c6aff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
