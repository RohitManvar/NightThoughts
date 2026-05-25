import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { Note } from '../types';
import { formatDuration } from '../utils/formatDuration';

interface Props {
  note: Note;
  onPress: () => void;
  onDelete?: () => void;
}

export default function NoteCard({ note, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Icon name="microphone-outline" size={18} color="#7c6aff" />
        </View>
        <View style={styles.content}>
          <Text style={styles.transcript} numberOfLines={2}>
            {note.transcript || 'No transcript'}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {dayjs(note.createdAt).format('MMM D, h:mm A')}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>{formatDuration(note.duration)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.lang}>{note.language.toUpperCase()}</Text>
          </View>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Icon name="delete-outline" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#7c6aff22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  transcript: { color: '#ddd', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#666', fontSize: 11 },
  dot: { color: '#444', fontSize: 11 },
  lang: { color: '#7c6aff', fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 4 },
});
