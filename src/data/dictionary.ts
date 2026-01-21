import { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry } from '../types/schema';

// ============================================
// 動詞辞書
// ============================================
export const verbs: VerbEntry[] = [
  // 自動詞（agent のみ）
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
      { role: "agent", required: true, label: "who" },
    ],
  },
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
      { role: "agent", required: true, label: "who" },
    ],
  },

  // 他動詞（agent + patient/theme）
  {
    lemma: "eat",
    forms: {
      base: "eat",
      past: "ate",
      pp: "eaten",
      ing: "eating",
      s: "eats",
    },
    type: "action",
    valency: [
      { role: "agent", required: true, label: "who" },
      { role: "patient", required: false, label: "what" },
    ],
  },
  {
    lemma: "make",
    forms: {
      base: "make",
      past: "made",
      pp: "made",
      ing: "making",
      s: "makes",
    },
    type: "action",
    valency: [
      { role: "agent", required: true, label: "who" },
      { role: "patient", required: true, label: "what" },
    ],
  },
  {
    lemma: "watch",
    forms: {
      base: "watch",
      past: "watched",
      pp: "watched",
      ing: "watching",
      s: "watches",
    },
    type: "action",
    valency: [
      { role: "agent", required: true, label: "who" },
      { role: "theme", required: true, label: "what" },
    ],
  },

  // 状態動詞（stative）- 通常進行形不可
  {
    lemma: "like",
    forms: {
      base: "like",
      past: "liked",
      pp: "liked",
      ing: "liking",
      s: "likes",
    },
    type: "stative",
    valency: [
      { role: "experiencer", required: true, label: "who" },
      { role: "stimulus", required: true, label: "what" },
    ],
  },
  {
    lemma: "have",
    forms: {
      base: "have",
      past: "had",
      pp: "had",
      ing: "having",
      s: "has",
    },
    type: "stative",
    valency: [
      { role: "possessor", required: true, label: "who" },
      { role: "theme", required: true, label: "what" },
    ],
  },

  // 授与動詞（agent + theme + recipient）
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
      { role: "agent", required: true, label: "who" },
      { role: "theme", required: true, label: "what" },
      { role: "recipient", required: true, label: "to whom", preposition: "to" },
    ],
  },
  {
    lemma: "show",
    forms: {
      base: "show",
      past: "showed",
      pp: "shown",
      ing: "showing",
      s: "shows",
    },
    type: "action",
    valency: [
      { role: "agent", required: true, label: "who" },
      { role: "theme", required: true, label: "what" },
      { role: "recipient", required: true, label: "to whom", preposition: "to" },
    ],
  },

  // 繋辞動詞（copula）
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
      { role: "theme", required: true, label: "who/what" },
      { role: "attribute", required: true, label: "is what" },
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
