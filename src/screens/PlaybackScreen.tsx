import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { audioService } from '../services/audioService';
import { formatDuration } from '../utils/formatDuration';
import { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Playback'>;

export default function PlaybackScreen() {
  const { note } = useRoute<Route>().params;
  const navigation = useNavigation();
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => { audioService.stopPlay(); };
  }, []);

  async function togglePlay() {
    if (playing) {
      await audioService.stopPlay();
      setPlaying(false);
    } else {
      setPlaying(true);
      await audioService.play(note.audioPath, pos => setPosition(pos));
      setPlaying(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.date}>
        {dayjs(note.createdAt).format('ddd, MMM D · h:mm A')}
      </Text>
      <Text style={styles.langTag}>{note.language.toUpperCase()}</Text>

      <View style={styles.player}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
          <Icon name={playing ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${(position / (note.duration || 1)) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.duration}>
          {formatDuration(position)} / {formatDuration(note.duration)}
        </Text>
      </View>

      <ScrollView style={styles.transcriptBox}>
        <Text style={styles.transcriptText}>{note.transcript}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', padding: 24, paddingTop: 60 },
  back: { marginBottom: 20 },
  date: { color: '#888', fontSize: 13, marginBottom: 4 },
  langTag: { color: '#7c6aff', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 24 },
  player: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  playBtn: {
    backgroundColor: '#7c6aff',
    borderRadius: 30,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressBar: { height: 4, backgroundColor: '#7c6aff', borderRadius: 2 },
  duration: { color: '#777', fontSize: 12 },
  transcriptBox: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20 },
  transcriptText: { color: '#eee', fontSize: 16, lineHeight: 28 },
});
