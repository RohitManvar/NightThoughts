import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { useTheme, ThemeMode } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';
import {
  isReminderEnabled,
  enableReminder,
  disableReminder,
  getReminderTime,
  setReminderTime,
} from '../services/reminderService';

const pad = (n: number) => String(n).padStart(2, '0');

// Evening hours first — it's a bedtime app.
const HOURS = Array.from({ length: 24 }, (_, i) => (i + 18) % 24);
const MINUTES = [0, 15, 30, 45];

function displayTime(hhmm: string): string {
  return dayjs(`2000-01-01T${hhmm}`).format('h:mm A');
}

function hourLabel(h: number): string {
  return dayjs(`2000-01-01T${pad(h)}:00`).format('h A');
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reminderOn, setReminderOn] = useState(false);
  const [time, setTime] = useState('22:00');

  useEffect(() => {
    isReminderEnabled().then(setReminderOn).catch(() => {});
    getReminderTime().then(setTime).catch(() => {});
  }, []);

  async function toggleReminder(value: boolean) {
    try {
      if (value) {
        const ok = await enableReminder();
        if (!ok) {
          Alert.alert(
            'Notifications blocked',
            'Please allow notifications for NightThoughts in your phone settings.',
          );
          setReminderOn(false);
          return;
        }
        setReminderOn(true);
      } else {
        await disableReminder();
        setReminderOn(false);
      }
    } catch {
      Alert.alert('Oops', 'Could not update the reminder. Try again.');
    }
  }

  async function pickTime(t: string) {
    setTime(t);
    try {
      await setReminderTime(t);
    } catch {
      Alert.alert('Oops', 'Could not save the reminder time.');
    }
  }

  const [selectedHour, selectedMinute] = time.split(':').map(Number);

  function ThemeOption({
    value,
    label,
    hint,
    icon,
  }: {
    value: ThemeMode;
    label: string;
    hint: string;
    icon: string;
  }) {
    const selected = mode === value;
    return (
      <TouchableOpacity
        style={[styles.optionRow, selected && styles.optionRowSelected]}
        activeOpacity={0.7}
        onPress={() => setMode(value)}>
        <View style={styles.optionIcon}>
          <Icon name={icon} size={18} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionLabel}>{label}</Text>
          <Text style={styles.optionHint}>{hint}</Text>
        </View>
        <Icon
          name={selected ? 'radiobox-marked' : 'radiobox-blank'}
          size={20}
          color={selected ? colors.text : colors.textFaint}
        />
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>
        Make it <Text style={styles.titleSerif}>yours</Text>
      </Text>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.card}>
        <ThemeOption
          value="light"
          label="Light"
          hint="Paper white, for daytime"
          icon="white-balance-sunny"
        />
        <View style={styles.divider} />
        <ThemeOption
          value="dark"
          label="Dark"
          hint="Midnight paper, easy on sleepy eyes"
          icon="weather-night"
        />
        <View style={styles.divider} />
        <ThemeOption
          value="system"
          label="System"
          hint="Match your phone's day/night setting"
          icon="theme-light-dark"
        />
      </View>

      <Text style={styles.sectionTitle}>Bedtime reminder</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>Daily reminder</Text>
            <Text style={styles.optionHint}>
              A gentle nudge to capture your thoughts
            </Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.card}
          />
        </View>

        {reminderOn && (
          <>
            <View style={styles.divider} />
            <Text style={styles.timeLabel}>
              Remind me at {displayTime(time)}
            </Text>

            <Text style={styles.pickerLabel}>Hour</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourScroll}>
              {HOURS.map(h => {
                const selected = h === selectedHour;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.chip, selected && styles.chipSelected]}
                    activeOpacity={0.7}
                    onPress={() => pickTime(`${pad(h)}:${pad(selectedMinute)}`)}>
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}>
                      {hourLabel(h)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.pickerLabel}>Minute</Text>
            <View style={styles.chips}>
              {MINUTES.map(m => {
                const selected = m === selectedMinute;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, selected && styles.chipSelected]}
                    activeOpacity={0.7}
                    onPress={() => pickTime(`${pad(selectedHour)}:${pad(m)}`)}>
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}>
                      :{pad(m)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Icon name="shield-check-outline" size={18} color={colors.textDim} />
          <Text style={styles.aboutText}>
            100% private — recordings and transcripts never leave this phone
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Icon name="weather-night" size={18} color={colors.textDim} />
          <Text style={styles.aboutText}>NightThoughts v1.0</Text>
        </View>
      </View>
    </ScrollView>
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
      marginBottom: spacing.lg,
    },
    titleSerif: {
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontWeight: '400',
    },
    sectionTitle: {
      color: colors.textDim,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    optionRowSelected: {},
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
    optionHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    timeLabel: {
      color: colors.textDim,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    pickerLabel: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    hourScroll: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingRight: spacing.md,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: colors.card,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
    chipTextSelected: { color: colors.accentFg },
    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    aboutText: { color: colors.textDim, fontSize: 13, flex: 1, lineHeight: 19 },
  });
