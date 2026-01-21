import { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry } from '../types/schema';

// ============================================
// 動詞辞書
// ============================================
export const verbs: VerbEntry[] = [
  {
    lemma: "sleep",
    forms: {
      base: "sleep",
      past: "slept",
      pp: "slept",
      ing: "sleeping",
      s: "sleeps",
    },
    type: "action",
    valency: [
      { role: "agent", required: true },
    ],
  },
  {
    lemma: "run",
    forms: {
      base: "run",
      past: "ran",
      pp: "run",
      ing: "running",
      s: "runs",
    },
    type: "action",
    valency: [
      { role: "agent", required: true },
    ],
  },
  {
    lemma: "kick",
    forms: {
      base: "kick",
      past: "kicked",
      pp: "kicked",
      ing: "kicking",
      s: "kicks",
    },
    type: "action",
    valency: [
      { role: "agent", required: true },
      { role: "patient", required: true },
    ],
  },
  {
    lemma: "give",
    forms: {
      base: "give",
      past: "gave",
      pp: "given",
      ing: "giving",
      s: "gives",
    },
    type: "action",
    valency: [
      { role: "agent", required: true },
      { role: "theme", required: true },
      { role: "recipient", required: true },
    ],
  },
  {
    lemma: "be",
    forms: {
      base: "be",
      past: "was",
      pp: "been",
      ing: "being",
      s: "is",
      irregular: {
        "present_1sg": "am",
        "present_2sg": "are",
        "present_3sg": "is",
        "present_pl": "are",
        "past_1sg": "was",
        "past_2sg": "were",
        "past_3sg": "was",
        "past_pl": "were",
      },
    },
    type: "copula",
    valency: [
      { role: "theme", required: true },
      { role: "attribute", required: true },
    ],
  },
];

// ============================================
// 名詞辞書
// ============================================
export const nouns: NounEntry[] = [
  {
    lemma: "idea",
    plural: "ideas",
    category: "abstract",
    countable: true,
  },
  {
    lemma: "cat",
    plural: "cats",
    category: "animal",
    countable: true,
  },
  {
    lemma: "dog",
    plural: "dogs",
    category: "animal",
    countable: true,
  },
  {
    lemma: "ball",
    plural: "balls",
    category: "thing",
    countable: true,
  },
  {
    lemma: "book",
    plural: "books",
    category: "thing",
    countable: true,
  },
  {
    lemma: "sky",
    plural: "skies",
    category: "thing",
    countable: false,
  },
];

// ============================================
// 形容詞辞書
// ============================================
export const adjectives: AdjectiveEntry[] = [
  {
    lemma: "colorless",
  },
  {
    lemma: "green",
  },
  {
    lemma: "big",
    comparative: "bigger",
    superlative: "biggest",
  },
  {
    lemma: "small",
    comparative: "smaller",
    superlative: "smallest",
  },
  {
    lemma: "quick",
    comparative: "quicker",
    superlative: "quickest",
  },
  {
    lemma: "lazy",
    comparative: "lazier",
    superlative: "laziest",
  },
  {
    lemma: "blue",
  },
];

// ============================================
// 副詞辞書
// ============================================
export const adverbs: AdverbEntry[] = [
  {
    lemma: "furiously",
    type: "manner",
  },
  {
    lemma: "quickly",
    type: "manner",
  },
  {
    lemma: "slowly",
    type: "manner",
  },
  {
    lemma: "always",
    type: "frequency",
  },
  {
    lemma: "never",
    type: "frequency",
  },
  {
    lemma: "very",
    type: "degree",
  },
];

// ============================================
// 辞書検索ヘルパー
// ============================================
export const findVerb = (lemma: string): VerbEntry | undefined =>
  verbs.find(v => v.lemma === lemma);

export const findNoun = (lemma: string): NounEntry | undefined =>
  nouns.find(n => n.lemma === lemma);

export const findAdjective = (lemma: string): AdjectiveEntry | undefined =>
  adjectives.find(a => a.lemma === lemma);

export const findAdverb = (lemma: string): AdverbEntry | undefined =>
  adverbs.find(a => a.lemma === lemma);
