/**
 * Fully offline auto-tagging. Simple keyword rules classify a transcript
 * into themes; a note can carry several tags, stored comma-separated.
 */
export type Tag = 'idea' | 'todo' | 'worry';

export const TAG_META: Record<Tag, { label: string; icon: string }> = {
  idea: { label: 'Idea', icon: 'lightbulb-outline' },
  todo: { label: 'To-do', icon: 'checkbox-marked-circle-outline' },
  worry: { label: 'Worry', icon: 'weather-cloudy' },
};

export const ALL_TAGS: Tag[] = ['idea', 'todo', 'worry'];

// English patterns use word boundaries; Devanagari keywords are matched as
// plain substrings because \b doesn't work across Unicode scripts.
const RULES: { tag: Tag; en: RegExp; hi: string[] }[] = [
  {
    tag: 'todo',
    en: /\b(need to|have to|has to|must|should|remember to|don'?t forget|forget to|deadline|due|tomorrow|to-?do|buy|order|call|text|email|send|finish|submit|pay|book|schedule|appointment|meeting|fix|renew|pick up|task|errand)\b/i,
    hi: ['करना है', 'करनी है', 'करने है', 'याद रख', 'भूलना नहीं', 'खरीद', 'भेजना', 'जमा', 'मीटिंग', 'काम है'],
  },
  {
    tag: 'worry',
    en: /\b(worried|worry|worrying|anxious|anxiety|scared|afraid|fear|nervous|stress(ed|ful)?|tension|overwhelmed|can'?t sleep|what if|panic|upset|sad|depressed|guilt|regret|problem)\b/i,
    hi: ['चिंता', 'डर', 'परेशान', 'टेंशन', 'घबरा', 'नींद नहीं', 'दुखी', 'उदास', 'दिक्कत', 'समस्या'],
  },
  {
    tag: 'idea',
    en: /\b(idea|what (about|if we)|maybe (i|we) (could|should|can)|imagine|concept|invent|build|create|design|startup|project|app|feature|story|plot|melody|lyrics|theory|experiment)\b/i,
    hi: ['आइडिया', 'विचार', 'सोच रहा', 'सोच रही', 'बना सकते', 'कहानी', 'प्रोजेक्ट'],
  },
];

export function detectTags(text: string): Tag[] {
  if (!text) return [];
  const tags: Tag[] = [];
  for (const rule of RULES) {
    if (rule.en.test(text) || rule.hi.some(k => text.includes(k))) {
      tags.push(rule.tag);
    }
  }
  return tags;
}

/** Serialize for the notes.tags TEXT column. */
export function tagsToString(tags: Tag[]): string {
  return tags.join(',');
}

/** Parse the notes.tags TEXT column, dropping anything unknown. */
export function parseTags(tags: string | null | undefined): Tag[] {
  if (!tags) return [];
  return tags
    .split(',')
    .filter((t): t is Tag => ALL_TAGS.includes(t as Tag));
}
