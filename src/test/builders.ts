/**
 * AST フィクスチャ用のビルダー
 *
 * ゴールデンテストのケースを簡潔に書くためのヘルパー。
 * 生成される形は astGenerator が実際に出力する AST に合わせてある
 * （`{ type, adjectives: [], head, ... }` のように省略可能なフィールドは省く）。
 */

import { findPronounCore } from '../data/dictionary-core';
import type {
  SentenceNode,
  ClauseNode,
  VerbPhraseNode,
  VerbPhraseConjunct,
  CoordinatedVerbPhraseNode,
  NounPhraseNode,
  CoordinatedNounPhraseNode,
  AdjectivePhraseNode,
  AdverbNode,
  PrepositionalPhraseNode,
  FilledArgumentSlot,
  SemanticRole,
  ModalType,
  Conjunction,
  PropositionalOperator,
} from '../types/schema';

// ============================================
// 名詞句
// ============================================

export interface NounOptions {
  det?: string;
  preDet?: string;
  postDet?: string;
  adjectives?: string[];
  number?: 'singular' | 'plural' | 'uncountable';
  prepModifier?: PrepositionalPhraseNode;
}

/** 名詞句: noun('apple', { det: 'a' }) */
export function noun(lemma: string, opts: NounOptions = {}): NounPhraseNode {
  const np: NounPhraseNode = {
    type: 'nounPhrase',
    adjectives: (opts.adjectives ?? []).map(a => ({ lemma: a })),
    head: { type: 'noun', lemma, number: opts.number ?? 'singular' },
  };
  if (opts.preDet) np.preDeterminer = opts.preDet;
  if (opts.det) np.determiner = opts.det;
  if (opts.postDet) np.postDeterminer = opts.postDet;
  if (opts.prepModifier) np.prepModifier = opts.prepModifier;
  return np;
}

/**
 * 代名詞句: pron('I') / pron('?who')
 * person・number・pronounType は dictionary-core から引く（astGenerator と同じ経路）
 */
export function pron(lemma: string): NounPhraseNode {
  const core = findPronounCore(lemma);
  if (!core) throw new Error(`pron(): unknown pronoun "${lemma}"`);
  return {
    type: 'nounPhrase',
    adjectives: [],
    head: {
      type: 'pronoun',
      lemma: core.lemma,
      person: core.person,
      number: core.number,
      pronounType: core.type,
      ...(core.polaritySensitive ? { polaritySensitive: true } : {}),
    },
  };
}

/** 等位接続された名詞句: coordNP('and', [pron('I'), noun('father', { det: 'my' })]) */
export function coordNP(
  conjunction: Conjunction,
  conjuncts: (NounPhraseNode | CoordinatedNounPhraseNode)[],
  opts: { isChoiceQuestion?: boolean } = {}
): CoordinatedNounPhraseNode {
  return {
    type: 'coordinatedNounPhrase',
    conjunction,
    conjuncts,
    ...(opts.isChoiceQuestion ? { isChoiceQuestion: true } : {}),
  };
}

/** 形容詞句（繋辞の attribute 用）: adjP('happy') */
export function adjP(lemma: string, degree?: string): AdjectivePhraseNode {
  return {
    type: 'adjectivePhrase',
    ...(degree ? { degree: { lemma: degree } } : {}),
    head: { lemma },
  };
}

// ============================================
// 副詞・前置詞句
// ============================================

export function adv(lemma: string, advType: AdverbNode['advType']): AdverbNode {
  return { type: 'adverb', lemma, advType };
}

export function pp(
  preposition: string,
  object: NounPhraseNode | CoordinatedNounPhraseNode
): PrepositionalPhraseNode {
  return { type: 'prepositionalPhrase', preposition, object };
}

// ============================================
// 動詞句
// ============================================

/** 引数スロット: arg('agent', pron('I')) */
export function arg(
  role: SemanticRole,
  filler: NounPhraseNode | CoordinatedNounPhraseNode | AdjectivePhraseNode | null
): FilledArgumentSlot {
  return { role, filler };
}

export interface VpOptions {
  adverbs?: AdverbNode[];
  pps?: PrepositionalPhraseNode[];
  /** VP 個別の否定（等位接続内で使用。ClauseNode.polarity とは別物） */
  polarity?: 'negative';
  logicOp?: {
    operator: PropositionalOperator;
    leftOperand?: VerbPhraseConjunct;
    rightOperand?: VerbPhraseConjunct;
  };
}

/** 動詞句: vp('eat', [arg('agent', pron('I')), arg('patient', noun('apple', { det: 'a' }))]) */
export function vp(
  verbLemma: string,
  args: FilledArgumentSlot[] = [],
  opts: VpOptions = {}
): VerbPhraseNode {
  const node: VerbPhraseNode = {
    type: 'verbPhrase',
    verb: { lemma: verbLemma },
    arguments: args,
    adverbs: opts.adverbs ?? [],
    prepositionalPhrases: opts.pps ?? [],
  };
  if (opts.polarity) node.polarity = opts.polarity;
  if (opts.logicOp) node.logicOp = opts.logicOp;
  return node;
}

/**
 * 等位接続された動詞句: coordVp('and', [vp('eat', ...), vp('drink', ...)])
 *
 * 入れ子もそのまま表現できる:
 *   coordVp('or', [coordVp('and', [A, B]), C])  →  (A and B) or C
 */
export function coordVp(
  conjunction: Conjunction,
  conjuncts: VerbPhraseConjunct[]
): CoordinatedVerbPhraseNode {
  return { type: 'coordinatedVerbPhrase', conjunction, conjuncts };
}

// ============================================
// 節・文
// ============================================

export interface ClauseOptions {
  tense?: ClauseNode['tense'];
  aspect?: ClauseNode['aspect'];
  /** 節レベルの否定（動詞否定）。VerbPhraseNode.polarity とは別物 */
  polarity?: ClauseNode['polarity'];
  modal?: ModalType;
  modalPolarity?: ClauseNode['modalPolarity'];
}

export function clause(verbPhrase: VerbPhraseConjunct, opts: ClauseOptions = {}): ClauseNode {
  const node: ClauseNode = {
    type: 'clause',
    verbPhrase,
    tense: opts.tense ?? 'present',
    aspect: opts.aspect ?? 'simple',
    polarity: opts.polarity ?? 'affirmative',
  };
  if (opts.modal) node.modal = opts.modal;
  if (opts.modalPolarity) node.modalPolarity = opts.modalPolarity;
  return node;
}

export interface SentenceOptions {
  sentenceType?: SentenceNode['sentenceType'];
  timeAdverbial?: string;
}

export function sentence(clauseNode: ClauseNode, opts: SentenceOptions = {}): SentenceNode {
  const node: SentenceNode = {
    type: 'sentence',
    clause: clauseNode,
    sentenceType: opts.sentenceType ?? 'declarative',
  };
  if (opts.timeAdverbial) node.timeAdverbial = opts.timeAdverbial;
  return node;
}

// ============================================
// よく使う短縮形
// ============================================

/** 平叙文をひと息で: decl(vp(...), { tense: 'past' }) */
export function decl(verbPhrase: VerbPhraseConjunct, opts: ClauseOptions = {}): SentenceNode {
  return sentence(clause(verbPhrase, opts));
}
