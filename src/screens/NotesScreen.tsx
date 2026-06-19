import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getNotes, deleteNote } from '../database/db';
import { Note, RootStackParamList, TabParamList } from '../types';
import NoteCard from '../components/NoteCard';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';
import { ALL_TAGS, TAG_META, Tag } from '../services/taggingService';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Notes'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function NotesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<Tag | null>(null);

  const loadNotes = useCallback(async () => {
    const rows = await getNotes({
      search: search.trim() || undefined,
      tag: tagFilter ?? undefined,
    });
    setNotes(rows);
  }, [search, tagFilter]);

  // Reload on focus, and whenever the search/tag filter changes. The search
  // is debounced so we don't hit the DB on every keystroke.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotes);
    return unsubscribe;
  }, [navigation, loadNotes]);

  useEffect(() => {
    const handle = setTimeout(loadNotes, 200);
    return () => clearTimeout(handle);
  }, [loadNotes]);

  function confirmDelete(id: number) {
    Alert.alert(
      'Delete this thought?',
      'The voice recording and transcript will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(id);
            loadNotes();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        All <Text style={styles.titleSerif}>thoughts</Text>
      </Text>

      <View style={styles.searchBox}>
        <Icon name="magnify" size={18} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your thoughts…"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !tagFilter && styles.filterChipActive]}
          onPress={() => setTagFilter(null)}>
          <Text
            style={[
              styles.filterText,
              !tagFilter && styles.filterTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        {ALL_TAGS.map(tag => {
          const active = tagFilter === tag;
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setTagFilter(active ? null : tag)}>
              <Icon
                name={TAG_META[tag].icon}
                size={13}
                color={active ? colors.accentFg : colors.textDim}
              />
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}>
                {TAG_META[tag].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Icon
            name="thought-bubble-outline"
            size={44}
            color={colors.textFaint}
          />
          <Text style={styles.emptyText}>
            {search || tagFilter
              ? 'Nothing matches your filters'
              : 'No thoughts yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('Playback', { note: item })}
              onDelete={() => confirmDelete(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: spacing.lg,
      paddingTop: 64,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: spacing.md,
    },
    titleSerif: {
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontWeight: '400',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 2,
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      paddingVertical: 10,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.card,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
    filterTextActive: { color: colors.accentFg },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    emptyText: { color: colors.textFaint, fontSize: 14 },
  });
