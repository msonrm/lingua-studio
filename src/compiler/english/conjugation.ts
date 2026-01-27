/**
 * Unified Verb Conjugation System
 *
 * 動詞活用の計算と変形記録を一体化。
 * 平叙文・疑問文で共通の活用ロジックを使用し、
 * 語順の組み立てだけを分離する。
 */

import type { NounPhraseNode, CoordinatedNounPhraseNode, AdverbNode } from '../../types/schema';
import type { TransformationType } from '../../grammar/types';

// ============================================
// Types
// ============================================

export type Tense = 'past' | 'present' | 'future';
export type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';
export type Polarity = 'affirmative' | 'negative';
export type ModalType = 'ability' | 'permission' | 'possibility' | 'obligation' | 'certainty' | 'advice' | 'volition' | 'prediction';

/** 活用コンテキスト */
export interface ConjugationContext {
  tense: Tense;
  aspect: Aspect;
  polarity: Polarity;
  subject?: NounPhraseNode | CoordinatedNounPhraseNode;
  modal?: ModalType;
  modalPolarity?: Polarity;
  frequencyAdverbs?: AdverbNode[];
}

/** 変形記録 */
export interface Transform {
  type: TransformationType;
  from: string;
  to: string;
  rule: string;
  description: string;
}

/** 活用結果 */
export interface ConjugationResult {
  /** 助動詞（疑問文で倒置される部分） */
  auxiliary: string | null;
  /** 本動詞部分 */
  mainVerb: string;
  /** 適用された変形リスト */
  transforms: Transform[];
}

/** 動詞エントリ（辞書から） */
interface VerbEntry {
  lemma: string;
  forms: {
    base: string;
    past: string;
    pp: string;
    ing: string;
    thirdSg: string;
    irregular?: Record<string, string>;
  };
}

/** 主語の人称・数 */
interface PersonNumber {
  person: 1 | 2 | 3;
  number: 'singular' | 'plural';
}

// ============================================
// Verb Dictionary Access (簡易版 - 実際は dictionary.ts から)
// ============================================

// Note: 実際の実装では englishRenderer.ts の findVerb を使用
// ここでは型定義のための参照用

type FindVerbFn = (lemma: string) => VerbEntry | undefined;
type GetPersonNumberFn = (subject: NounPhraseNode | CoordinatedNounPhraseNode | undefined) => PersonNumber;
type IsThirdSingularFn = (subject: NounPhraseNode | CoordinatedNounPhraseNode | undefined) => boolean;

// ============================================
// Modal Forms
// ============================================

interface ModalForm {
  auxiliary?: string;
  usePeriPhrastic?: 'was going to' | 'had to';
}

function getModalForm(modal: ModalType, tense: Tense): ModalForm {
  if (tense === 'past') {
    switch (modal) {
      case 'ability':    return { auxiliary: 'could' };
      case 'permission': return { auxiliary: 'could' };
      case 'possibility': return { auxiliary: 'might' };
      case 'obligation': return { usePeriPhrastic: 'had to' };
      case 'certainty':  return { auxiliary: 'must' };
      case 'advice':     return { auxiliary: 'should' };
      case 'volition':   return { usePeriPhrastic: 'was going to' };
      case 'prediction': return { auxiliary: 'would' };
    }
  }
  switch (modal) {
    case 'ability':    return { auxiliary: 'can' };
    case 'permission': return { auxiliary: 'may' };
    case 'possibility': return { auxiliary: 'might' };
    case 'obligation': return { auxiliary: 'must' };
    case 'certainty':  return { auxiliary: 'must' };
    case 'advice':     return { auxiliary: 'should' };
    case 'volition':   return { auxiliary: 'will' };
    case 'prediction': return { auxiliary: 'will' };
  }
}

function negateModalAuxiliary(aux: string): string {
  const negationMap: Record<string, string> = {
    'can': "can't",
    'could': "couldn't",
    'will': "won't",
    'would': "wouldn't",
    'shall': "shan't",
    'should': "shouldn't",
    'may': "may not",
    'might': "might not",
    'must': "mustn't",
  };
  return negationMap[aux] || `${aux} not`;
}

// ============================================
// Core Conjugation Function
// ============================================

export interface ConjugationDependencies {
  findVerb: FindVerbFn;
  getPersonNumber: GetPersonNumberFn;
  isThirdSingular: IsThirdSingularFn;
}

/**
 * 統一された動詞活用関数
 *
 * lemma から最終的な活用形を計算し、
 * 適用されたすべての変形を記録する。
 */
export function conjugateVerb(
  lemma: string,
  ctx: ConjugationContext,
  deps: ConjugationDependencies
): ConjugationResult {
  const transforms: Transform[] = [];
  const { findVerb, getPersonNumber, isThirdSingular } = deps;

  const verbEntry = findVerb(lemma);
  if (!verbEntry) {
    return { auxiliary: null, mainVerb: lemma, transforms: [] };
  }

  const { tense, aspect, polarity, subject, modal, modalPolarity, frequencyAdverbs = [] } = ctx;
  const isNegative = polarity === 'negative';
  const isThirdPersonSingular = isThirdSingular(subject);
  const personNumber = getPersonNumber(subject);
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');

  // Helper: 記録付きで変形を追加
  const record = (type: TransformationType, from: string, to: string, rule: string, description: string) => {
    if (from !== to) {
      transforms.push({ type, from, to, rule, description });
    }
  };

  // Helper: be動詞の活用形を取得
  const getBeForm = (t: Tense): string => {
    if (t === 'future') return 'will be';
    const beVerb = findVerb('be');
    if (beVerb?.forms.irregular) {
      const key = `${personNumber.person}${personNumber.number === 'singular' ? 'sg' : 'pl'}_${t}`;
      const form = beVerb.forms.irregular[key];
      if (form) return form;
    }
    if (t === 'past') {
      return (personNumber.person === 1 || personNumber.person === 3) && personNumber.number === 'singular' ? 'was' : 'were';
    }
    return isThirdPersonSingular ? 'is' : (personNumber.person === 1 && personNumber.number === 'singular' ? 'am' : 'are');
  };

  // Helper: have動詞の活用形を取得
  const getHaveForm = (t: Tense): string => {
    if (t === 'future') return 'will have';
    if (t === 'past') return 'had';
    return isThirdPersonSingular ? 'has' : 'have';
  };

  // Helper: 部品を結合（空文字除去）
  const join = (...parts: (string | null | undefined)[]): string => {
    return parts.filter(p => p && p.length > 0).join(' ');
  };

  // ============================================
  // モダリティ処理
  // ============================================
  if (modal) {
    const modalForm = getModalForm(modal, tense);
    const isModalNegative = modalPolarity === 'negative';

    // モダル変換を記録
    if (tense === 'past') {
      const presentForm = getModalForm(modal, 'present');
      const presentAux = presentForm.auxiliary || '';
      const pastAux = modalForm.auxiliary || modalForm.usePeriPhrastic || '';
      if (presentAux && pastAux && presentAux !== pastAux) {
        record('modal', presentAux, pastAux, 'MODAL_PAST', 'MODAL_PAST_DESC');
      }
    }

    // 義務の否定（特殊処理: must → don't have to）
    if (isModalNegative && modal === 'obligation') {
      const haveToAux = tense === 'past' ? "didn't have to" : "don't have to";
      const notPart = isNegative ? 'not' : '';

      if (aspect === 'simple') {
        return {
          auxiliary: haveToAux,
          mainVerb: join(notPart, freqStr, verbEntry.forms.base),
          transforms,
        };
      }
    }

    // 迂言形式（was going to, had to）
    if (modalForm.usePeriPhrastic) {
      const peri = modalForm.usePeriPhrastic;
      const notPart = isNegative ? 'not' : '';

      if (peri === 'was going to') {
        if (aspect === 'simple') {
          return {
            auxiliary: 'was',
            mainVerb: join('going to', notPart, freqStr, verbEntry.forms.base),
            transforms,
          };
        }
      } else if (peri === 'had to') {
        if (aspect === 'simple') {
          return {
            auxiliary: 'did',
            mainVerb: join('have to', notPart, freqStr, verbEntry.forms.base),
            transforms,
          };
        }
      }
    }

    // 通常のモダリティ
    const aux = modalForm.auxiliary || '';
    const negatedAux = isModalNegative ? negateModalAuxiliary(aux) : aux;
    const notPart = isNegative ? 'not' : '';

    if (aspect === 'simple') {
      return {
        auxiliary: negatedAux,
        mainVerb: join(notPart, freqStr, verbEntry.forms.base),
        transforms,
      };
    }
    if (aspect === 'progressive') {
      record('aspect', lemma, `be ${verbEntry.forms.ing}`, 'ASPECT_PROGRESSIVE', 'ASPECT_PROGRESSIVE_DESC');
      return {
        auxiliary: negatedAux,
        mainVerb: join(notPart, freqStr, 'be', verbEntry.forms.ing),
        transforms,
      };
    }
    if (aspect === 'perfect') {
      record('aspect', lemma, `have ${verbEntry.forms.pp}`, 'ASPECT_PERFECT', 'ASPECT_PERFECT_DESC');
      return {
        auxiliary: negatedAux,
        mainVerb: join(notPart, freqStr, 'have', verbEntry.forms.pp),
        transforms,
      };
    }
    if (aspect === 'perfectProgressive') {
      record('aspect', lemma, `have been ${verbEntry.forms.ing}`, 'ASPECT_PERF_PROG', 'ASPECT_PERF_PROG_DESC');
      return {
        auxiliary: negatedAux,
        mainVerb: join(notPart, freqStr, 'have', 'been', verbEntry.forms.ing),
        transforms,
      };
    }
  }

  // ============================================
  // Simple Aspect（モダリティなし）
  // ============================================
  if (aspect === 'simple') {
    const notPart = isNegative ? 'not' : '';

    // be動詞の特別処理
    if (lemma === 'be') {
      const beForm = getBeForm(tense);

      if (tense === 'future') {
        record('tense', 'be', 'will be', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
        return {
          auxiliary: 'will',
          mainVerb: join(notPart, freqStr, 'be'),
          transforms,
        };
      }

      if (tense === 'past') {
        record('tense', 'be', beForm, 'TENSE_PAST', 'TENSE_PAST_DESC');
      } else if (isThirdPersonSingular) {
        record('agreement', 'be', beForm, 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
      }

      return {
        auxiliary: beForm,
        mainVerb: join(notPart, freqStr),
        transforms,
      };
    }

    // 一般動詞
    if (tense === 'future') {
      record('tense', lemma, `will ${verbEntry.forms.base}`, 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
      return {
        auxiliary: 'will',
        mainVerb: join(notPart, freqStr, verbEntry.forms.base),
        transforms,
      };
    }

    if (tense === 'past') {
      record('tense', verbEntry.forms.base, verbEntry.forms.past, 'TENSE_PAST', 'TENSE_PAST_DESC');
      // 平叙文では活用形を直接使用、疑問文では do-support
      return {
        auxiliary: 'did',  // 疑問文用
        mainVerb: join(notPart, freqStr, verbEntry.forms.base),
        transforms,
        // Note: 平叙文では auxiliary を使わず、mainVerb に過去形を使う
        // この区別は呼び出し側で行う
      };
    }

    // present
    if (isThirdPersonSingular) {
      record('agreement', verbEntry.forms.base, verbEntry.forms.thirdSg, 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
    }
    const doForm = isThirdPersonSingular ? 'does' : 'do';
    return {
      auxiliary: doForm,
      mainVerb: join(notPart, freqStr, verbEntry.forms.base),
      transforms,
    };
  }

  // ============================================
  // Progressive Aspect
  // ============================================
  if (aspect === 'progressive') {
    const notPart = isNegative ? 'not' : '';
    const beForm = getBeForm(tense);

    if (tense === 'future') {
      record('tense', 'be', 'will be', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
    } else if (tense === 'past') {
      record('tense', 'be', beForm, 'TENSE_PAST', 'TENSE_PAST_DESC');
    }
    record('aspect', lemma, `be ${verbEntry.forms.ing}`, 'ASPECT_PROGRESSIVE', 'ASPECT_PROGRESSIVE_DESC');

    if (tense === 'future') {
      return {
        auxiliary: 'will',
        mainVerb: join(notPart, freqStr, 'be', verbEntry.forms.ing),
        transforms,
      };
    }

    return {
      auxiliary: beForm,
      mainVerb: join(notPart, freqStr, verbEntry.forms.ing),
      transforms,
    };
  }

  // ============================================
  // Perfect Aspect
  // ============================================
  if (aspect === 'perfect') {
    const notPart = isNegative ? 'not' : '';
    const haveForm = getHaveForm(tense);

    if (tense === 'future') {
      record('tense', 'have', 'will have', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
    } else if (tense === 'past') {
      record('tense', 'have', 'had', 'TENSE_PAST', 'TENSE_PAST_DESC');
    } else if (isThirdPersonSingular) {
      record('agreement', 'have', 'has', 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
    }
    record('aspect', lemma, `have ${verbEntry.forms.pp}`, 'ASPECT_PERFECT', 'ASPECT_PERFECT_DESC');

    if (tense === 'future') {
      return {
        auxiliary: 'will',
        mainVerb: join(notPart, freqStr, 'have', verbEntry.forms.pp),
        transforms,
      };
    }

    return {
      auxiliary: haveForm,
      mainVerb: join(notPart, freqStr, verbEntry.forms.pp),
      transforms,
    };
  }

  // ============================================
  // Perfect Progressive Aspect
  // ============================================
  if (aspect === 'perfectProgressive') {
    const notPart = isNegative ? 'not' : '';
    const haveForm = getHaveForm(tense);

    if (tense === 'future') {
      record('tense', 'have', 'will have', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
    } else if (tense === 'past') {
      record('tense', 'have', 'had', 'TENSE_PAST', 'TENSE_PAST_DESC');
    } else if (isThirdPersonSingular) {
      record('agreement', 'have', 'has', 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
    }
    record('aspect', lemma, `have been ${verbEntry.forms.ing}`, 'ASPECT_PERF_PROG', 'ASPECT_PERF_PROG_DESC');

    if (tense === 'future') {
      return {
        auxiliary: 'will',
        mainVerb: join(notPart, freqStr, 'have', 'been', verbEntry.forms.ing),
        transforms,
      };
    }

    return {
      auxiliary: haveForm,
      mainVerb: join(notPart, freqStr, 'been', verbEntry.forms.ing),
      transforms,
    };
  }

  // Fallback
  return { auxiliary: null, mainVerb: lemma, transforms: [] };
}

// ============================================
// Sentence Assembly Helpers
// ============================================

/**
 * 平叙文の動詞句を組み立て
 * Simple past/present では活用形を直接使用
 */
export function assembleDeclarative(
  result: ConjugationResult,
  ctx: ConjugationContext,
  verbEntry: { forms: { past: string; thirdSg: string; base: string } }
): string {
  const { tense, aspect, polarity } = ctx;
  const isNegative = polarity === 'negative';

  // Simple aspect の平叙文では do-support を使わない
  if (aspect === 'simple' && !ctx.modal) {
    if (tense === 'past' && !isNegative) {
      // "He ate" - 直接過去形
      return verbEntry.forms.past;
    }
    if (tense === 'present' && !isNegative) {
      // "He eats" / "They eat" - 直接現在形
      return result.mainVerb.trim() || verbEntry.forms.base;
    }
    // 否定文: "He does not eat" - do-support 必要
    if (isNegative) {
      return `${result.auxiliary} not ${result.mainVerb}`.trim();
    }
  }

  // 他のケース: auxiliary + mainVerb
  if (result.auxiliary) {
    return `${result.auxiliary} ${result.mainVerb}`.trim();
  }
  return result.mainVerb;
}

/**
 * 疑問文の語順で組み立て
 * Auxiliary + Subject + MainVerb
 */
export function assembleInterrogative(
  result: ConjugationResult,
  subjectStr: string
): { auxiliary: string; rest: string } {
  return {
    auxiliary: result.auxiliary || 'does',
    rest: `${subjectStr} ${result.mainVerb}`.trim(),
  };
}
