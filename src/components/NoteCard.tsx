import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { Note } from '../types';
import { formatDuration } from '../utils/formatDuration';
import { parseTags, TAG_META } from '../services/taggingService';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';

interface Props {
  note: Note;
  onPress: () => void;
  onDelete?: () => void;
}

export default function NoteCard({ note, onPress, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tags = parseTags(note.tags);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconBox}>
        <Icon name="waveform" size={20} color={colors.text} />
      </View>
      <View style={styles.content}>
        <Text style={styles.transcript} numberOfLines={2}>
          {note.transcript || 'Voice note'}
        </Text>
        <Text style={styles.meta}>
          {dayjs(note.createdAt).format('MMM D · h:mm A')}   ·   {formatDuration(note.duration)}
        </Text>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Icon
                  name={TAG_META[tag].icon}
                  size={11}
                  color={colors.textDim}
                />
                <Text style={styles.tagText}>{TAG_META[tag].label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="trash-can-outline" size={18} color={colors.textFaint} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1 },
    transcript: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    meta: { color: colors.textFaint, fontSize: 11 },
    tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.cardSoft,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tagText: { color: colors.textDim, fontSize: 10, fontWeight: '600' },
    deleteBtn: { padding: 4 },
  });
