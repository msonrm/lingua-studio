/**
 * 英語限定詞（Determiner）ルールとデータ
 *
 * このファイルは英語特有の限定詞システムを定義します：
 * - PRE（前置限定詞）: all, both, half
 * - CENTRAL（中央限定詞）: the, a, this, that, my, your, no
 * - POST（後置限定詞）: 数詞、数量詞、plural/uncountableマーカー
 *
 * 排他ルールは英文法に基づいており、無効な組み合わせを防ぎます。
 */

import * as Blockly from 'blockly';

// ============================================
// ヘルパー: Blockly.Msg から取得（フォールバック付き）
// ============================================
function msg(key: string, fallback: string): string {
  return Blockly.Msg[key] || fallback;
}

// ============================================
// 型定義
// ============================================
export type GrammaticalNumber = 'singular' | 'plural' | 'uncountable';

export interface DeterminerOption {
  label: string;
  value: string;
  number?: GrammaticalNumber;  // 文法数への影響
  output: string | null;       // null = 出力なし（マーカーのみ）
}

export type DetField = 'PRE' | 'CENTRAL' | 'POST';

export interface ExclusionRule {
  excludes: string[];  // 排他となる値のリスト
  resetTo: string;     // リセット先の値
}

export type NounType = 'countable' | 'uncountable' | 'proper' | 'zeroArticle';

export interface NounTypeConstraint {
  default: { pre: string; central: string; post: string };
  invalid: { pre: string[]; central: string[]; post: string[] };
}

// ============================================
// 限定詞データ
// ============================================

// 前置限定詞（predeterminer）
export const PRE_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'all', value: 'all', number: 'plural', output: 'all' },
  { label: 'both', value: 'both', number: 'plural', output: 'both' },
  { label: 'half', value: 'half', output: 'half' },
];

// 中央限定詞（central determiner）
export const CENTRAL_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'the', value: 'the', output: 'the' },
  { label: 'this', value: 'this', number: 'singular', output: 'this' },
  { label: 'that', value: 'that', number: 'singular', output: 'that' },
  { label: 'a/an', value: 'a', number: 'singular', output: 'a' },
  { label: 'my', value: 'my', output: 'my' },
  { label: 'your', value: 'your', output: 'your' },
  { label: 'no', value: 'no', output: 'no' },
];

// 後置限定詞（postdeterminer）- ローカライズ可能なラベルを動的に生成
export function getPostDeterminers(): DeterminerOption[] {
  return [
    { label: '─', value: '__none__', output: null },
    { label: 'one', value: 'one', number: 'singular', output: 'one' },
    { label: 'two', value: 'two', number: 'plural', output: 'two' },
    { label: 'three', value: 'three', number: 'plural', output: 'three' },
    { label: 'many', value: 'many', number: 'plural', output: 'many' },
    { label: 'few', value: 'few', number: 'plural', output: 'few' },
    { label: 'some', value: 'some', number: 'plural', output: 'some' },
    { label: 'several', value: 'several', number: 'plural', output: 'several' },
    { label: msg('DET_PLURAL', '[plural]'), value: '__plural__', number: 'plural', output: null },
    { label: msg('DET_UNCOUNTABLE', '[–]'), value: '__uncountable__', number: 'uncountable', output: null },
  ];
}

// ============================================
// 排他ルール
// 構造: { [変更された項目の値]: { [影響を受ける項目]: { excludes: 排他値[], resetTo: リセット先 } } }
// ============================================

// PRE値が変更された時の、CENTRAL/POSTへの影響
export const PRE_EXCLUSIONS: Record<string, { CENTRAL?: ExclusionRule; POST?: ExclusionRule }> = {
  'all': {
    CENTRAL: { excludes: ['a', 'no'], resetTo: 'the' },
    POST: { excludes: ['one'], resetTo: '__none__' },
  },
  'both': {
    CENTRAL: { excludes: ['a', 'no', 'this', 'that'], resetTo: 'the' },
    POST: { excludes: ['one', 'three', 'many', 'few', 'some', 'several', '__uncountable__'], resetTo: 'two' },
  },
  'half': {
    CENTRAL: { excludes: ['a', 'no'], resetTo: 'the' },
    POST: { excludes: ['one', '__uncountable__'], resetTo: '__none__' },
  },
};

// CENTRAL値が変更された時の、PRE/POSTへの影響
export const CENTRAL_EXCLUSIONS: Record<string, { PRE?: ExclusionRule; POST?: ExclusionRule }> = {
  'a': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'this': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'that': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'no': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['some', '__uncountable__'], resetTo: '__none__' },
  },
  'my': {
    POST: { excludes: ['__uncountable__'], resetTo: '__none__' },
  },
  'your': {
    POST: { excludes: ['__uncountable__'], resetTo: '__none__' },
  },
};

// POST値が変更された時の、PRE/CENTRALへの影響
export const POST_EXCLUSIONS: Record<string, { PRE?: ExclusionRule; CENTRAL?: ExclusionRule }> = {
  'one': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a'], resetTo: '__none__' },
  },
  'two': {
    PRE: { excludes: ['half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that'], resetTo: '__none__' },
  },
  'three': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that'], resetTo: '__none__' },
  },
  'many': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that'], resetTo: '__none__' },
  },
  'few': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['this', 'that'], resetTo: '__none__' },  // 'a few' は有効
  },
  'some': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'no'], resetTo: '__none__' },
  },
  'several': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that'], resetTo: '__none__' },
  },
  '__plural__': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that'], resetTo: '__none__' },
  },
  '__uncountable__': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'my', 'your'], resetTo: '__none__' },
  },
};

// ============================================
// 名詞タイプ別制約
// ============================================
export const NOUN_TYPE_CONSTRAINTS: Record<NounType, NounTypeConstraint> = {
  countable: {
    default: { pre: '__none__', central: 'a', post: '__none__' },
    invalid: { pre: [], central: [], post: ['__uncountable__'] },
  },
  uncountable: {
    default: { pre: '__none__', central: '__none__', post: '__uncountable__' },
    invalid: {
      pre: ['both'],
      central: ['a'],
      post: ['one', 'two', 'three', 'many', 'few', 'several', '__plural__'],
    },
  },
  proper: {
    default: { pre: '__none__', central: '__none__', post: '__none__' },
    invalid: {
      pre: ['all', 'both', 'half'],
      central: ['the', 'this', 'that', 'a', 'my', 'your', 'no'],
      post: ['one', 'two', 'three', 'many', 'few', 'some', 'several', '__plural__', '__uncountable__'],
    },
  },
  zeroArticle: {
    default: { pre: '__none__', central: '__none__', post: '__none__' },
    invalid: { pre: [], central: [], post: ['__uncountable__'] },
  },
};

// ============================================
// ヘルパー関数
// ============================================

/**
 * 指定されたフィールドの値が変更された時、他のフィールドを必要に応じてリセット
 */
export function applyExclusionRules(
  changedField: DetField,
  newValue: string,
  currentValues: { PRE: string; CENTRAL: string; POST: string },
  setFieldValue: (field: DetField, value: string) => void
): void {
  let exclusions: { PRE?: ExclusionRule; CENTRAL?: ExclusionRule; POST?: ExclusionRule } | undefined;

  if (changedField === 'PRE') {
    exclusions = PRE_EXCLUSIONS[newValue];
  } else if (changedField === 'CENTRAL') {
    exclusions = CENTRAL_EXCLUSIONS[newValue];
  } else if (changedField === 'POST') {
    exclusions = POST_EXCLUSIONS[newValue];
  }

  if (!exclusions) return;

  // 各フィールドをチェックしてリセット
  for (const field of ['PRE', 'CENTRAL', 'POST'] as DetField[]) {
    if (field === changedField) continue;
    const rule = exclusions[field];
    if (rule && rule.excludes.includes(currentValues[field])) {
      setFieldValue(field, rule.resetTo);
    }
  }
}

/**
 * 指定されたフィールドの値が、他のフィールドの現在値と排他かどうか判定
 */
export function isExcludedByOthers(
  field: DetField,
  value: string,
  currentValues: { PRE: string; CENTRAL: string; POST: string }
): boolean {
  if (value === '__none__') return false;

  // 他の2つのフィールドからの排他をチェック
  for (const otherField of ['PRE', 'CENTRAL', 'POST'] as DetField[]) {
    if (otherField === field) continue;

    let exclusions: { PRE?: ExclusionRule; CENTRAL?: ExclusionRule; POST?: ExclusionRule } | undefined;
    if (otherField === 'PRE') {
      exclusions = PRE_EXCLUSIONS[currentValues.PRE];
    } else if (otherField === 'CENTRAL') {
      exclusions = CENTRAL_EXCLUSIONS[currentValues.CENTRAL];
    } else if (otherField === 'POST') {
      exclusions = POST_EXCLUSIONS[currentValues.POST];
    }

    if (exclusions?.[field]?.excludes.includes(value)) {
      return true;
    }
  }
  return false;
}

/**
 * 名詞タイプに基づいてDET値をリセット
 */
export function applyNounTypeConstraints(
  nounType: NounType,
  currentValues: { PRE: string; CENTRAL: string; POST: string },
  setFieldValue: (field: DetField, value: string) => void
): void {
  const constraint = NOUN_TYPE_CONSTRAINTS[nounType];

  // いずれかのフィールドが無効な値を持っていたら、デフォルトにリセット
  const hasInvalidPre = constraint.invalid.pre.includes(currentValues.PRE);
  const hasInvalidCentral = constraint.invalid.central.includes(currentValues.CENTRAL);
  const hasInvalidPost = constraint.invalid.post.includes(currentValues.POST);

  if (hasInvalidPre || hasInvalidCentral || hasInvalidPost) {
    setFieldValue('PRE', constraint.default.pre);
    setFieldValue('CENTRAL', constraint.default.central);
    setFieldValue('POST', constraint.default.post);
  } else if (nounType === 'countable') {
    // 可算名詞で全て__none__なら自動でaを設定
    if (currentValues.PRE === '__none__' && currentValues.CENTRAL === '__none__' && currentValues.POST === '__none__') {
      setFieldValue('CENTRAL', 'a');
    }
  }
}
