/**
 * Unified Noun Phrase Rendering System
 *
 * 名詞句レンダリングの計算と変形記録を一体化。
 * 冠詞選択、複数形、格変化、極性変化を統一的に処理。
 */

import type {
  NounPhraseNode,
  NounHead,
  PronounHead,
  PrepositionalPhraseNode,
  CoordinatedNounPhraseNode,
} from '../../types/schema';
import type { TransformationType } from '../types';
import { renderCoordinationUnified, CoordElement } from './coordination';

// ============================================
// Types
// ============================================

export type NumberValue = 'singular' | 'plural';
export type Polarity = 'affirmative' | 'negative';

/** 名詞句レンダリングコンテキスト */
export interface NounPhraseContext {
  /** 主語位置か（格変化に影響） */
  isSubject: boolean;
  /** 極性（極性感応代名詞に影響） */
  polarity: Polarity;
}

/** 変形記録 */
export interface Transform {
  type: TransformationType;
  from: string;
  to: string;
  rule: string;
  description: string;
}

/** 名詞句レンダリング結果 */
export interface NounPhraseResult {
  /** レンダリングされた文字列 */
  form: string;
  /** 適用された変形リスト */
  transforms: Transform[];
}

/** 名詞エントリ（辞書から） */
interface NounEntry {
  lemma: string;
  plural: string;
  countable: boolean;
  zeroArticle?: boolean;
}

/** 代名詞エントリ（辞書から） */
interface PronounEntry {
  lemma: string;
  objectForm: string;
  possessive?: string;
  person: 1 | 2 | 3;
  number: NumberValue;
  type: 'personal' | 'indefinite' | 'demonstrative' | 'possessive' | 'interrogative';
  polaritySensitive?: boolean;
  negativeForm?: string;
}

// ============================================
// Dependencies (辞書アクセス)
// ============================================

type FindNounFn = (lemma: string) => NounEntry | undefined;
type FindPronounFn = (lemma: string) => PronounEntry | undefined;
type RenderPPFn = (pp: PrepositionalPhraseNode, polarity: Polarity) => string;
type RenderCoordinatedNPFn = (
  cnp: CoordinatedNounPhraseNode,
  isSubject: boolean,
  polarity: Polarity
) => string;

export interface NounPhraseDependencies {
  findNoun: FindNounFn;
  findPronoun: FindPronounFn;
  renderPrepositionalPhrase: RenderPPFn;
  renderCoordinatedNounPhrase: RenderCoordinatedNPFn;
}

// ============================================
// Article Selection
// ============================================

/**
 * 不定冠詞を選択（a/an）
 */
function selectIndefiniteArticle(
  nextWord: string,
  transforms: Transform[]
): string {
  const firstChar = nextWord.charAt(0).toLowerCase();

  // Special cases for silent 'h'
  const silentHWords = ['hour', 'honest', 'honor', 'honour', 'heir'];
  if (silentHWords.some(w => nextWord.toLowerCase().startsWith(w))) {
    transforms.push({
      type: 'article',
      from: 'a',
      to: 'an',
      rule: 'ARTICLE_A_AN',
      description: 'ARTICLE_SILENT_H',
    });
    return 'an';
  }

  // Special cases for /j/ sound in words starting with 'u'
  const uConsonantWords = ['university', 'uniform', 'unique', 'unit', 'united', 'unicorn', 'use', 'useful', 'usual'];
  if (uConsonantWords.some(w => nextWord.toLowerCase().startsWith(w))) {
    return 'a';
  }

  // Standard vowel check
  if (['a', 'e', 'i', 'o', 'u'].includes(firstChar)) {
    transforms.push({
      type: 'article',
      from: 'a',
      to: 'an',
      rule: 'ARTICLE_A_AN',
      description: 'ARTICLE_A_AN_DESC',
    });
    return 'an';
  }

  return 'a';
}

// ============================================
// Pronoun Rendering
// ============================================

/**
 * 代名詞をレンダリング
 */
function renderPronounInternal(
  head: PronounHead,
  ctx: NounPhraseContext,
  deps: NounPhraseDependencies,
  transforms: Transform[]
): string {
  const { isSubject, polarity } = ctx;
  const pronoun = deps.findPronoun(head.lemma);

  // 疑問詞（?who, ?what）の場合
  if (!pronoun) {
    if (head.lemma.startsWith('?')) {
      const stripped = head.lemma.slice(1);
      if (!isSubject && stripped === 'who') {
        transforms.push({
          type: 'case',
          from: 'who',
          to: 'whom',
          rule: 'CASE_WHO_WHOM',
          description: 'CASE_WHO_WHOM_DESC',
        });
        return 'whom';
      }
      return stripped;
    }
    return head.lemma;
  }

  // 疑問詞の場合（辞書に登録されているもの）
  if (pronoun.type === 'interrogative') {
    const lemma = pronoun.lemma.replace(/^\?/, '');
    if (isSubject) {
      return lemma;
    } else {
      const objForm = pronoun.objectForm.replace(/^\?/, '');
      if (lemma !== objForm) {
        transforms.push({
          type: 'case',
          from: lemma,
          to: objForm,
          rule: 'CASE_WHO_WHOM',
          description: 'CASE_WHO_WHOM_DESC',
        });
      }
      return objForm;
    }
  }

  // 不定代名詞の極性による切り替え（someone → nobody）
  if (pronoun.polaritySensitive) {
    if (polarity === 'negative' && pronoun.negativeForm) {
      transforms.push({
        type: 'negation',
        from: pronoun.lemma,
        to: pronoun.negativeForm,
        rule: 'POLARITY_NEGATIVE',
        description: 'POLARITY_NEGATIVE_DESC',
      });
      return pronoun.negativeForm;
    }
  }

  // 格変化: 主格 vs 目的格
  if (isSubject) {
    return pronoun.lemma;
  } else {
    if (pronoun.lemma !== pronoun.objectForm) {
      transforms.push({
        type: 'case',
        from: pronoun.lemma,
        to: pronoun.objectForm,
        rule: 'CASE_OBJECTIVE',
        description: 'CASE_OBJECTIVE_DESC',
      });
    }
    return pronoun.objectForm;
  }
}

// ============================================
// Core Noun Phrase Rendering
// ============================================

/**
 * 統一された名詞句レンダリング関数
 *
 * NounPhraseNode から最終的な文字列を生成し、
 * 適用されたすべての変形を記録する。
 */
export function renderNounPhraseUnified(
  np: NounPhraseNode,
  ctx: NounPhraseContext,
  deps: NounPhraseDependencies
): NounPhraseResult {
  const transforms: Transform[] = [];
  const { polarity } = ctx;

  // ============================================
  // 代名詞の処理
  // ============================================
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    let result = renderPronounInternal(pronounHead, ctx, deps, transforms);

    // 不定代名詞 + 形容詞: "something good", "someone important"
    // 形容詞は後置される
    if (pronounHead.pronounType === 'indefinite' && np.adjectives.length > 0) {
      const adjs = np.adjectives.map(adj => adj.lemma).join(' ');
      result += ' ' + adjs;
    }

    // 前置詞句修飾（代名詞用）: "someone in the room"
    if (np.prepModifier) {
      result += ' ' + deps.renderPrepositionalPhrase(np.prepModifier, polarity);
    }

    return { form: result, transforms };
  }

  // ============================================
  // 名詞の処理
  // ============================================
  const parts: string[] = [];

  // 前置限定詞（all, both, half）
  // 複合限定詞のアンダーバーをスペースに変換（e.g., 'a_few' → 'a few'）
  if (np.preDeterminer) {
    parts.push(np.preDeterminer.replace(/_/g, ' '));
  }

  // 中央限定詞（the, this, my, a/an, no）
  // 'INDEF' プレースホルダーを使用し、後で a/an を決定
  let needsArticleSelection = false;
  if (np.determiner) {
    if (np.determiner === 'a') {
      needsArticleSelection = true;
      parts.push('INDEF');
    } else {
      parts.push(np.determiner.replace(/_/g, ' '));
    }
  }

  // 後置限定詞（one, two, many, few）
  // plural/uncountable はマーカーなので出力しない
  if (np.postDeterminer && np.postDeterminer !== 'plural' && np.postDeterminer !== 'uncountable') {
    parts.push(np.postDeterminer.replace(/_/g, ' '));
  }

  // 形容詞
  np.adjectives.forEach(adj => {
    parts.push(adj.lemma);
  });

  // 名詞（複数形処理）
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    const nounEntry = deps.findNoun(nounHead.lemma);

    if (nounHead.number === 'plural' && nounEntry) {
      if (nounEntry.plural !== nounHead.lemma) {
        transforms.push({
          type: 'agreement',
          from: nounHead.lemma,
          to: nounEntry.plural,
          rule: 'NUMBER_PLURAL',
          description: 'NUMBER_PLURAL_DESC',
        });
      }
      parts.push(nounEntry.plural);
    } else {
      parts.push(nounHead.lemma);
    }
  }

  // a/an の処理
  let result = parts.join(' ');
  if (needsArticleSelection && result.includes('INDEF ')) {
    const idx = result.indexOf('INDEF ');
    const before = result.slice(0, idx);
    const after = result.slice(idx + 6);
    const article = selectIndefiniteArticle(after, transforms);
    result = before + article + ' ' + after;
  }

  // 前置詞句修飾（名詞用）: "the apple on the desk"
  if (np.prepModifier) {
    result += ' ' + deps.renderPrepositionalPhrase(np.prepModifier, polarity);
  }

  return { form: result, transforms };
}

// ============================================
// Coordinated Noun Phrase Rendering
// ============================================

/**
 * 等位接続名詞句をレンダリング
 */
export function renderCoordinatedNounPhraseUnified(
  cnp: CoordinatedNounPhraseNode,
  ctx: NounPhraseContext,
  deps: NounPhraseDependencies
): NounPhraseResult {
  const transforms: Transform[] = [];

  // 各要素をレンダリングする関数
  const renderConjunct = (conjunct: NounPhraseNode | CoordinatedNounPhraseNode): string => {
    if (conjunct.type === 'coordinatedNounPhrase') {
      const subResult = renderCoordinatedNounPhraseUnified(
        conjunct as CoordinatedNounPhraseNode,
        ctx,
        deps
      );
      transforms.push(...subResult.transforms);
      return subResult.form;
    } else {
      const subResult = renderNounPhraseUnified(
        conjunct as NounPhraseNode,
        ctx,
        deps
      );
      transforms.push(...subResult.transforms);
      return subResult.form;
    }
  };

  // CoordElement配列に変換
  // 名詞句は全て同じグループ（入れ子の場合は再帰で処理済み）
  const elements: CoordElement<NounPhraseNode | CoordinatedNounPhraseNode>[] =
    cnp.conjuncts.map((conjunct, index) => ({
      value: conjunct,
      groupId: 'np',  // 名詞句は全て同一グループ
      conjunction: index === 0 ? null : cnp.conjunction,
    }));

  // 統一等位接続モジュールを使用
  const form = renderCoordinationUnified(elements, renderConjunct);

  return { form, transforms };
}
