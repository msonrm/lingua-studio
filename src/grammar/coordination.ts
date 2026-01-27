/**
 * 統一等位接続レンダリングモジュール
 *
 * 名詞句・動詞句・論理演算で共通の等位接続処理を提供
 * - プレースホルダー表示（欠損時）
 * - オックスフォードカンマ（3項目以上）
 * - both/either/neither（2項目）
 */

import { Conjunction } from '../types/schema';

// ============================================
// 型定義
// ============================================

/** 等位接続のコンテキスト */
export interface CoordinationContext {
  /** 接続詞 ('and' | 'or') */
  conjunction: Conjunction;
  /** 否定コンテキストか（neither...nor用） */
  isNegated?: boolean;
  /** both/either/neitherを使用するか（デフォルト: true） */
  useCorrelative?: boolean;
  /** オックスフォードカンマを使用するか（デフォルト: true） */
  useOxfordComma?: boolean;
}

/** レンダリング結果 */
export interface CoordinationResult {
  /** レンダリングされた文字列 */
  form: string;
  /** 相関接続詞が使われたか */
  usedCorrelative: boolean;
}

// ============================================
// 統一等位接続レンダリング
// ============================================

/**
 * 等位接続された要素をレンダリング
 *
 * @param items - 接続する要素の配列（null/undefinedは___に変換）
 * @param renderItem - 各要素をレンダリングする関数
 * @param ctx - 等位接続コンテキスト
 * @returns レンダリング結果
 *
 * @example
 * // 2項目: "both A and B", "either A or B"
 * renderCoordination([a, b], render, { conjunction: 'and' })
 *
 * @example
 * // 3項目以上: "A, B, and C" (オックスフォードカンマ)
 * renderCoordination([a, b, c], render, { conjunction: 'and' })
 *
 * @example
 * // 欠損: "both A and ___"
 * renderCoordination([a, null], render, { conjunction: 'and' })
 */
export function renderCoordination<T>(
  items: (T | null | undefined)[],
  renderItem: (item: T) => string,
  ctx: CoordinationContext
): CoordinationResult {
  const {
    conjunction,
    isNegated = false,
    useCorrelative = true,
    useOxfordComma = true,
  } = ctx;

  // 各要素をレンダリング（欠損は___）
  const rendered = items.map(item =>
    item != null ? renderItem(item) : '___'
  );

  // 要素数に応じた処理
  if (rendered.length === 0) {
    return { form: '___', usedCorrelative: false };
  }

  if (rendered.length === 1) {
    return { form: rendered[0], usedCorrelative: false };
  }

  if (rendered.length === 2) {
    // 2項目: 相関接続詞を使用
    const [first, second] = rendered;

    if (useCorrelative) {
      if (isNegated && conjunction === 'or') {
        // neither...nor
        return { form: `neither ${first} nor ${second}`, usedCorrelative: true };
      } else if (conjunction === 'and') {
        // both...and
        return { form: `both ${first} and ${second}`, usedCorrelative: true };
      } else {
        // either...or
        return { form: `either ${first} or ${second}`, usedCorrelative: true };
      }
    } else {
      return { form: `${first} ${conjunction} ${second}`, usedCorrelative: false };
    }
  }

  // 3項目以上: オックスフォードカンマ
  const allButLast = rendered.slice(0, -1);
  const last = rendered[rendered.length - 1];

  if (useOxfordComma) {
    // A, B, and C
    return {
      form: `${allButLast.join(', ')}, ${conjunction} ${last}`,
      usedCorrelative: false,
    };
  } else {
    // A, B and C (オックスフォードカンマなし)
    return {
      form: `${allButLast.join(', ')} ${conjunction} ${last}`,
      usedCorrelative: false,
    };
  }
}

// ============================================
// チェーン形式の等位接続レンダリング
// ============================================

/**
 * チェーン形式（coordinatedWith）の等位接続をフラット化してレンダリング
 *
 * VerbPhraseNodeのcoordinatedWithのような、チェーン形式の構造を
 * フラットな配列として処理し、統一的にレンダリング
 *
 * @param first - 最初の要素
 * @param getNext - 次の要素と接続詞を取得する関数
 * @param renderItem - 各要素をレンダリングする関数
 * @param defaultCtx - デフォルトの等位接続コンテキスト
 * @returns レンダリング結果
 */
export function renderCoordinationChain<T>(
  first: T | null | undefined,
  getNext: (item: T) => { conjunction: Conjunction; next: T | null | undefined } | undefined,
  renderItem: (item: T) => string,
  defaultCtx: Partial<CoordinationContext> = {}
): CoordinationResult {
  // チェーンをフラット化
  const items: (T | null | undefined)[] = [first];
  let conjunctions: Conjunction[] = [];

  let current = first;
  while (current != null) {
    const next = getNext(current);
    if (!next) break;

    conjunctions.push(next.conjunction);
    items.push(next.next);
    current = next.next ?? undefined;
  }

  // 接続詞が混在している場合（and + or）は単純結合
  const uniqueConjunctions = [...new Set(conjunctions)];
  if (uniqueConjunctions.length > 1) {
    // 混在: 単純に順番に結合
    const parts: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rendered = item != null ? renderItem(item) : '___';
      parts.push(rendered);
      if (i < conjunctions.length) {
        parts.push(conjunctions[i]);
      }
    }
    return { form: parts.join(' '), usedCorrelative: false };
  }

  // 単一の接続詞: 統一レンダリング
  const conjunction = uniqueConjunctions[0] || 'and';
  return renderCoordination(items, renderItem, {
    ...defaultCtx,
    conjunction,
  });
}

// ============================================
// ユーティリティ
// ============================================

/**
 * 相関接続詞のペアを取得
 */
export function getCorrelativePair(
  conjunction: Conjunction,
  isNegated: boolean = false
): { first: string; second: string } {
  if (isNegated && conjunction === 'or') {
    return { first: 'neither', second: 'nor' };
  } else if (conjunction === 'and') {
    return { first: 'both', second: 'and' };
  } else {
    return { first: 'either', second: 'or' };
  }
}
