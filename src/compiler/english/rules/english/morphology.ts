/**
 * English Morphology Rules - 英語の形態論ルール
 *
 * 語形変化に関するルール:
 * - Agreement (主語-動詞一致)
 * - Tense (時制変化)
 * - Aspect (相のマーキング)
 * - Case (代名詞の格変化)
 * - Article (冠詞選択)
 */

import type { RenderContext } from '../../../../grammar/types';
import type { VerbEntry } from '../../../../types/schema';
import { findVerb, findPronoun } from '../../../../data/dictionary';

// ============================================
// Agreement (主語-動詞一致)
// ============================================

/**
 * 3人称単数現在形への変形
 */
export function applyThirdPersonSingular(
  _lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; applied: boolean } {
  // 条件: 現在時制 + 3人称単数
  if (ctx.tense !== 'present') {
    return { form: verbEntry.forms.base, applied: false };
  }
  if (ctx.subject.person !== 3 || ctx.subject.number !== 'singular') {
    return { form: verbEntry.forms.base, applied: false };
  }

  // 不規則活用を確認
  const irregularKey = `present_3sg`;
  if (verbEntry.forms.irregular?.[irregularKey]) {
    return { form: verbEntry.forms.irregular[irregularKey], applied: true };
  }

  // 規則的な -s 付加
  return { form: verbEntry.forms.s, applied: verbEntry.forms.s !== verbEntry.forms.base };
}

/**
 * 一致ルールの説明を生成
 */
export function describeAgreement(ctx: RenderContext): string {
  return `Subject "${ctx.subject.form}" is 3rd person singular`;
}

// ============================================
// Tense (時制変化)
// ============================================

/**
 * 過去時制への変形
 */
export function applyPastTense(
  lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; applied: boolean } {
  if (ctx.tense !== 'past') {
    return { form: lemma, applied: false };
  }

  // 不規則活用を確認
  const personNumber = `${ctx.subject.person}${ctx.subject.number === 'singular' ? 'sg' : 'pl'}`;
  const irregularKey = `past_${personNumber}`;
  if (verbEntry.forms.irregular?.[irregularKey]) {
    return { form: verbEntry.forms.irregular[irregularKey], applied: true };
  }

  // 規則的な過去形
  return { form: verbEntry.forms.past, applied: verbEntry.forms.past !== lemma };
}

/**
 * 未来時制への変形
 */
export function applyFutureTense(
  lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; applied: boolean } {
  if (ctx.tense !== 'future') {
    return { form: lemma, applied: false };
  }

  // will + base
  return { form: `will ${verbEntry.forms.base}`, applied: true };
}

// ============================================
// Aspect (相のマーキング)
// ============================================

/**
 * 進行相への変形
 */
export function applyProgressiveAspect(
  lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; beForm: string; applied: boolean } {
  if (ctx.aspect !== 'progressive') {
    return { form: lemma, beForm: '', applied: false };
  }

  const beForm = getBeAuxiliary(ctx.tense, ctx.subject);
  return {
    form: verbEntry.forms.ing,
    beForm,
    applied: true
  };
}

/**
 * 完了相への変形
 */
export function applyPerfectAspect(
  lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; haveForm: string; applied: boolean } {
  if (ctx.aspect !== 'perfect') {
    return { form: lemma, haveForm: '', applied: false };
  }

  const haveForm = getHaveAuxiliary(ctx.tense, ctx.subject);
  return {
    form: verbEntry.forms.pp,
    haveForm,
    applied: true
  };
}

/**
 * 完了進行相への変形
 */
export function applyPerfectProgressiveAspect(
  lemma: string,
  verbEntry: VerbEntry,
  ctx: RenderContext
): { form: string; haveForm: string; applied: boolean } {
  if (ctx.aspect !== 'perfectProgressive') {
    return { form: lemma, haveForm: '', applied: false };
  }

  const haveForm = getHaveAuxiliary(ctx.tense, ctx.subject);
  return {
    form: verbEntry.forms.ing,
    haveForm: `${haveForm} been`,
    applied: true
  };
}

// ============================================
// Case (代名詞の格変化)
// ============================================

/**
 * 目的格への変形
 */
export function applyObjectiveCase(
  lemma: string,
  isSubject: boolean
): { form: string; applied: boolean } {
  if (isSubject) {
    return { form: lemma, applied: false };
  }

  const pronoun = findPronoun(lemma);
  if (!pronoun) {
    return { form: lemma, applied: false };
  }

  if (pronoun.objectForm && pronoun.objectForm !== lemma) {
    return { form: pronoun.objectForm, applied: true };
  }

  return { form: lemma, applied: false };
}

// ============================================
// Article (冠詞選択)
// ============================================

/**
 * 不定冠詞の選択 (a/an)
 */
export function selectIndefiniteArticle(nextWord: string): { article: 'a' | 'an'; reason: string } {
  const firstChar = nextWord.charAt(0).toLowerCase();
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  // 特殊ケース: "hour", "honest" など h で始まるが母音
  const hVowelWords = ['hour', 'honest', 'honor', 'heir'];
  const startsWithSilentH = hVowelWords.some(w => nextWord.toLowerCase().startsWith(w));

  // 特殊ケース: "university", "uniform" など u で始まるが /j/ 音
  const uConsonantWords = ['uni', 'use', 'usual', 'unique', 'unit', 'europe'];
  const startsWithYSound = uConsonantWords.some(w => nextWord.toLowerCase().startsWith(w));

  if (startsWithSilentH) {
    return { article: 'an', reason: `silent "h" in "${nextWord}"` };
  }

  if (startsWithYSound) {
    return { article: 'a', reason: `"${nextWord}" starts with /j/ sound` };
  }

  if (vowels.includes(firstChar)) {
    return { article: 'an', reason: `vowel sound "${firstChar}"` };
  }

  return { article: 'a', reason: `consonant sound "${firstChar}"` };
}

// ============================================
// Helper Functions
// ============================================

/**
 * be動詞の助動詞形を取得（進行形用）
 */
export function getBeAuxiliary(
  tense: 'past' | 'present' | 'future',
  subject: { person: 1 | 2 | 3; number: 'singular' | 'plural' }
): string {
  if (tense === 'future') return 'will be';

  const beVerb = findVerb('be');
  if (beVerb?.forms.irregular) {
    const key = `${tense}_${subject.person}${subject.number === 'singular' ? 'sg' : 'pl'}`;
    const form = beVerb.forms.irregular[key];
    if (form) return form;
  }

  // フォールバック
  if (tense === 'past') {
    return subject.person === 1 && subject.number === 'singular' ? 'was' : 'were';
  }
  // present
  if (subject.person === 1 && subject.number === 'singular') return 'am';
  if (subject.person === 3 && subject.number === 'singular') return 'is';
  return 'are';
}

/**
 * have動詞の助動詞形を取得（完了形用）
 */
export function getHaveAuxiliary(
  tense: 'past' | 'present' | 'future',
  subject: { person: 1 | 2 | 3; number: 'singular' | 'plural' }
): string {
  if (tense === 'future') return 'will have';
  if (tense === 'past') return 'had';

  // present
  if (subject.person === 3 && subject.number === 'singular') return 'has';
  return 'have';
}

/**
 * 主語が3人称単数かどうかを判定
 */
export function isThirdPersonSingular(subject: { person: 1 | 2 | 3; number: 'singular' | 'plural' }): boolean {
  return subject.person === 3 && subject.number === 'singular';
}
