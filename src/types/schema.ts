// ============================================
// 辞書エントリの型定義
// ============================================

export type SemanticRole =
  | "agent"        // 動作主
  | "patient"      // 被動者
  | "theme"        // 主題
  | "experiencer"  // 経験者
  | "stimulus"     // 刺激
  | "recipient"    // 受領者
  | "beneficiary"  // 受益者
  | "goal"         // 到達点
  | "source"       // 起点
  | "location"     // 場所
  | "instrument"   // 道具
  | "possessor"    // 所有者（have用）
  | "attribute";   // 属性（繋辞動詞用）

export interface ArgumentSlot {
  role: SemanticRole;
  required: boolean;
  preposition?: string;
  label?: string;  // UI表示用のラベル（例: "what", "to whom"）
}

export interface VerbEntry {
  lemma: string;
  forms: {
    base: string;
    past: string;
    pp: string;
    ing: string;
    s: string;
    irregular?: Record<string, string>;
  };
  type: "action" | "stative" | "copula";
  valency: ArgumentSlot[];
}

export interface NounEntry {
  lemma: string;
  plural: string;
  category?: "human" | "animal" | "thing" | "place" | "abstract" | "time";
  countable: boolean;
}

export interface PronounEntry {
  lemma: string;           // 基本形（主格）
  objectForm: string;      // 目的格
  possessive?: string;     // 所有格（オプション）
  person: 1 | 2 | 3;
  number: "singular" | "plural";
  gender?: "masculine" | "feminine" | "neuter";
  type: "personal" | "indefinite";
  polaritySensitive?: boolean;  // someone/anyone など
  negativeForm?: string;        // nobody, nothing など
}

export interface AdjectiveEntry {
  lemma: string;
  comparative?: string;
  superlative?: string;
}

export interface AdverbEntry {
  lemma: string;
  type: "manner" | "frequency" | "degree" | "time" | "place";
}

// ============================================
// ASTノードの型定義
// ============================================

export interface SentenceNode {
  type: "sentence";
  clause: ClauseNode;
  sentenceType: "declarative" | "imperative";
  timeAdverbial?: string;  // TimeChipから生成される時間副詞（Yesterday, Now など）
}

export interface ClauseNode {
  type: "clause";
  verbPhrase: VerbPhraseNode;
  tense: "past" | "present" | "future";
  aspect: "simple" | "progressive" | "perfect" | "perfectProgressive";
  polarity: "affirmative" | "negative";
}

export interface VerbPhraseNode {
  type: "verbPhrase";
  verb: { lemma: string };
  arguments: FilledArgumentSlot[];
  adverbs: AdverbNode[];
}

export interface FilledArgumentSlot {
  role: SemanticRole;
  filler: NounPhraseNode | AdjectivePhraseNode | null;
}

export interface NounPhraseNode {
  type: "nounPhrase";
  determiner?: { kind: "definite" | "indefinite" | "none"; lexeme?: string };
  adjectives: { lemma: string }[];
  head: NounHead | PronounHead;
}

export interface NounHead {
  type: "noun";
  lemma: string;
  number: "singular" | "plural";
}

export interface PronounHead {
  type: "pronoun";
  lemma: string;           // 代名詞の基本形（I, you, he など）
  person: 1 | 2 | 3;
  number: "singular" | "plural";
  pronounType: "personal" | "indefinite";
  polaritySensitive?: boolean;  // someone/anyone 系
}

export interface AdjectivePhraseNode {
  type: "adjectivePhrase";
  degree?: { lemma: string };
  head: { lemma: string };
}

export interface AdverbNode {
  type: "adverb";
  lemma: string;
  advType: "manner" | "frequency" | "degree" | "time" | "place";
}
