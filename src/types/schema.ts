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

// 名詞カテゴリ（意味的分類）
export type NounCategory =
  | "human"     // 人間（who で参照）
  | "animal"    // 動物・生き物
  | "object"    // 具体的な物
  | "place"     // 場所
  | "abstract"; // 抽象概念

// 限定詞設定
export interface DeterminerConfig {
  defaults: {
    pre: string;
    central: string;
    post: string;
  };
  options: {
    pre: string[];
    central: string[];
    post: string[];
  };
  disabled?: boolean;  // 固有名詞用：限定詞変更不可
}

export interface NounEntry {
  lemma: string;
  plural: string;
  category: NounCategory;
  countable: boolean;
  proper?: boolean;           // 固有名詞フラグ（冠詞なし）
  zeroArticle?: boolean;      // 特殊な無冠詞用法（at home, go to school 等）
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
  preDeterminer?: string;  // all, both, half
  determiner?: { kind: "definite" | "indefinite" | "none"; lexeme?: string };
  postDeterminer?: string;  // one, two, many, few, some, several
  quantifier?: string;  // レガシー: a, one, two, many, some, few, all, no
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
