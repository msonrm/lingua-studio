import { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry, PronounEntry, DeterminerConfig } from '../types/schema';

// ============================================
// 動詞辞書（意味論的カテゴリ別）
// ============================================
export const verbs: VerbEntry[] = [
  // ============================================
  // Motion（移動）
  // ============================================
  {
    lemma: "run",
    forms: { base: "run", past: "ran", pp: "run", ing: "running", s: "runs" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "walk",
    forms: { base: "walk", past: "walked", pp: "walked", ing: "walking", s: "walks" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "go",
    forms: { base: "go", past: "went", pp: "gone", ing: "going", s: "goes" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "come",
    forms: { base: "come", past: "came", pp: "come", ing: "coming", s: "comes" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "fly",
    forms: { base: "fly", past: "flew", pp: "flown", ing: "flying", s: "flies" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "swim",
    forms: { base: "swim", past: "swam", pp: "swum", ing: "swimming", s: "swims" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "jump",
    forms: { base: "jump", past: "jumped", pp: "jumped", ing: "jumping", s: "jumps" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "fall",
    forms: { base: "fall", past: "fell", pp: "fallen", ing: "falling", s: "falls" },
    type: "action",
    category: "motion",
    valency: [{ role: "theme", required: true, label: "theme" }],
  },
  {
    lemma: "arrive",
    forms: { base: "arrive", past: "arrived", pp: "arrived", ing: "arriving", s: "arrives" },
    type: "action",
    category: "motion",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "leave",
    forms: { base: "leave", past: "left", pp: "left", ing: "leaving", s: "leaves" },
    type: "action",
    category: "motion",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "source", required: false, label: "place" },
    ],
  },

  // ============================================
  // Action（動作・創造）
  // ============================================
  {
    lemma: "eat",
    forms: { base: "eat", past: "ate", pp: "eaten", ing: "eating", s: "eats" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: false, label: "patient" },
    ],
  },
  {
    lemma: "make",
    forms: { base: "make", past: "made", pp: "made", ing: "making", s: "makes" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "build",
    forms: { base: "build", past: "built", pp: "built", ing: "building", s: "builds" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "break",
    forms: { base: "break", past: "broke", pp: "broken", ing: "breaking", s: "breaks" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "cut",
    forms: { base: "cut", past: "cut", pp: "cut", ing: "cutting", s: "cuts" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "open",
    forms: { base: "open", past: "opened", pp: "opened", ing: "opening", s: "opens" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "close",
    forms: { base: "close", past: "closed", pp: "closed", ing: "closing", s: "closes" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "patient", required: true, label: "patient" },
    ],
  },
  {
    lemma: "read",
    forms: { base: "read", past: "read", pp: "read", ing: "reading", s: "reads" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "write",
    forms: { base: "write", past: "wrote", pp: "written", ing: "writing", s: "writes" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "play",
    forms: { base: "play", past: "played", pp: "played", ing: "playing", s: "plays" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "sleep",
    forms: { base: "sleep", past: "slept", pp: "slept", ing: "sleeping", s: "sleeps" },
    type: "action",
    category: "action",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "put",
    forms: { base: "put", past: "put", pp: "put", ing: "putting", s: "puts" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "goal", required: true, label: "goal", preposition: "on" },
    ],
  },
  {
    lemma: "place",
    forms: { base: "place", past: "placed", pp: "placed", ing: "placing", s: "places" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "goal", required: true, label: "goal", preposition: "on" },
    ],
  },
  {
    lemma: "hang",
    forms: { base: "hang", past: "hung", pp: "hung", ing: "hanging", s: "hangs" },
    type: "action",
    category: "action",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "goal", required: true, label: "goal", preposition: "on" },
    ],
  },

  // ============================================
  // Transfer（授受・移転）
  // ============================================
  {
    lemma: "give",
    forms: { base: "give", past: "gave", pp: "given", ing: "giving", s: "gives" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "recipient", required: true, label: "recipient", preposition: "to" },
    ],
  },
  {
    lemma: "take",
    forms: { base: "take", past: "took", pp: "taken", ing: "taking", s: "takes" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "send",
    forms: { base: "send", past: "sent", pp: "sent", ing: "sending", s: "sends" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "recipient", required: false, label: "recipient", preposition: "to" },
    ],
  },
  {
    lemma: "receive",
    forms: { base: "receive", past: "received", pp: "received", ing: "receiving", s: "receives" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "recipient", required: true, label: "recipient" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "bring",
    forms: { base: "bring", past: "brought", pp: "brought", ing: "bringing", s: "brings" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "buy",
    forms: { base: "buy", past: "bought", pp: "bought", ing: "buying", s: "buys" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "sell",
    forms: { base: "sell", past: "sold", pp: "sold", ing: "selling", s: "sells" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "show",
    forms: { base: "show", past: "showed", pp: "shown", ing: "showing", s: "shows" },
    type: "action",
    category: "transfer",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
      { role: "recipient", required: false, label: "recipient", preposition: "to" },
    ],
  },

  // ============================================
  // Cognition（認知・知覚）
  // ============================================
  {
    lemma: "think",
    forms: { base: "think", past: "thought", pp: "thought", ing: "thinking", s: "thinks" },
    type: "stative",
    category: "cognition",
    valency: [{ role: "experiencer", required: true, label: "experiencer" }],
  },
  {
    lemma: "know",
    forms: { base: "know", past: "knew", pp: "known", ing: "knowing", s: "knows" },
    type: "stative",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "believe",
    forms: { base: "believe", past: "believed", pp: "believed", ing: "believing", s: "believes" },
    type: "stative",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "understand",
    forms: { base: "understand", past: "understood", pp: "understood", ing: "understanding", s: "understands" },
    type: "stative",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "see",
    forms: { base: "see", past: "saw", pp: "seen", ing: "seeing", s: "sees" },
    type: "action",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "stimulus", required: true, label: "stimulus" },
    ],
  },
  {
    lemma: "hear",
    forms: { base: "hear", past: "heard", pp: "heard", ing: "hearing", s: "hears" },
    type: "action",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "stimulus", required: true, label: "stimulus" },
    ],
  },
  {
    lemma: "feel",
    forms: { base: "feel", past: "felt", pp: "felt", ing: "feeling", s: "feels" },
    type: "stative",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "stimulus", required: false, label: "stimulus" },
    ],
  },
  {
    lemma: "remember",
    forms: { base: "remember", past: "remembered", pp: "remembered", ing: "remembering", s: "remembers" },
    type: "stative",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "forget",
    forms: { base: "forget", past: "forgot", pp: "forgotten", ing: "forgetting", s: "forgets" },
    type: "action",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "learn",
    forms: { base: "learn", past: "learned", pp: "learned", ing: "learning", s: "learns" },
    type: "action",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "watch",
    forms: { base: "watch", past: "watched", pp: "watched", ing: "watching", s: "watches" },
    type: "action",
    category: "cognition",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "stimulus", required: true, label: "stimulus" },
    ],
  },

  // ============================================
  // Communication（伝達）
  // ============================================
  {
    lemma: "say",
    forms: { base: "say", past: "said", pp: "said", ing: "saying", s: "says" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "tell",
    forms: { base: "tell", past: "told", pp: "told", ing: "telling", s: "tells" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "recipient", required: true, label: "recipient" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "speak",
    forms: { base: "speak", past: "spoke", pp: "spoken", ing: "speaking", s: "speaks" },
    type: "action",
    category: "communication",
    valency: [{ role: "agent", required: true, label: "agent" }],
  },
  {
    lemma: "ask",
    forms: { base: "ask", past: "asked", pp: "asked", ing: "asking", s: "asks" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "recipient", required: false, label: "recipient" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "answer",
    forms: { base: "answer", past: "answered", pp: "answered", ing: "answering", s: "answers" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: false, label: "theme" },
    ],
  },
  {
    lemma: "call",
    forms: { base: "call", past: "called", pp: "called", ing: "calling", s: "calls" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "recipient", required: true, label: "recipient" },
    ],
  },
  {
    lemma: "explain",
    forms: { base: "explain", past: "explained", pp: "explained", ing: "explaining", s: "explains" },
    type: "action",
    category: "communication",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "theme", required: true, label: "theme" },
    ],
  },

  // ============================================
  // State（状態・存在）
  // ============================================
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
    category: "state",
    valency: [
      { role: "theme", required: true, label: "subject" },
      { role: "attribute", required: true, label: "attribute" },
    ],
  },
  {
    lemma: "have",
    forms: { base: "have", past: "had", pp: "had", ing: "having", s: "has" },
    type: "stative",
    category: "state",
    valency: [
      { role: "possessor", required: true, label: "possessor" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "like",
    forms: { base: "like", past: "liked", pp: "liked", ing: "liking", s: "likes" },
    type: "stative",
    category: "state",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "stimulus", required: true, label: "stimulus" },
    ],
  },
  {
    lemma: "want",
    forms: { base: "want", past: "wanted", pp: "wanted", ing: "wanting", s: "wants" },
    type: "stative",
    category: "state",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "need",
    forms: { base: "need", past: "needed", pp: "needed", ing: "needing", s: "needs" },
    type: "stative",
    category: "state",
    valency: [
      { role: "experiencer", required: true, label: "experiencer" },
      { role: "theme", required: true, label: "theme" },
    ],
  },
  {
    lemma: "live",
    forms: { base: "live", past: "lived", pp: "lived", ing: "living", s: "lives" },
    type: "stative",
    category: "state",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "location", required: true, label: "location", preposition: "in" },
    ],
  },
  {
    lemma: "reside",
    forms: { base: "reside", past: "resided", pp: "resided", ing: "residing", s: "resides" },
    type: "stative",
    category: "state",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "location", required: true, label: "location", preposition: "in" },
    ],
  },
  {
    lemma: "stay",
    forms: { base: "stay", past: "stayed", pp: "stayed", ing: "staying", s: "stays" },
    type: "stative",
    category: "state",
    valency: [
      { role: "agent", required: true, label: "agent" },
      { role: "location", required: true, label: "location", preposition: "at" },
    ],
  },
  {
    lemma: "seem",
    forms: { base: "seem", past: "seemed", pp: "seemed", ing: "seeming", s: "seems" },
    type: "stative",
    category: "state",
    valency: [
      { role: "theme", required: true, label: "subject" },
      { role: "attribute", required: false, label: "attribute" },
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
  // Demonstrative pronouns
  {
    lemma: "this",
    objectForm: "this",
    person: 3,
    number: "singular",
    type: "demonstrative",
  },
  {
    lemma: "that",
    objectForm: "that",
    person: 3,
    number: "singular",
    type: "demonstrative",
  },
  {
    lemma: "these",
    objectForm: "these",
    person: 3,
    number: "plural",
    type: "demonstrative",
  },
  {
    lemma: "those",
    objectForm: "those",
    person: 3,
    number: "plural",
    type: "demonstrative",
  },
  // Interrogative pronouns (question words)
  {
    lemma: "?who",
    objectForm: "?whom",
    person: 3,
    number: "singular",
    type: "interrogative",
  },
  {
    lemma: "?what",
    objectForm: "?what",
    person: 3,
    number: "singular",
    gender: "neuter",
    type: "interrogative",
  },
  // Possessive pronouns (mine, yours, etc.)
  {
    lemma: "mine",
    objectForm: "mine",
    person: 1,
    number: "singular",
    type: "possessive",
    correspondingPersonal: "I",
  },
  {
    lemma: "yours",
    objectForm: "yours",
    person: 2,
    number: "singular",  // also works for plural "you"
    type: "possessive",
    correspondingPersonal: "you",
  },
  {
    lemma: "his",
    objectForm: "his",
    person: 3,
    number: "singular",
    gender: "masculine",
    type: "possessive",
    correspondingPersonal: "he",
  },
  {
    lemma: "hers",
    objectForm: "hers",
    person: 3,
    number: "singular",
    gender: "feminine",
    type: "possessive",
    correspondingPersonal: "she",
  },
  {
    lemma: "ours",
    objectForm: "ours",
    person: 1,
    number: "plural",
    type: "possessive",
    correspondingPersonal: "we",
  },
  {
    lemma: "theirs",
    objectForm: "theirs",
    person: 3,
    number: "plural",
    type: "possessive",
    correspondingPersonal: "they",
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
  { lemma: "telescope", plural: "telescopes", category: "object", countable: true },
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
// 形容詞辞書（Dixon's semantic types）
// ============================================
export const adjectives: AdjectiveEntry[] = [
  // ============================================
  // Size（寸法）
  // ============================================
  { lemma: "big", category: "size", comparative: "bigger", superlative: "biggest" },
  { lemma: "small", category: "size", comparative: "smaller", superlative: "smallest" },
  { lemma: "large", category: "size", comparative: "larger", superlative: "largest" },
  { lemma: "little", category: "size" },
  { lemma: "tall", category: "size", comparative: "taller", superlative: "tallest" },
  { lemma: "short", category: "size", comparative: "shorter", superlative: "shortest" },
  { lemma: "long", category: "size", comparative: "longer", superlative: "longest" },
  { lemma: "wide", category: "size", comparative: "wider", superlative: "widest" },
  { lemma: "narrow", category: "size", comparative: "narrower", superlative: "narrowest" },
  { lemma: "huge", category: "size" },
  { lemma: "tiny", category: "size" },

  // ============================================
  // Age（年齢・新旧）
  // ============================================
  { lemma: "old", category: "age", comparative: "older", superlative: "oldest" },
  { lemma: "young", category: "age", comparative: "younger", superlative: "youngest" },
  { lemma: "new", category: "age", comparative: "newer", superlative: "newest" },
  { lemma: "ancient", category: "age" },
  { lemma: "modern", category: "age" },
  { lemma: "fresh", category: "age", comparative: "fresher", superlative: "freshest" },

  // ============================================
  // Color（色）
  // ============================================
  { lemma: "red", category: "color" },
  { lemma: "blue", category: "color" },
  { lemma: "green", category: "color" },
  { lemma: "yellow", category: "color" },
  { lemma: "black", category: "color" },
  { lemma: "white", category: "color" },
  { lemma: "brown", category: "color" },
  { lemma: "orange", category: "color" },
  { lemma: "pink", category: "color" },
  { lemma: "purple", category: "color" },
  { lemma: "gray", category: "color" },
  { lemma: "colorless", category: "color" },

  // ============================================
  // Physical（物理的性質）
  // ============================================
  { lemma: "hard", category: "physical", comparative: "harder", superlative: "hardest" },
  { lemma: "soft", category: "physical", comparative: "softer", superlative: "softest" },
  { lemma: "heavy", category: "physical", comparative: "heavier", superlative: "heaviest" },
  { lemma: "light", category: "physical", comparative: "lighter", superlative: "lightest" },
  { lemma: "hot", category: "physical", comparative: "hotter", superlative: "hottest" },
  { lemma: "cold", category: "physical", comparative: "colder", superlative: "coldest" },
  { lemma: "warm", category: "physical", comparative: "warmer", superlative: "warmest" },
  { lemma: "wet", category: "physical", comparative: "wetter", superlative: "wettest" },
  { lemma: "dry", category: "physical", comparative: "drier", superlative: "driest" },
  { lemma: "rough", category: "physical", comparative: "rougher", superlative: "roughest" },
  { lemma: "smooth", category: "physical", comparative: "smoother", superlative: "smoothest" },
  { lemma: "quick", category: "physical", comparative: "quicker", superlative: "quickest" },
  { lemma: "slow", category: "physical", comparative: "slower", superlative: "slowest" },
  { lemma: "loud", category: "physical", comparative: "louder", superlative: "loudest" },
  { lemma: "quiet", category: "physical", comparative: "quieter", superlative: "quietest" },

  // ============================================
  // Quality（価値・評価）
  // ============================================
  { lemma: "good", category: "quality", comparative: "better", superlative: "best" },
  { lemma: "bad", category: "quality", comparative: "worse", superlative: "worst" },
  { lemma: "nice", category: "quality", comparative: "nicer", superlative: "nicest" },
  { lemma: "great", category: "quality" },
  { lemma: "beautiful", category: "quality" },
  { lemma: "ugly", category: "quality", comparative: "uglier", superlative: "ugliest" },
  { lemma: "wonderful", category: "quality" },
  { lemma: "terrible", category: "quality" },
  { lemma: "important", category: "quality" },
  { lemma: "perfect", category: "quality" },

  // ============================================
  // Emotion（感情・性格）
  // ============================================
  { lemma: "happy", category: "emotion", comparative: "happier", superlative: "happiest" },
  { lemma: "sad", category: "emotion", comparative: "sadder", superlative: "saddest" },
  { lemma: "angry", category: "emotion", comparative: "angrier", superlative: "angriest" },
  { lemma: "tired", category: "emotion" },
  { lemma: "excited", category: "emotion" },
  { lemma: "scared", category: "emotion" },
  { lemma: "brave", category: "emotion", comparative: "braver", superlative: "bravest" },
  { lemma: "kind", category: "emotion", comparative: "kinder", superlative: "kindest" },
  { lemma: "lazy", category: "emotion", comparative: "lazier", superlative: "laziest" },
  { lemma: "clever", category: "emotion", comparative: "cleverer", superlative: "cleverest" },
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
  // 場所副詞（locative adverbs）
  {
    lemma: "here",
    type: "place",
  },
  {
    lemma: "there",
    type: "place",
  },
  {
    lemma: "somewhere",
    type: "place",
    polaritySensitive: true,  // 肯定文で使用
  },
  {
    lemma: "anywhere",
    type: "place",
    polaritySensitive: true,  // 否定文・疑問文で使用
  },
  {
    lemma: "everywhere",
    type: "place",
  },
  {
    lemma: "nowhere",
    type: "place",
  },
  {
    lemma: "home",
    type: "place",
  },
  // 疑問副詞（interrogative adverbs）
  {
    lemma: "?where",
    type: "place",
  },
  {
    lemma: "?when",
    type: "time",
  },
  {
    lemma: "?how",
    type: "manner",
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

// カテゴリ別に動詞を取得
export const getVerbsByCategory = (category: VerbEntry['category']): VerbEntry[] =>
  verbs.filter(v => v.category === category);

// カテゴリ別に形容詞を取得
export const getAdjectivesByCategory = (category: AdjectiveEntry['category']): AdjectiveEntry[] =>
  adjectives.filter(a => a.category === category);

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
