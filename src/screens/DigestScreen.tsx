import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getNotes } from '../database/db';
import { computeDigest, Digest } from '../services/digestService';
import { ALL_TAGS, TAG_META } from '../services/taggingService';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';

const BAR_MAX_HEIGHT = 72;

function formatWeekMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

export default function DigestScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [digest, setDigest] = useState<Digest | null>(null);

  useEffect(() => {
    getNotes()
      .then(notes => setDigest(computeDigest(notes)))
      .catch(() => setDigest(computeDigest([])));
  }, []);

  if (!digest) return <View style={styles.container} />;

  const maxCount = Math.max(1, ...digest.days.map(d => d.count));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          This <Text style={styles.titleSerif}>week</Text>
        </Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroNumber}>{digest.weekCount}</Text>
        <Text style={styles.heroLabel}>
          {digest.weekCount === 1
            ? 'thought captured this week'
            : 'thoughts captured this week'}
        </Text>
        {digest.weekSeconds > 0 && (
          <Text style={styles.heroSub}>
            {formatWeekMinutes(digest.weekSeconds)} of voice notes
          </Text>
        )}
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakIconWrap}>
          <Icon
            name={digest.streak > 0 ? 'fire' : 'moon-waning-crescent'}
            size={26}
            color={colors.text}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakNumber}>
            {digest.streak > 0
              ? `${digest.streak}-day streak`
              : 'No streak yet'}
          </Text>
          <Text style={styles.streakHint}>
            {digest.streak > 0
              ? 'Capture a thought every day to keep it going'
              : 'Capture a thought tonight to start one'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Day by day</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          {digest.days.map(day => (
            <View key={day.date} style={styles.barCol}>
              <Text style={styles.barCount}>
                {day.count > 0 ? day.count : ''}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(
                      4,
                      (day.count / maxCount) * BAR_MAX_HEIGHT,
                    ),
                    backgroundColor:
                      day.count > 0 ? colors.accent : colors.cardSoft,
                  },
                ]}
              />
              <Text
                style={[styles.barLabel, day.isToday && styles.barLabelToday]}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Themes</Text>
      <View style={styles.tagsCard}>
        {ALL_TAGS.map(tag => (
          <View key={tag} style={styles.tagRow}>
            <Icon name={TAG_META[tag].icon} size={18} color={colors.textDim} />
            <Text style={styles.tagLabel}>{TAG_META[tag].label}s</Text>
            <Text style={styles.tagCount}>{digest.tagCounts[tag]}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingTop: 64, paddingBottom: 48 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    },
    titleSerif: {
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontWeight: '400',
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      paddingVertical: spacing.xl,
      marginBottom: spacing.md,
    },
    heroNumber: {
      fontSize: 64,
      fontWeight: '200',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    heroLabel: {
      color: colors.text,
      fontSize: 16,
      fontFamily: 'serif',
      fontStyle: 'italic',
      marginTop: 2,
    },
    heroSub: { color: colors.textDim, fontSize: 13, marginTop: 8 },
    streakCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    streakIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakNumber: { color: colors.text, fontSize: 17, fontWeight: '700' },
    streakHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
    sectionTitle: {
      color: colors.textDim,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    barCol: { alignItems: 'center', flex: 1, gap: 6 },
    barCount: {
      color: colors.textDim,
      fontSize: 11,
      fontVariant: ['tabular-nums'],
      height: 14,
    },
    bar: { width: 16, borderRadius: 4 },
    barLabel: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
    barLabelToday: { color: colors.text },
    tagsCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tagLabel: { color: colors.text, fontSize: 14, flex: 1 },
    tagCount: {
      color: colors.textDim,
      fontSize: 14,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
  });
