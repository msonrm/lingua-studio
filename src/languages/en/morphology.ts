/**
 * Unified Verb Conjugation System
 *
 * 動詞活用の計算と変形記録を一体化。
 * 平叙文・疑問文で共通の活用ロジックを使用し、
 * 語順の組み立てだけを分離する。
 */

import type { NounPhraseNode, CoordinatedNounPhraseNode, AdverbNode } from '../../types/schema';
import type { TransformationType } from '../../renderer/types';

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
  doubleNegation?: boolean;  // 二重否定: "do not not eat"
  isQuestion?: boolean;      // 疑問文: do-supportを使用
  subject?: NounPhraseNode | CoordinatedNounPhraseNode;
  modal?: ModalType;
  modalPolarity?: Polarity;
  frequencyAdverbs?: AdverbNode[];
}

/** 変形記録 */
interface Transform {
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

/**
 * モダリティの表層形
 *
 * 迂言形式（"had to" / "was going to"）も助動詞 + 連結語に分解して表す。
 * こうすると相（be + ing / have + pp）と素直に合成できる:
 *
 *   had to      + be eating  →  "had to be eating"
 *   was going to + have eaten →  "was going to have eaten"
 *
 * 以前は迂言形式を1つの文字列として持ち、単純相だけを特別扱いしていたため、
 * 進行相・完了相では助動詞が丸ごと落ちて "I be eating an apple." になっていた。
 */
interface ModalForm {
  /** 助動詞（疑問文で倒置される部分） */
  auxiliary: string;
  /** 助動詞と動詞句の間に入る語（"to" / "going to" / "have to"） */
  linker?: string;
}

/** 時制ごとの助動詞。迂言形式になるものはここには入らない */
const MODAL_AUXILIARIES: Record<'present' | 'past', Record<ModalType, string | null>> = {
  present: {
    ability: 'can',
    permission: 'may',
    possibility: 'might',
    obligation: 'must',
    certainty: 'must',
    advice: 'should',
    volition: 'will',
    prediction: 'will',
  },
  past: {
    ability: 'could',
    permission: 'could',
    possibility: 'might',
    obligation: null,   // had to（迂言形式）
    certainty: 'must',
    advice: 'should',
    volition: null,     // was/were going to（迂言形式）
    prediction: 'would',
  },
};

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

/** 部品を結合（空文字は除去） */
function join(...parts: (string | null | undefined)[]): string {
  return parts.filter(p => p && p.length > 0).join(' ');
}

/**
 * 活用の計算中ずっと共有される文脈。
 *
 * 元は `conjugateVerb` 内のクロージャだったものを、相ごとのハンドラへ
 * 渡せるように束ねたもの。`record()` は `transforms` を破壊的に更新する。
 */
interface ConjugationScope {
  lemma: string;
  verb: VerbEntry;
  ctx: ConjugationContext;
  transforms: Transform[];
  isThirdPersonSingular: boolean;
  /** 否定・疑問では do-support 側に一致と時制が乗る */
  usesDoSupport: boolean;
  /** 頻度副詞をつないだ文字列 */
  freqStr: string;
  /** 否定部分（'' / 'not' / 'not not'） */
  notPart: string;
  /** 変形を記録する（変化がある場合のみ） */
  record: (
    type: TransformationType,
    from: string,
    to: string,
    rule: string,
    description: string
  ) => void;
  /** 主語に合わせた be 動詞の形 */
  beForm: (tense: Tense) => string;
  /** 主語に合わせた have 動詞の形 */
  haveForm: (tense: Tense) => string;
}

function createScope(
  lemma: string,
  verb: VerbEntry,
  ctx: ConjugationContext,
  deps: ConjugationDependencies
): ConjugationScope {
  const transforms: Transform[] = [];
  const { polarity, doubleNegation, isQuestion, subject, frequencyAdverbs = [] } = ctx;

  const isNegative = polarity === 'negative';
  const isThirdPersonSingular = deps.isThirdSingular(subject);
  const personNumber = deps.getPersonNumber(subject);

  const beForm = (t: Tense): string => {
    if (t === 'future') return 'will be';
    const beVerb = deps.findVerb('be');
    if (beVerb?.forms.irregular) {
      const key = `${personNumber.person}${personNumber.number === 'singular' ? 'sg' : 'pl'}_${t}`;
      const form = beVerb.forms.irregular[key];
      if (form) return form;
    }
    if (t === 'past') {
      return (personNumber.person === 1 || personNumber.person === 3) &&
        personNumber.number === 'singular'
        ? 'was'
        : 'were';
    }
    return isThirdPersonSingular
      ? 'is'
      : personNumber.person === 1 && personNumber.number === 'singular'
        ? 'am'
        : 'are';
  };

  const haveForm = (t: Tense): string => {
    if (t === 'future') return 'will have';
    if (t === 'past') return 'had';
    return isThirdPersonSingular ? 'has' : 'have';
  };

  return {
    lemma,
    verb,
    ctx,
    transforms,
    isThirdPersonSingular,
    usesDoSupport: Boolean(isNegative || isQuestion),
    freqStr: frequencyAdverbs.map(a => a.lemma).join(' '),
    notPart: isNegative ? (doubleNegation ? 'not not' : 'not') : '',
    record: (type, from, to, rule, description) => {
      if (from !== to) {
        transforms.push({ type, from, to, rule, description });
      }
    },
    beForm,
    haveForm,
  };
}

// ============================================
// モダリティあり
// ============================================

/** 相に応じた動詞句の語を返し、必要なら相の変形を記録する */
function modalVerbParts(scope: ConjugationScope): string[] {
  const { lemma, verb, ctx, record } = scope;

  switch (ctx.aspect) {
    case 'progressive':
      record('aspect', lemma, `be ${verb.forms.ing}`, 'ASPECT_PROGRESSIVE', 'ASPECT_PROGRESSIVE_DESC');
      return ['be', verb.forms.ing];
    case 'perfect':
      record('aspect', lemma, `have ${verb.forms.pp}`, 'ASPECT_PERFECT', 'ASPECT_PERFECT_DESC');
      return ['have', verb.forms.pp];
    case 'perfectProgressive':
      record('aspect', lemma, `have been ${verb.forms.ing}`, 'ASPECT_PERF_PROG', 'ASPECT_PERF_PROG_DESC');
      return ['have', 'been', verb.forms.ing];
    default:
      return [verb.forms.base];
  }
}

/** 過去形で助動詞が変わる場合に記録する（can → could / must → had to など） */
function recordModalPastShift(scope: ConjugationScope, modal: ModalType, pastForm: ModalForm): void {
  if (scope.ctx.tense !== 'past') return;

  const presentAux = MODAL_AUXILIARIES.present[modal] ?? '';
  const pastAux = [pastForm.auxiliary, pastForm.linker].filter(Boolean).join(' ');
  if (presentAux && pastAux && presentAux !== pastAux) {
    scope.record('modal', presentAux, pastAux, 'MODAL_PAST', 'MODAL_PAST_DESC');
  }
}

/**
 * モダリティの表層形を決める
 *
 * 迂言形式（過去の義務・意志）と、義務のモダリティ否定はここで組み立てる。
 * どれも「助動詞 + 連結語」に落とすので、呼び出し側は相との合成だけを考えればよい。
 */
function resolveModalForm(
  scope: ConjugationScope,
  modal: ModalType,
  isModalNegative: boolean
): ModalForm {
  const { ctx, beForm, isThirdPersonSingular } = scope;
  const isPast = ctx.tense === 'past';

  // 義務のモダリティ否定は must の否定ではなく have to の否定になる
  //   "I must not eat"（動詞否定）と "I don't have to eat"（モダリティ否定）は意味が違う
  if (isModalNegative && modal === 'obligation') {
    return isPast
      ? { auxiliary: "didn't", linker: 'have to' }
      : { auxiliary: isThirdPersonSingular ? "doesn't" : "don't", linker: 'have to' };
  }

  // 過去の義務は迂言形式 had to
  if (modal === 'obligation' && isPast) {
    return { auxiliary: 'had', linker: 'to' };
  }

  // 過去の意志は迂言形式 was/were going to（be 動詞なので主語に一致する）
  if (modal === 'volition' && isPast) {
    const be = beForm('past');
    return {
      auxiliary: isModalNegative ? `${be} not` : be,
      linker: 'going to',
    };
  }

  const auxiliary = MODAL_AUXILIARIES[isPast ? 'past' : 'present'][modal] ?? modal;
  return { auxiliary: isModalNegative ? negateModalAuxiliary(auxiliary) : auxiliary };
}

function conjugateWithModal(scope: ConjugationScope, modal: ModalType): ConjugationResult {
  const { transforms, freqStr, notPart } = scope;
  const isModalNegative = scope.ctx.modalPolarity === 'negative';

  const form = resolveModalForm(scope, modal, isModalNegative);
  recordModalPastShift(scope, modal, form);

  // 助動詞 + 連結語 + 否定 + 頻度副詞 + 相に応じた動詞句
  return {
    auxiliary: form.auxiliary,
    mainVerb: join(form.linker, notPart, freqStr, ...modalVerbParts(scope)),
    transforms,
  };
}

// ============================================
// モダリティなし・相ごとの処理
// ============================================

/** 単純相の be 動詞（"I am happy" のように be 自体が主動詞になる） */
function conjugateSimpleBe(scope: ConjugationScope): ConjugationResult {
  const { ctx, transforms, freqStr, notPart, record, beForm, isThirdPersonSingular } = scope;
  const { tense } = ctx;

  if (tense === 'future') {
    record('tense', 'be', 'will be', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
    return { auxiliary: 'will', mainVerb: join(notPart, freqStr, 'be'), transforms };
  }

  const form = beForm(tense);
  if (tense === 'past') {
    record('tense', 'be', form, 'TENSE_PAST', 'TENSE_PAST_DESC');
  } else if (isThirdPersonSingular) {
    record('agreement', 'be', form, 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
  }

  return { auxiliary: form, mainVerb: join(notPart, freqStr), transforms };
}

function conjugateSimple(scope: ConjugationScope): ConjugationResult {
  const { lemma, verb, ctx, transforms, freqStr, notPart, record, usesDoSupport, isThirdPersonSingular } = scope;
  const { tense } = ctx;

  if (lemma === 'be') {
    return conjugateSimpleBe(scope);
  }

  if (tense === 'future') {
    record('tense', lemma, `will ${verb.forms.base}`, 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
    return {
      auxiliary: 'will',
      mainVerb: join(notPart, freqStr, verb.forms.base),
      transforms,
    };
  }

  if (tense === 'past') {
    // do-support を使う文では時制が do に乗る（do → did）。
    // 平叙肯定文では本動詞が変化する（eat → ate）。
    if (usesDoSupport) {
      record('tense', 'do', 'did', 'TENSE_PAST', 'TENSE_PAST_DESC');
    } else {
      record('tense', verb.forms.base, verb.forms.past, 'TENSE_PAST', 'TENSE_PAST_DESC');
    }
    return {
      auxiliary: 'did',
      mainVerb: join(notPart, freqStr, verb.forms.base),
      transforms,
    };
  }

  // present — 一致も同じく do-support の有無で乗る先が変わる
  if (isThirdPersonSingular) {
    if (usesDoSupport) {
      record('agreement', 'do', 'does', 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
    } else {
      record('agreement', verb.forms.base, verb.forms.thirdSg, 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
    }
  }

  return {
    auxiliary: isThirdPersonSingular ? 'does' : 'do',
    mainVerb: join(notPart, freqStr, verb.forms.base),
    transforms,
  };
}

function conjugateProgressive(scope: ConjugationScope): ConjugationResult {
  const { lemma, verb, ctx, transforms, freqStr, notPart, record, beForm } = scope;
  const { tense } = ctx;
  const form = beForm(tense);

  if (tense === 'future') {
    record('tense', 'be', 'will be', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
  } else if (tense === 'past') {
    record('tense', 'be', form, 'TENSE_PAST', 'TENSE_PAST_DESC');
  }
  record('aspect', lemma, `be ${verb.forms.ing}`, 'ASPECT_PROGRESSIVE', 'ASPECT_PROGRESSIVE_DESC');

  if (tense === 'future') {
    return {
      auxiliary: 'will',
      mainVerb: join(notPart, freqStr, 'be', verb.forms.ing),
      transforms,
    };
  }

  return { auxiliary: form, mainVerb: join(notPart, freqStr, verb.forms.ing), transforms };
}

/** 完了相・完了進行相で共通の時制変形を記録する（have → will have / had / has） */
function recordPerfectTense(scope: ConjugationScope): void {
  const { ctx, record, isThirdPersonSingular } = scope;

  if (ctx.tense === 'future') {
    record('tense', 'have', 'will have', 'TENSE_FUTURE', 'TENSE_FUTURE_DESC');
  } else if (ctx.tense === 'past') {
    record('tense', 'have', 'had', 'TENSE_PAST', 'TENSE_PAST_DESC');
  } else if (isThirdPersonSingular) {
    record('agreement', 'have', 'has', 'AGREEMENT_3SG', 'AGREEMENT_3SG_DESC');
  }
}

function conjugatePerfect(scope: ConjugationScope): ConjugationResult {
  const { lemma, verb, ctx, transforms, freqStr, notPart, record, haveForm } = scope;

  recordPerfectTense(scope);
  record('aspect', lemma, `have ${verb.forms.pp}`, 'ASPECT_PERFECT', 'ASPECT_PERFECT_DESC');

  if (ctx.tense === 'future') {
    return {
      auxiliary: 'will',
      mainVerb: join(notPart, freqStr, 'have', verb.forms.pp),
      transforms,
    };
  }

  return {
    auxiliary: haveForm(ctx.tense),
    mainVerb: join(notPart, freqStr, verb.forms.pp),
    transforms,
  };
}

function conjugatePerfectProgressive(scope: ConjugationScope): ConjugationResult {
  const { lemma, verb, ctx, transforms, freqStr, notPart, record, haveForm } = scope;

  recordPerfectTense(scope);
  record('aspect', lemma, `have been ${verb.forms.ing}`, 'ASPECT_PERF_PROG', 'ASPECT_PERF_PROG_DESC');

  if (ctx.tense === 'future') {
    return {
      auxiliary: 'will',
      mainVerb: join(notPart, freqStr, 'have', 'been', verb.forms.ing),
      transforms,
    };
  }

  return {
    auxiliary: haveForm(ctx.tense),
    mainVerb: join(notPart, freqStr, 'been', verb.forms.ing),
    transforms,
  };
}

const ASPECT_HANDLERS: Record<Aspect, (scope: ConjugationScope) => ConjugationResult> = {
  simple: conjugateSimple,
  progressive: conjugateProgressive,
  perfect: conjugatePerfect,
  perfectProgressive: conjugatePerfectProgressive,
};

// ============================================
// エントリポイント
// ============================================

/**
 * 統一された動詞活用関数
 *
 * lemma から最終的な活用形を計算し、適用されたすべての変形を記録する。
 * モダリティの有無で経路が分かれ、その先は相ごとのハンドラが担当する。
 */
export function conjugateVerb(
  lemma: string,
  ctx: ConjugationContext,
  deps: ConjugationDependencies
): ConjugationResult {
  const verb = deps.findVerb(lemma);
  if (!verb) {
    return { auxiliary: null, mainVerb: lemma, transforms: [] };
  }

  const scope = createScope(lemma, verb, ctx, deps);

  return ctx.modal
    ? conjugateWithModal(scope, ctx.modal)
    : ASPECT_HANDLERS[ctx.aspect](scope);
}
