/**
 * 統一等位接続レンダリングモジュール
 *
 * 名詞句・動詞句で共通の等位接続処理を提供する。
 *
 * 設計原則:
 * 1. **構造をそのまま受け取る。** AST の等位接続は n項ツリー
 *    （`CoordinatedNounPhraseNode` / `CoordinatedVerbPhraseNode`）なので、
 *    グループ化の情報を平坦化せずツリーのまま渡す。
 *    以前は要素の並びと接続詞から構造を推測していたため、
 *    純粋な OR の等位接続でもグループが割れて不要なカンマが入っていた。
 * 2. 入れ子のグループは correlative（both / either）で範囲を明示する。
 *    これにより `(A and B) or C` と `A and (B or C)` を書き分けられる。
 * 3. カンマは「3要素以上（オックスフォードカンマ）」または
 *    「末尾以外にグループがある」ときだけ打つ。
 */

import { Conjunction } from '../../types/schema';

// ============================================
// 型定義
// ============================================

/** 等位接続の要素: 単一要素（葉）か、入れ子のグループ */
export type CoordItem<T> =
  | {
      kind: 'leaf';
      value: T;
      /**
       * この要素が独立した節として始まるか（自分の主語を持つ）。
       * "I eat, and my father runs." のように節を繋ぐ場合はカンマが要る。
       * 主語を共有する句の等位（"I eat and drink"）では false。
       */
      startsNewClause?: boolean;
    }
  | { kind: 'group'; group: CoordGroup<T> };

/** 等位接続のグループ */
export interface CoordGroup<T> {
  conjunction: Conjunction;
  items: CoordItem<T>[];
}

/** 葉を作る短縮関数 */
export function leaf<T>(value: T, startsNewClause = false): CoordItem<T> {
  return { kind: 'leaf', value, startsNewClause };
}

/** グループを要素として包む短縮関数 */
export function group<T>(g: CoordGroup<T>): CoordItem<T> {
  return { kind: 'group', group: g };
}

// ============================================
// メイン関数
// ============================================

/**
 * 等位接続をレンダリングする
 *
 * @param g - 等位接続のツリー
 * @param renderLeaf - 葉をレンダリングする関数
 *
 * @example
 * // フラット2要素:      "A and B"        （カンマなし）
 * // フラット3要素:      "A, B, and C"    （オックスフォードカンマ）
 * // or(and(A,B), C):    "both A and B, or C"
 * // and(A, or(B,C)):    "A and either B or C"
 */
export function renderCoordination<T>(
  g: CoordGroup<T>,
  renderLeaf: (value: T) => string
): string {
  return renderGroup(g, renderLeaf, false);
}

// ============================================
// ヘルパー関数
// ============================================

function renderGroup<T>(
  g: CoordGroup<T>,
  renderLeaf: (value: T) => string,
  isNested: boolean
): string {
  const parts = g.items.map(item =>
    item.kind === 'leaf' ? renderLeaf(item.value) : renderGroup(item.group, renderLeaf, true)
  );

  if (parts.length === 0) return '___';
  if (parts.length === 1) return parts[0];

  const joined = joinParts(parts, g.conjunction, needsComma(g, parts.length));

  // 入れ子の2要素グループは correlative で範囲を明示する。
  // 3要素以上ではカンマの位置が範囲を示すので付けない（"both A, B, and C" は非文法的）。
  if (isNested && parts.length === 2) {
    const correlative = g.conjunction === 'and' ? 'both' : 'either';
    return `${correlative} ${joined}`;
  }

  return joined;
}

/**
 * 最後の接続詞の前にカンマを打つかどうか
 *
 * - 3要素以上 → オックスフォードカンマ
 * - 末尾以外にグループがある → 区切りを明示する
 *   （末尾のグループには correlative が付くのでカンマは不要）
 * - 2要素目以降が独立した節 → 節の等位接続なのでカンマを打つ
 *   "I eat, and my father runs."（主語が違う）
 *   "I eat and drink."（主語を共有 → カンマなし）
 */
function needsComma<T>(g: CoordGroup<T>, partCount: number): boolean {
  if (partCount >= 3) return true;
  if (g.items.slice(0, -1).some(item => item.kind === 'group')) return true;
  return g.items.slice(1).some(item => item.kind === 'leaf' && item.startsNewClause);
}

function joinParts(parts: string[], conjunction: Conjunction, comma: boolean): string {
  const allButLast = parts.slice(0, -1);
  const last = parts[parts.length - 1];

  if (!comma) {
    return `${allButLast.join(' ')} ${conjunction} ${last}`;
  }
  return `${allButLast.join(', ')}, ${conjunction} ${last}`;
}
