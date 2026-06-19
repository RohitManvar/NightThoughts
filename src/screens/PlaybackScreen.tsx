import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { audioService } from '../services/audioService';
import { deleteNote, updateNoteTranscript } from '../database/db';
import { formatDuration } from '../utils/formatDuration';
import { RootStackParamList } from '../types';
import { useTheme } from '../ThemeContext';
import { ThemeColors, radius, spacing } from '../theme';

type Route = RouteProp<RootStackParamList, 'Playback'>;

export default function PlaybackScreen() {
  const { note } = useRoute<Route>().params;
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  // Actual playback length reported by the player; falls back to the recorded
  // duration until the player reports its own (the two clocks can differ).
  const [audioDuration, setAudioDuration] = useState(note.duration);
  const [editing, setEditing] = useState(false);
  const [transcript, setTranscript] = useState(note.transcript);
  const [draft, setDraft] = useState(note.transcript);

  useEffect(() => {
    return () => {
      audioService.stopPlay().catch(() => {});
    };
  }, []);

  async function togglePlay() {
    if (playing) {
      await audioService.stopPlay();
      setPlaying(false);
    } else {
      setPlaying(true);
      setPosition(0);
      try {
        await audioService.play(
          note.audioPath,
          (pos, dur) => {
            setPosition(pos);
            if (dur > 0) setAudioDuration(dur);
          },
          () => {
            setPlaying(false);
            setPosition(0);
          },
        );
      } catch {
        setPlaying(false);
      }
    }
  }

  async function shareThought() {
    const when = dayjs(note.createdAt).format('MMM D, h:mm A');
    await Share.share({
      message: transcript
        ? `${transcript}\n\n— captured with NightThoughts, ${when}`
        : `Voice note captured with NightThoughts, ${when}`,
    });
  }

  function confirmDelete() {
    Alert.alert(
      'Delete this thought?',
      'The voice recording and transcript will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await audioService.stopPlay().catch(() => {});
            await deleteNote(note.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  async function saveEdit() {
    const cleaned = draft.trim();
    await updateNoteTranscript(note.id, cleaned);
    setTranscript(cleaned);
    setEditing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={shareThought}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <Icon
              name="share-variant-outline"
              size={21}
              color={colors.textDim}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
            <Icon name="trash-can-outline" size={21} color={colors.textDim} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.date}>
        {dayjs(note.createdAt).format('dddd, MMMM D · h:mm A')}
      </Text>
      {!!note.language && note.language !== 'unknown' && (
        <Text style={styles.langTag}>{note.language.toUpperCase()}</Text>
      )}

      <View style={styles.player}>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={togglePlay}
          activeOpacity={0.8}>
          <Icon
            name={playing ? 'stop' : 'play'}
            size={30}
            color={colors.accentFg}
          />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(
                  (position / (audioDuration || 1)) * 100,
                  100,
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.duration}>
          {formatDuration(position)} / {formatDuration(audioDuration)}
        </Text>
      </View>

      {editing ? (
        <View style={styles.editBox}>
          <TextInput
            style={styles.editInput}
            multiline
            autoFocus
            value={draft}
            onChangeText={setDraft}
            placeholder="Write what you meant to say…"
            placeholderTextColor={colors.textFaint}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.editCancel}
              onPress={() => {
                setDraft(transcript);
                setEditing(false);
              }}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editSave} onPress={saveEdit}>
              <Icon name="check" size={16} color={colors.accentFg} />
              <Text style={styles.editSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.transcriptBox}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.transcriptText}>
            {transcript || 'No transcript for this note.'}
          </Text>
          <TouchableOpacity
            style={styles.editLink}
            onPress={() => setEditing(true)}>
            <Icon name="pencil-outline" size={14} color={colors.text} />
            <Text style={styles.editLinkText}>Edit transcript</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.lg,
      paddingTop: 56,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    topActions: { flexDirection: 'row', gap: spacing.lg },
    date: { color: colors.textDim, fontSize: 13, marginBottom: 4 },
    langTag: {
      color: colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: spacing.lg,
    },
    player: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    playBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.full,
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.accent,
      borderRadius: 2,
    },
    duration: {
      color: colors.textDim,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    transcriptBox: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    transcriptText: { color: colors.text, fontSize: 16, lineHeight: 28 },
    editLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    editLinkText: { color: colors.text, fontSize: 13, fontWeight: '600' },
    editBox: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    editInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      lineHeight: 26,
      textAlignVertical: 'top',
    },
    editActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    editCancel: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
    },
    editCancelText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
    editSave: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
    },
    editSaveText: {
      color: colors.accentFg,
      fontSize: 14,
      fontWeight: '600',
    },
  });
