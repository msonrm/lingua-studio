/**
 * English Syntax Rules - 英語の統語論ルール
 *
 * 語順・構造変化に関するルール:
 * - Do-support (do挿入)
 * - Inversion (主語-助動詞倒置)
 * - Wh-movement (Wh語の前置)
 */

import type { RenderContext } from '../../../../grammar/types';

// ============================================
// Do-support (do挿入)
// ============================================

/**
 * do-support が必要かどうかを判定
 */
export function needsDoSupport(ctx: RenderContext): boolean {
  // モダリティがある場合は不要
  if (ctx.hasModal) return false;

  // be動詞は不要
  if (ctx.isBeVerb) return false;

  // 助動詞がある場合は不要（進行形・完了形）
  if (ctx.hasAuxiliary) return false;

  // 否定文または疑問文で必要
  return ctx.polarity === 'negative' || ctx.isQuestion;
}

/**
 * do の形式を決定
 */
export function getDoForm(ctx: RenderContext): 'do' | 'does' | 'did' {
  if (ctx.tense === 'past') return 'did';
  if (ctx.tense === 'present') {
    return ctx.subject.person === 3 && ctx.subject.number === 'singular' ? 'does' : 'do';
  }
  // future は will を使うので do-support は通常不要
  return 'do';
}

/**
 * do-support の説明を生成
 */
export function describeDoSupport(ctx: RenderContext): string {
  const reason = ctx.polarity === 'negative' ? 'negation' : 'question';
  const tense = ctx.tense;
  return `${reason} + ${tense} tense`;
}

// ============================================
// Inversion (主語-助動詞倒置)
// ============================================

/**
 * 倒置が必要かどうかを判定
 */
export function needsInversion(ctx: RenderContext): boolean {
  // 疑問文でない場合は不要
  if (!ctx.isQuestion) return false;

  // 主語疑問文の場合は不要（Who ate? は倒置なし）
  if (ctx.isSubjectQuestion) return false;

  return true;
}

/**
 * 倒置を適用
 *
 * @param subject - 主語
 * @param auxiliary - 助動詞
 * @returns 倒置後の配列 [auxiliary, subject]
 */
export function applyInversion(
  subject: string,
  auxiliary: string
): { before: [string, string]; after: [string, string] } {
  return {
    before: [subject, auxiliary],
    after: [auxiliary, subject]
  };
}

/**
 * 倒置の説明を生成
 */
export function describeInversion(_ctx: RenderContext): string {
  return 'Question formation';
}

// ============================================
// Wh-movement (Wh語の前置)
// ============================================

/**
 * Wh移動が必要かどうかを判定
 */
export function needsWhMovement(ctx: RenderContext): boolean {
  return ctx.isWhQuestion && !!ctx.whWord;
}

/**
 * Wh移動の説明を生成
 */
export function describeWhMovement(whWord: string, role: string): string {
  return `Wh-word "${whWord}" in ${role} fronted to sentence start`;
}

// ============================================
// Word Order (語順)
// ============================================

/**
 * 英語の基本語順 (SVO)
 */
export function getBasicWordOrder(): ['subject', 'verb', 'object'] {
  return ['subject', 'verb', 'object'];
}

/**
 * 疑問文の語順
 */
export function getQuestionWordOrder(ctx: RenderContext): string[] {
  if (ctx.isWhQuestion && !ctx.isSubjectQuestion) {
    // Wh-object question: Wh Aux S V
    return ['wh', 'auxiliary', 'subject', 'verb', 'rest'];
  }
  if (ctx.isWhQuestion && ctx.isSubjectQuestion) {
    // Wh-subject question: Wh V O
    return ['wh', 'verb', 'object'];
  }
  // Yes/No question: Aux S V O
  return ['auxiliary', 'subject', 'verb', 'object'];
}

/**
 * 頻度副詞の位置を決定
 *
 * 英語では頻度副詞は通常:
 * - 一般動詞の前: "I always eat"
 * - be動詞の後: "I am always happy"
 * - 助動詞の後: "I have always eaten"
 */
export function getFrequencyAdverbPosition(
  hasAuxiliary: boolean,
  isBeVerb: boolean
): 'before-verb' | 'after-auxiliary' | 'after-be' {
  if (hasAuxiliary) return 'after-auxiliary';
  if (isBeVerb) return 'after-be';
  return 'before-verb';
}

/**
 * 否定語 "not" の位置を決定
 */
export function getNegationPosition(
  hasAuxiliary: boolean,
  hasModal: boolean,
  isBeVerb: boolean
): 'after-auxiliary' | 'after-modal' | 'after-be' | 'after-do' {
  if (hasModal) return 'after-modal';
  if (hasAuxiliary) return 'after-auxiliary';
  if (isBeVerb) return 'after-be';
  return 'after-do';  // do-support が必要
}
