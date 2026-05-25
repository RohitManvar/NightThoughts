import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getNotes, deleteNote } from '../database/db';
import { Note, RootStackParamList } from '../types';
import NoteCard from '../components/NoteCard';

type Nav = StackNavigationProp<RootStackParamList>;

export default function NotesScreen() {
  const navigation = useNavigation<Nav>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotes);
    return unsubscribe;
  }, [navigation]);

  async function loadNotes() {
    const all = await getNotes();
    setNotes(all);
  }

  async function handleDelete(id: number) {
    await deleteNote(id);
    loadNotes();
  }

  const filtered = notes.filter(n =>
    n.transcript.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Thoughts</Text>

      <View style={styles.searchBox}>
        <Icon name="magnify" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search thoughts..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="thought-bubble-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>No thoughts yet</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('Playback', { note: item })}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: '#444', fontSize: 15 },
});
