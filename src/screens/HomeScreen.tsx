import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { getNotes } from '../database/db';
import { Note, RootStackParamList } from '../types';
import NoteCard from '../components/NoteCard';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotes);
    return unsubscribe;
  }, [navigation]);

  async function loadNotes() {
    const notes = await getNotes();
    setRecentNotes(notes.slice(0, 5));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="weather-night" size={28} color="#7c6aff" />
        <Text style={styles.title}>Night Thoughts</Text>
      </View>

      <Text style={styles.greeting}>
        {dayjs().format('ddd, MMM D')} · {recentNotes.length} thoughts captured
      </Text>

      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => navigation.navigate('Record')}>
        <Icon name="microphone" size={36} color="#fff" />
        <Text style={styles.recordBtnText}>Tap to capture a thought</Text>
      </TouchableOpacity>

      {recentNotes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent</Text>
          <FlatList
            data={recentNotes}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => navigation.navigate('Playback', { note: item })}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  greeting: { color: '#888', marginTop: 6, marginBottom: 24, fontSize: 13 },
  recordBtn: {
    backgroundColor: '#7c6aff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: '#aaa', fontSize: 13, marginBottom: 10, letterSpacing: 1 },
});
