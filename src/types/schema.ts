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

// 動詞カテゴリ（意味論的分類）
export type VerbCategory =
  | "motion"        // 移動: run, walk, go, come
  | "action"        // 動作・創造: make, eat, build, break
  | "transfer"      // 授受・移転: give, take, send, receive
  | "cognition"     // 認知・知覚: think, know, see, hear
  | "communication" // 伝達: say, tell, speak, ask
  | "state";        // 状態・存在: be, have, exist, seem

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
  category: VerbCategory;
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
  type: "personal" | "indefinite" | "demonstrative" | "possessive" | "interrogative";
  polaritySensitive?: boolean;  // someone/anyone など
  negativeForm?: string;        // nobody, nothing など
  correspondingPersonal?: string;  // 所有代名詞の対応する人称代名詞 (mine → I)
}

// 形容詞カテゴリ（Dixon's semantic types）
export type AdjectiveCategory =
  | "size"      // 寸法: big, small, tall, short
  | "age"       // 年齢・新旧: old, young, new
  | "color"     // 色: red, blue, green
  | "physical"  // 物理的性質: hard, soft, hot, cold
  | "quality"   // 価値・評価: good, bad, beautiful
  | "emotion";  // 感情・性格: happy, sad, angry

export interface AdjectiveEntry {
  lemma: string;
  category: AdjectiveCategory;
  comparative?: string;
  superlative?: string;
}

export interface AdverbEntry {
  lemma: string;
  type: "manner" | "frequency" | "degree" | "time" | "place";
  polaritySensitive?: boolean;  // somewhere/anywhere 系
}

// ============================================
// ASTノードの型定義
// ============================================

export interface SentenceNode {
  type: "sentence";
  clause: ClauseNode;
  sentenceType: "declarative" | "imperative" | "interrogative" | "fact";
  timeAdverbial?: string;  // TimeChipから生成される時間副詞（Yesterday, Now など）
}

// モダリティ概念（言語非依存の意味カテゴリ）
export type ModalType =
  | "ability"      // 能力: can/could
  | "permission"   // 許可: may/could
  | "possibility"  // 可能性: might
  | "obligation"   // 義務: must/had to
  | "certainty"    // 確信: must
  | "advice"       // 助言: should
  | "volition"     // 意志: will/was going to
  | "prediction";  // 予測: will/would

export interface ClauseNode {
  type: "clause";
  verbPhrase: VerbPhraseNode;
  tense: "past" | "present" | "future";
  aspect: "simple" | "progressive" | "perfect" | "perfectProgressive";
  polarity: "affirmative" | "negative";        // 動詞否定: "I do NOT run"
  modal?: ModalType;
  modalPolarity?: "affirmative" | "negative";  // モダリティ否定: "I need NOT run"
}

// 命題レベルの論理演算子
// - AND, OR: 二項（対称）
// - NOT: 単項
// - IF: 二項（非対称: 条件 → 結果）
// - BECAUSE: 二項（非対称: 原因 → 結果）
export type PropositionalOperator = "AND" | "OR" | "NOT" | "IF" | "BECAUSE";

export interface VerbPhraseNode {
  type: "verbPhrase";
  verb: { lemma: string };
  arguments: FilledArgumentSlot[];
  adverbs: AdverbNode[];
  prepositionalPhrases: PrepositionalPhraseNode[];  // 前置詞句 ("go TO THE PARK")
  coordinatedWith?: {
    conjunction: Conjunction;
    verbPhrase: VerbPhraseNode;
  };
  // 命題レベルの論理演算（AND/OR/NOT - 大文字、and/or 等位接続とは別）
  logicOp?: {
    operator: PropositionalOperator;
    leftOperand?: VerbPhraseNode;   // NOT が複合式をラップする場合、または AND/OR の左側
    rightOperand?: VerbPhraseNode;  // AND/OR の右側
  };
}

export interface FilledArgumentSlot {
  role: SemanticRole;
  filler: NounPhraseNode | AdjectivePhraseNode | CoordinatedNounPhraseNode | null;
}

export interface NounPhraseNode {
  type: "nounPhrase";
  preDeterminer?: string;  // all, both, half
  determiner?: { kind: "definite" | "indefinite" | "none"; lexeme?: string };
  postDeterminer?: string;  // one, two, many, few, some, several
  adjectives: { lemma: string }[];
  head: NounHead | PronounHead;
  prepModifier?: PrepositionalPhraseNode;  // 前置詞句修飾 ("the apple ON THE DESK")
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
  pronounType: "personal" | "indefinite" | "demonstrative" | "possessive" | "interrogative";
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
  polaritySensitive?: boolean;  // somewhere/anywhere 系
}

// ============================================
// 前置詞句ノード
// ============================================
export interface PrepositionalPhraseNode {
  type: "prepositionalPhrase";
  preposition: string;
  object: NounPhraseNode | CoordinatedNounPhraseNode;
}

// ============================================
// 等位接続ノード
// ============================================
export type Conjunction = "and" | "or";

// 等位接続の要素型（入れ子対応）
export type CoordinationConjunct = NounPhraseNode | CoordinatedNounPhraseNode;

// NP等位接続（名詞句 AND/OR 名詞句）- 入れ子対応
export interface CoordinatedNounPhraseNode {
  type: "coordinatedNounPhrase";
  conjunction: Conjunction;
  conjuncts: CoordinationConjunct[];  // 入れ子の等位接続も許可
  isChoiceQuestion?: boolean;  // 選択疑問: ?which('tea, 'coffee)
}

// VP等位接続（動詞句 AND/OR 動詞句）
export interface CoordinatedVerbPhraseNode {
  type: "coordinatedVerbPhrase";
  conjunction: Conjunction;
  conjuncts: VerbPhraseNode[];
}
