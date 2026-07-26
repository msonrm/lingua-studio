/**
 * ブロックのドロップダウン用データ
 *
 * Blockly に依存しない純粋なデータなので、AST 生成側（astGenerator）からも
 * ブロック定義を読み込まずに参照できる。
 */

import { getPreDeterminers, getCentralDeterminers, getPostDeterminers } from './det-rules-en';

// ============================================
// TimeChip データ定義
// ============================================
type Tense = 'past' | 'present' | 'future' | 'inherit';
type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive' | 'inherit';

export interface TimeChipOption {
  msgKey: string;
  fallback: string;
  value: string;
  tense: Tense;
  aspect: Aspect;
}

export const CONCRETE_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TIME_YESTERDAY', fallback: 'Yesterday', value: 'yesterday', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_TODAY', fallback: 'Today', value: 'today', tense: 'present', aspect: 'simple' },
  { msgKey: 'TIME_TOMORROW', fallback: 'Tomorrow', value: 'tomorrow', tense: 'future', aspect: 'simple' },
  { msgKey: 'TIME_EVERY_DAY', fallback: 'Every day', value: 'every_day', tense: 'present', aspect: 'simple' },
  { msgKey: 'TIME_LAST_SUNDAY', fallback: 'Last Sunday', value: 'last_sunday', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_RIGHT_NOW', fallback: 'Right now', value: 'right_now', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_AT_THE_MOMENT', fallback: 'At the moment', value: 'at_the_moment', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_NEXT_WEEK', fallback: 'Next week', value: 'next_week', tense: 'future', aspect: 'simple' },
];

export const ASPECTUAL_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TIME_NOW', fallback: 'Now', value: 'now', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_JUST_NOW', fallback: 'Just now', value: 'just_now', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_ALREADY_YET', fallback: 'Already/Yet', value: 'completion', tense: 'inherit', aspect: 'perfect' },
  { msgKey: 'TIME_STILL', fallback: 'Still', value: 'still', tense: 'inherit', aspect: 'inherit' },
  { msgKey: 'TIME_RECENTLY', fallback: 'Recently', value: 'recently', tense: 'past', aspect: 'perfect' },
];

export const ABSTRACT_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TENSE_PAST', fallback: '[Past]', value: 'past', tense: 'past', aspect: 'inherit' },
  { msgKey: 'TENSE_FUTURE', fallback: '[Future]', value: 'future', tense: 'future', aspect: 'inherit' },
  { msgKey: 'TENSE_PRESENT', fallback: '[Current]', value: 'current', tense: 'present', aspect: 'inherit' },
  { msgKey: 'ASPECT_PROGRESSIVE', fallback: '[Progressive]', value: 'progressive', tense: 'inherit', aspect: 'progressive' },
  { msgKey: 'ASPECT_PERFECT', fallback: '[Perfect]', value: 'perfect', tense: 'inherit', aspect: 'perfect' },
  { msgKey: 'ASPECT_PERF_PROG', fallback: '[Perf. Prog.]', value: 'perfectProgressive', tense: 'inherit', aspect: 'perfectProgressive' },
];
// ============================================
// オプションのエクスポート（コンパイラ用）
// ============================================
export const TIME_CHIP_DATA = {
  concrete: CONCRETE_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
  aspectual: ASPECTUAL_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
  abstract: ABSTRACT_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
};

export const DETERMINER_DATA = {
  pre: getPreDeterminers(),
  central: getCentralDeterminers(),
  post: getPostDeterminers(),
};