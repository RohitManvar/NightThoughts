import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { getNotes } from '../database/db';
import {
  isReminderEnabled,
  enableReminder,
  disableReminder,
  getReminderTime,
} from '../services/reminderService';
import { Note, RootStackParamList, TabParamList } from '../types';
import { computeDigest } from '../services/digestService';
import NoteCard from '../components/NoteCard';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function greeting(): string {
  const h = dayjs().hour();
  if (h >= 21 || h < 4) return 'Good night';
  if (h >= 17) return 'Good evening';
  if (h >= 12) return 'Good afternoon';
  return 'Good morning';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reminderOn, setReminderOn] = useState(false);
  const [weekCount, setWeekCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const loadNotes = useCallback(async () => {
    const notes = await getNotes();
    setTotalCount(notes.length);
    setRecentNotes(notes.slice(0, 5));
    const digest = computeDigest(notes);
    setWeekCount(digest.weekCount);
    setStreak(digest.streak);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotes();
      isReminderEnabled().then(setReminderOn).catch(() => {});
    });
    return unsubscribe;
  }, [navigation, loadNotes]);

  async function toggleReminder() {
    try {
      if (reminderOn) {
        await disableReminder();
        setReminderOn(false);
        Alert.alert('Reminder off', 'Bedtime reminders are disabled.');
      } else {
        const ok = await enableReminder();
        if (ok) {
          setReminderOn(true);
          const t = await getReminderTime();
          const when = dayjs(`2000-01-01T${t}`).format('h:mm A');
          Alert.alert(
            'Reminder on 🌙',
            `You'll get a gentle nudge at ${when} every night. Change the time in Settings.`,
          );
        } else {
          Alert.alert(
            'Notifications blocked',
            'Please allow notifications for NightThoughts in Settings.',
          );
        }
      }
    } catch {
      Alert.alert('Oops', 'Could not update the reminder. Try again.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.greetingSerif}>what's on your mind?</Text>
          <Text style={styles.date}>
            {dayjs().format('dddd, MMMM D')}
            {totalCount > 0 ? `  ·  ${totalCount} thoughts` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.moonBadge, reminderOn && styles.moonBadgeActive]}
          onPress={toggleReminder}
          activeOpacity={0.7}>
          <Icon
            name={reminderOn ? 'bell-ring' : 'bell-outline'}
            size={20}
            color={reminderOn ? colors.text : colors.textDim}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.hero}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Record')}>
        <View style={styles.pill}>
          <Icon name="check-circle-outline" size={13} color={colors.text} />
          <Text style={styles.pillText}>100% private · offline</Text>
        </View>
        <View style={styles.heroRing}>
          <View style={styles.heroInner}>
            <Icon name="microphone" size={34} color={colors.accentFg} />
          </View>
        </View>
        <Text style={styles.heroTitle}>Capture a thought</Text>
        <Text style={styles.heroHint}>Tap, speak, sleep</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.digestCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Digest')}>
        <Icon name="chart-timeline-variant" size={18} color={colors.textDim} />
        <Text style={styles.digestText}>
          {weekCount === 1 ? '1 thought' : `${weekCount} thoughts`} this week
          {streak > 0 ? `  ·  🔥 ${streak}-day streak` : ''}
        </Text>
        <Icon name="chevron-right" size={18} color={colors.textFaint} />
      </TouchableOpacity>

      {recentNotes.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notes')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentNotes}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => navigation.navigate('Playback', { note: item })}
              />
            )}
          />
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your thoughts will appear here</Text>
        </View>
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
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 64,
      marginBottom: spacing.xl,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    },
    greetingSerif: {
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontSize: 26,
      color: colors.text,
      marginTop: 2,
    },
    date: { color: colors.textDim, marginTop: 8, fontSize: 13 },
    moonBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moonBadgeActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    hero: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xl,
      marginBottom: spacing.xl,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 5,
      marginBottom: spacing.md,
    },
    pillText: { color: colors.text, fontSize: 11, fontWeight: '600' },
    heroRing: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      backgroundColor: colors.accentGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    heroInner: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
    heroHint: { color: colors.textDim, fontSize: 13, marginTop: 4 },
    digestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      marginBottom: spacing.lg,
    },
    digestText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      color: colors.textDim,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    seeAll: { color: colors.text, fontSize: 13, fontWeight: '600' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: colors.textFaint, fontSize: 14 },
  });
