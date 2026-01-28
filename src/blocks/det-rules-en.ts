/**
 * 英語限定詞（Determiner）ルールとデータ
 *
 * このファイルは英語特有の限定詞システムを定義します：
 * - PRE（前置限定詞）: all, both, half
 * - CENTRAL（中央限定詞）: the, a, this/that/these/those, 所有格(my,your,his,her,its,our,their),
 *                        no, each, every, either, neither, any,
 *                        複合量化詞(a few, a little, a lot of, plenty of, a number of,
 *                                  a couple of, a great deal of, many a, quite a few)
 * - POST（後置限定詞）: 数詞(one,two,three)、数量詞(many,few,little,much,some,several)、
 *                      plural/uncountableマーカー
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
  { label: 'all', value: 'all', output: 'all' },
  { label: 'both', value: 'both', number: 'plural', output: 'both' },
  { label: 'half', value: 'half', output: 'half' },
];

// 中央限定詞（central determiner）
export const CENTRAL_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'the', value: 'the', output: 'the' },
  { label: 'a/an', value: 'a', number: 'singular', output: 'a' },
  { label: 'this', value: 'this', number: 'singular', output: 'this' },
  { label: 'that', value: 'that', number: 'singular', output: 'that' },
  { label: 'these', value: 'these', number: 'plural', output: 'these' },
  { label: 'those', value: 'those', number: 'plural', output: 'those' },
  { label: 'my', value: 'my', output: 'my' },
  { label: 'your', value: 'your', output: 'your' },
  { label: 'his', value: 'his', output: 'his' },
  { label: 'her', value: 'her', output: 'her' },
  { label: 'its', value: 'its', output: 'its' },
  { label: 'our', value: 'our', output: 'our' },
  { label: 'their', value: 'their', output: 'their' },
  { label: 'no', value: 'no', output: 'no' },
  { label: 'each', value: 'each', number: 'singular', output: 'each' },
  { label: 'every', value: 'every', number: 'singular', output: 'every' },
  { label: 'either', value: 'either', number: 'singular', output: 'either' },
  { label: 'neither', value: 'neither', number: 'singular', output: 'neither' },
  { label: 'any', value: 'any', output: 'any' },
  // 複合量化詞（compound quantifiers）
  { label: 'a few', value: 'a_few', number: 'plural', output: 'a few' },
  { label: 'a little', value: 'a_little', number: 'uncountable', output: 'a little' },
  { label: 'a lot of', value: 'a_lot_of', output: 'a lot of' },  // 可算/不可算両方
  { label: 'plenty of', value: 'plenty_of', output: 'plenty of' },  // 可算/不可算両方
  { label: 'a number of', value: 'a_number_of', number: 'plural', output: 'a number of' },
  { label: 'a couple of', value: 'a_couple_of', number: 'plural', output: 'a couple of' },
  { label: 'a great deal of', value: 'a_great_deal_of', number: 'uncountable', output: 'a great deal of' },
  { label: 'many a', value: 'many_a', number: 'singular', output: 'many a' },  // 文語的
  { label: 'quite a few', value: 'quite_a_few', number: 'plural', output: 'quite a few' },
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
    { label: 'little', value: 'little', number: 'uncountable', output: 'little' },
    { label: 'much', value: 'much', number: 'uncountable', output: 'much' },
    { label: 'some', value: 'some', output: 'some' },  // 可算/不可算両方OK
    { label: 'several', value: 'several', number: 'plural', output: 'several' },
    { label: msg('DET_PLURAL', '[plural]'), value: '__plural__', number: 'plural', output: null },
    { label: msg('DET_UNCOUNTABLE', '[–]'), value: '__uncountable__', number: 'uncountable', output: null },
  ];
}

// ============================================
// 排他ルール
// 構造: { [変更された項目の値]: { [影響を受ける項目]: { excludes: 排他値[], resetTo: リセット先 } } }
// ============================================

// 複合量化詞リスト（再利用用）
const COMPOUND_QUANTIFIERS = ['a_few', 'a_little', 'a_lot_of', 'plenty_of', 'a_number_of', 'a_couple_of', 'a_great_deal_of', 'many_a', 'quite_a_few'];

// PRE値が変更された時の、CENTRAL/POSTへの影響
export const PRE_EXCLUSIONS: Record<string, { CENTRAL?: ExclusionRule; POST?: ExclusionRule }> = {
  'all': {
    CENTRAL: { excludes: ['a', 'no'], resetTo: 'the' },
    POST: { excludes: ['one'], resetTo: '__none__' },
  },
  'both': {
    CENTRAL: { excludes: ['a', 'no', 'this', 'that', 'these', 'those', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: 'the' },
    POST: { excludes: ['one', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__uncountable__'], resetTo: 'two' },
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
  'these': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['one', '__uncountable__'], resetTo: '__none__' },
  },
  'those': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['one', '__uncountable__'], resetTo: '__none__' },
  },
  'no': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['some', '__uncountable__'], resetTo: '__none__' },
  },
  'each': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'every': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'either': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'neither': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'any': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
  },
  'a_few': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'a_little': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'a_lot_of': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'plenty_of': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'a_number_of': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'a_couple_of': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'many_a': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'a_great_deal_of': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
  'quite_a_few': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    POST: { excludes: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'], resetTo: '__none__' },
  },
};

// POST値が変更された時の、PRE/CENTRALへの影響
export const POST_EXCLUSIONS: Record<string, { PRE?: ExclusionRule; CENTRAL?: ExclusionRule }> = {
  'one': {
    PRE: { excludes: ['all', 'both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'these', 'those', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  'two': {
    PRE: { excludes: ['half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  'three': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  'many': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  'few': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },  // 'a few' は有効だが複合量化詞は不可
  },
  'some': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'no', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  'several': {
    PRE: { excludes: ['both', 'half'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  '__plural__': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'this', 'that', 'each', 'every', 'either', 'neither', ...COMPOUND_QUANTIFIERS], resetTo: '__none__' },
  },
  '__uncountable__': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'these', 'those', 'each', 'every', 'either', 'neither', 'a_few', 'a_number_of', 'a_couple_of', 'many_a', 'quite_a_few'], resetTo: '__none__' },
  },
  'little': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'these', 'those', 'each', 'every', 'either', 'neither', 'a_few', 'a_number_of', 'a_couple_of', 'many_a', 'quite_a_few'], resetTo: '__none__' },
  },
  'much': {
    PRE: { excludes: ['both'], resetTo: '__none__' },
    CENTRAL: { excludes: ['a', 'these', 'those', 'each', 'every', 'either', 'neither', 'a_few', 'a_number_of', 'a_couple_of', 'many_a', 'quite_a_few'], resetTo: '__none__' },
  },
};

// ============================================
// 名詞タイプ別制約
// ============================================
export const NOUN_TYPE_CONSTRAINTS: Record<NounType, NounTypeConstraint> = {
  countable: {
    default: { pre: '__none__', central: 'a', post: '__none__' },
    invalid: { pre: [], central: ['a_little', 'a_great_deal_of'], post: ['little', 'much', '__uncountable__'] },
  },
  uncountable: {
    default: { pre: '__none__', central: '__none__', post: '__uncountable__' },
    invalid: {
      pre: ['both'],
      central: ['a', 'each', 'every', 'either', 'neither', 'a_few', 'a_number_of', 'a_couple_of', 'many_a', 'quite_a_few'],
      post: ['one', 'two', 'three', 'many', 'few', 'several', '__plural__'],
    },
  },
  proper: {
    default: { pre: '__none__', central: '__none__', post: '__none__' },
    invalid: {
      pre: ['all', 'both', 'half'],
      central: ['the', 'this', 'that', 'a', 'my', 'your', 'no', 'each', 'every', 'either', 'neither', 'any', ...COMPOUND_QUANTIFIERS],
      post: ['one', 'two', 'three', 'many', 'few', 'little', 'much', 'some', 'several', '__plural__', '__uncountable__'],
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
 * 名詞タイプに基づいて適切なDET値を計算（副作用なし）
 * @returns 新しい値のセット、または変更不要の場合null
 */
export function calculateNounTypeValues(
  nounType: NounType,
  currentValues: { PRE: string; CENTRAL: string; POST: string }
): { PRE: string; CENTRAL: string; POST: string } | null {
  const constraint = NOUN_TYPE_CONSTRAINTS[nounType];

  // いずれかのフィールドが無効な値を持っていたら、デフォルトにリセット
  const hasInvalidPre = constraint.invalid.pre.includes(currentValues.PRE);
  const hasInvalidCentral = constraint.invalid.central.includes(currentValues.CENTRAL);
  const hasInvalidPost = constraint.invalid.post.includes(currentValues.POST);

  if (hasInvalidPre || hasInvalidCentral || hasInvalidPost) {
    return {
      PRE: constraint.default.pre,
      CENTRAL: constraint.default.central,
      POST: constraint.default.post,
    };
  } else if (nounType === 'countable') {
    // 可算名詞で全て__none__なら自動でaを設定
    if (currentValues.PRE === '__none__' && currentValues.CENTRAL === '__none__' && currentValues.POST === '__none__') {
      return {
        PRE: '__none__',
        CENTRAL: 'a',
        POST: '__none__',
      };
    }
  }

  return null; // 変更不要
}

/**
 * 名詞タイプに基づいてDET値をリセット（後方互換性のため維持）
 */
export function applyNounTypeConstraints(
  nounType: NounType,
  currentValues: { PRE: string; CENTRAL: string; POST: string },
  setFieldValue: (field: DetField, value: string) => void
): void {
  const newValues = calculateNounTypeValues(nounType, currentValues);
  if (newValues) {
    setFieldValue('PRE', newValues.PRE);
    setFieldValue('CENTRAL', newValues.CENTRAL);
    setFieldValue('POST', newValues.POST);
  }
}

// ============================================
// 有効な組み合わせリスト（起動時に生成）
// ============================================

/**
 * 排他ルールに基づいて有効な組み合わせかどうか判定
 */
function isValidByExclusionRules(pre: string, central: string, post: string): boolean {
  // PRE → CENTRAL/POST 制約
  const preExcl = PRE_EXCLUSIONS[pre];
  if (preExcl) {
    if (preExcl.CENTRAL?.excludes.includes(central)) return false;
    if (preExcl.POST?.excludes.includes(post)) return false;
  }

  // CENTRAL → PRE/POST 制約
  const centralExcl = CENTRAL_EXCLUSIONS[central];
  if (centralExcl) {
    if (centralExcl.PRE?.excludes.includes(pre)) return false;
    if (centralExcl.POST?.excludes.includes(post)) return false;
  }

  // POST → PRE/CENTRAL 制約
  const postExcl = POST_EXCLUSIONS[post];
  if (postExcl) {
    if (postExcl.PRE?.excludes.includes(pre)) return false;
    if (postExcl.CENTRAL?.excludes.includes(central)) return false;
  }

  return true;
}

/**
 * 名詞タイプ別の追加制約（組み合わせレベル）
 * - 基本の排他ルールに加えて、名詞タイプ固有の制約を適用
 */
function isValidForNounType(
  pre: string,
  central: string,
  post: string,
  nounType: NounType | null
): boolean {
  // 名詞タイプ別の invalid リストをチェック
  if (nounType) {
    const constraint = NOUN_TYPE_CONSTRAINTS[nounType];
    if (constraint.invalid.pre.includes(pre)) return false;
    if (constraint.invalid.central.includes(central)) return false;
    if (constraint.invalid.post.includes(post)) return false;
  }

  // countable 専用の追加制約
  if (nounType === 'countable') {
    // 裸の単数形は不可（CENTRAL=none かつ POST=none）
    if (central === '__none__' && post === '__none__') return false;

    // both は複数要求（POST=none は不可）
    if (pre === 'both' && post === '__none__') return false;
  }

  return true;
}

/**
 * ルールから有効な組み合わせリストを生成（名詞タイプ別）
 */
function generateValidCombinationsForNounType(nounType: NounType | null): Set<string> {
  const validSet = new Set<string>();
  const POST_DETERMINERS = getPostDeterminers();

  for (const pre of PRE_DETERMINERS) {
    for (const central of CENTRAL_DETERMINERS) {
      for (const post of POST_DETERMINERS) {
        if (isValidByExclusionRules(pre.value, central.value, post.value) &&
            isValidForNounType(pre.value, central.value, post.value, nounType)) {
          validSet.add(`${pre.value}|${central.value}|${post.value}`);
        }
      }
    }
  }

  return validSet;
}

// モジュール読み込み時に名詞タイプ別リストを生成
const VALID_COMBINATIONS_BY_NOUN_TYPE: Record<string, Set<string>> = {
  null: generateValidCombinationsForNounType(null),
  countable: generateValidCombinationsForNounType('countable'),
  uncountable: generateValidCombinationsForNounType('uncountable'),
  proper: generateValidCombinationsForNounType('proper'),
  zeroArticle: generateValidCombinationsForNounType('zeroArticle'),
};

/**
 * 指定された組み合わせが有効かどうか判定（名詞タイプ考慮）
 */
export function isValidCombination(
  pre: string,
  central: string,
  post: string,
  nounType: NounType | null = null
): boolean {
  const key = nounType ?? 'null';
  return VALID_COMBINATIONS_BY_NOUN_TYPE[key].has(`${pre}|${central}|${post}`);
}

/**
 * 指定されたフィールドの値を変更した場合、有効な組み合わせになるか判定
 * （バツ印表示の判定に使用）
 */
export function wouldBeValidCombination(
  field: DetField,
  newValue: string,
  currentValues: { PRE: string; CENTRAL: string; POST: string },
  nounType: NounType | null = null
): boolean {
  const testValues = { ...currentValues, [field]: newValue };
  return isValidCombination(testValues.PRE, testValues.CENTRAL, testValues.POST, nounType);
}
