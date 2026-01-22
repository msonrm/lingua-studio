import { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry, PronounEntry, DeterminerConfig } from '../types/schema';

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
// 代名詞辞書
// ============================================
export const pronouns: PronounEntry[] = [
  // Personal pronouns
  {
    lemma: "I",
    objectForm: "me",
    possessive: "my",
    person: 1,
    number: "singular",
    type: "personal",
  },
  {
    lemma: "you",
    objectForm: "you",
    possessive: "your",
    person: 2,
    number: "singular",
    type: "personal",
  },
  {
    lemma: "he",
    objectForm: "him",
    possessive: "his",
    person: 3,
    number: "singular",
    gender: "masculine",
    type: "personal",
  },
  {
    lemma: "she",
    objectForm: "her",
    possessive: "her",
    person: 3,
    number: "singular",
    gender: "feminine",
    type: "personal",
  },
  {
    lemma: "it",
    objectForm: "it",
    possessive: "its",
    person: 3,
    number: "singular",
    gender: "neuter",
    type: "personal",
  },
  {
    lemma: "we",
    objectForm: "us",
    possessive: "our",
    person: 1,
    number: "plural",
    type: "personal",
  },
  {
    lemma: "they",
    objectForm: "them",
    possessive: "their",
    person: 3,
    number: "plural",
    type: "personal",
  },
  // Indefinite pronouns - polarity sensitive
  {
    lemma: "someone",
    objectForm: "someone",
    person: 3,
    number: "singular",
    type: "indefinite",
    polaritySensitive: true,
    negativeForm: "nobody",
  },
  {
    lemma: "something",
    objectForm: "something",
    person: 3,
    number: "singular",
    gender: "neuter",
    type: "indefinite",
    polaritySensitive: true,
    negativeForm: "nothing",
  },
  // Indefinite pronouns - universal
  {
    lemma: "everyone",
    objectForm: "everyone",
    person: 3,
    number: "singular",
    type: "indefinite",
  },
  {
    lemma: "everything",
    objectForm: "everything",
    person: 3,
    number: "singular",
    gender: "neuter",
    type: "indefinite",
  },
];

// ============================================
// 名詞辞書
// ============================================
export const nouns: NounEntry[] = [
  // ============================================
  // 人間 (human)
  // ============================================
  { lemma: "father", plural: "fathers", category: "human", countable: true },
  { lemma: "mother", plural: "mothers", category: "human", countable: true },
  { lemma: "brother", plural: "brothers", category: "human", countable: true },
  { lemma: "sister", plural: "sisters", category: "human", countable: true },
  { lemma: "son", plural: "sons", category: "human", countable: true },
  { lemma: "daughter", plural: "daughters", category: "human", countable: true },
  { lemma: "friend", plural: "friends", category: "human", countable: true },
  { lemma: "teacher", plural: "teachers", category: "human", countable: true },
  { lemma: "student", plural: "students", category: "human", countable: true },
  { lemma: "doctor", plural: "doctors", category: "human", countable: true },
  { lemma: "child", plural: "children", category: "human", countable: true },
  { lemma: "baby", plural: "babies", category: "human", countable: true },
  { lemma: "man", plural: "men", category: "human", countable: true },
  { lemma: "woman", plural: "women", category: "human", countable: true },
  { lemma: "person", plural: "people", category: "human", countable: true },
  // 固有名詞（人名）
  { lemma: "John", plural: "John", category: "human", countable: true, proper: true },
  { lemma: "Mary", plural: "Mary", category: "human", countable: true, proper: true },
  { lemma: "Tom", plural: "Tom", category: "human", countable: true, proper: true },

  // ============================================
  // 動物・生き物 (animal)
  // ============================================
  { lemma: "cat", plural: "cats", category: "animal", countable: true },
  { lemma: "dog", plural: "dogs", category: "animal", countable: true },
  { lemma: "bird", plural: "birds", category: "animal", countable: true },
  { lemma: "fish", plural: "fish", category: "animal", countable: true },
  { lemma: "horse", plural: "horses", category: "animal", countable: true },
  { lemma: "rabbit", plural: "rabbits", category: "animal", countable: true },
  { lemma: "mouse", plural: "mice", category: "animal", countable: true },
  { lemma: "elephant", plural: "elephants", category: "animal", countable: true },
  { lemma: "lion", plural: "lions", category: "animal", countable: true },
  { lemma: "monkey", plural: "monkeys", category: "animal", countable: true },

  // ============================================
  // 物体 (object)
  // ============================================
  // 食べ物
  { lemma: "apple", plural: "apples", category: "object", countable: true },
  { lemma: "orange", plural: "oranges", category: "object", countable: true },
  { lemma: "bread", plural: "bread", category: "object", countable: false },
  { lemma: "rice", plural: "rice", category: "object", countable: false },
  { lemma: "water", plural: "water", category: "object", countable: false },
  { lemma: "milk", plural: "milk", category: "object", countable: false },
  { lemma: "coffee", plural: "coffee", category: "object", countable: false },
  { lemma: "cake", plural: "cakes", category: "object", countable: true },
  // 道具・物
  { lemma: "pen", plural: "pens", category: "object", countable: true },
  { lemma: "pencil", plural: "pencils", category: "object", countable: true },
  { lemma: "book", plural: "books", category: "object", countable: true },
  { lemma: "bag", plural: "bags", category: "object", countable: true },
  { lemma: "chair", plural: "chairs", category: "object", countable: true },
  { lemma: "table", plural: "tables", category: "object", countable: true },
  { lemma: "phone", plural: "phones", category: "object", countable: true },
  { lemma: "computer", plural: "computers", category: "object", countable: true },
  { lemma: "car", plural: "cars", category: "object", countable: true },
  { lemma: "key", plural: "keys", category: "object", countable: true },
  { lemma: "ball", plural: "balls", category: "object", countable: true },
  { lemma: "flower", plural: "flowers", category: "object", countable: true },
  { lemma: "piano", plural: "pianos", category: "object", countable: true },
  { lemma: "guitar", plural: "guitars", category: "object", countable: true },
  { lemma: "money", plural: "money", category: "object", countable: false },

  // ============================================
  // 場所 (place)
  // ============================================
  // 普通名詞
  { lemma: "home", plural: "homes", category: "place", countable: true, zeroArticle: true },
  { lemma: "school", plural: "schools", category: "place", countable: true, zeroArticle: true },
  { lemma: "office", plural: "offices", category: "place", countable: true },
  { lemma: "hospital", plural: "hospitals", category: "place", countable: true, zeroArticle: true },
  { lemma: "church", plural: "churches", category: "place", countable: true, zeroArticle: true },
  { lemma: "park", plural: "parks", category: "place", countable: true },
  { lemma: "station", plural: "stations", category: "place", countable: true },
  { lemma: "airport", plural: "airports", category: "place", countable: true },
  { lemma: "restaurant", plural: "restaurants", category: "place", countable: true },
  { lemma: "store", plural: "stores", category: "place", countable: true },
  { lemma: "room", plural: "rooms", category: "place", countable: true },
  { lemma: "kitchen", plural: "kitchens", category: "place", countable: true },
  { lemma: "garden", plural: "gardens", category: "place", countable: true },
  // 固有名詞（地名）
  { lemma: "Tokyo", plural: "Tokyo", category: "place", countable: false, proper: true },
  { lemma: "Japan", plural: "Japan", category: "place", countable: false, proper: true },
  { lemma: "America", plural: "America", category: "place", countable: false, proper: true },
  { lemma: "London", plural: "London", category: "place", countable: false, proper: true },
  { lemma: "Paris", plural: "Paris", category: "place", countable: false, proper: true },

  // ============================================
  // 抽象概念 (abstract)
  // ============================================
  // 可算
  { lemma: "idea", plural: "ideas", category: "abstract", countable: true },
  { lemma: "dream", plural: "dreams", category: "abstract", countable: true },
  { lemma: "problem", plural: "problems", category: "abstract", countable: true },
  { lemma: "question", plural: "questions", category: "abstract", countable: true },
  { lemma: "answer", plural: "answers", category: "abstract", countable: true },
  { lemma: "story", plural: "stories", category: "abstract", countable: true },
  { lemma: "song", plural: "songs", category: "abstract", countable: true },
  { lemma: "game", plural: "games", category: "abstract", countable: true },
  // 不可算
  { lemma: "advice", plural: "advice", category: "abstract", countable: false },
  { lemma: "information", plural: "information", category: "abstract", countable: false },
  { lemma: "news", plural: "news", category: "abstract", countable: false },
  { lemma: "music", plural: "music", category: "abstract", countable: false },
  { lemma: "love", plural: "love", category: "abstract", countable: false },
  { lemma: "time", plural: "time", category: "abstract", countable: false },
  { lemma: "work", plural: "work", category: "abstract", countable: false },
  { lemma: "help", plural: "help", category: "abstract", countable: false },
  { lemma: "fun", plural: "fun", category: "abstract", countable: false },
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

export const findPronoun = (lemma: string): PronounEntry | undefined =>
  pronouns.find(p => p.lemma.toLowerCase() === lemma.toLowerCase());

// ============================================
// 限定詞設定ヘルパー
// ============================================
const NONE = '__none__';

export function getDeterminerConfig(noun: NounEntry): DeterminerConfig {
  // 固有名詞：限定詞なし（変更不可）
  if (noun.proper) {
    return {
      defaults: { pre: NONE, central: NONE, post: NONE },
      options: { pre: [NONE], central: [NONE], post: [NONE] },
      disabled: true,
    };
  }

  // 不可算名詞
  if (!noun.countable) {
    return {
      defaults: { pre: NONE, central: NONE, post: NONE },
      options: {
        pre: [NONE, 'all'],
        central: [NONE, 'the', 'this', 'that', 'my', 'your', 'some', 'no'],
        post: [NONE, '__uncountable__'],  // [–] のみ
      },
    };
  }

  // 可算名詞（デフォルト: a/an + 単数）
  return {
    defaults: { pre: NONE, central: 'a', post: NONE },
    options: {
      pre: [NONE, 'all', 'both', 'half'],
      central: [NONE, 'the', 'a', 'this', 'that', 'my', 'your', 'no'],
      post: [NONE, 'one', 'two', 'three', 'many', 'few', 'some', 'several', '__plural__', '__uncountable__'],
    },
  };
}

// カテゴリ別に名詞を取得
export const getNounsByCategory = (category: NounEntry['category']): NounEntry[] =>
  nouns.filter(n => n.category === category);

// 固有名詞かどうかをチェック
export const isProperNoun = (lemma: string): boolean => {
  const noun = findNoun(lemma);
  return noun?.proper === true;
};
