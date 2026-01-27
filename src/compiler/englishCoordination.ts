/**
 * 統一等位接続レンダリングモジュール
 *
 * 名詞句・動詞句で共通の等位接続処理を提供
 *
 * 設計原則:
 * 1. 収集（抽象化）: 要素をグループ情報と共に収集
 * 2. グルーピング: 同じグループ・接続詞でまとめる
 * 3. フォーマット規則の適用:
 *    - 1階層 → 素の接続詞（A and B, A, B, and C）
 *    - 複数階層 → correlative で構造明示（both A and B, either A or B）
 * 4. 具体化（レンダリング）: 文字列生成
 */

import { Conjunction } from '../types/schema';

// ============================================
// 型定義
// ============================================

/** 等位接続の要素 */
export interface CoordElement<T> {
  /** 要素の値 */
  value: T;
  /** グループID（同じIDは同一グループ、例: 主語が同じ） */
  groupId: string;
  /** この要素への接続詞（最初の要素はnull） */
  conjunction: Conjunction | null;
}

/** グルーピング結果 */
interface CoordGroup<T> {
  /** グループ内の要素 */
  elements: T[];
  /** グループの接続詞 */
  conjunction: Conjunction;
  /** グループID */
  groupId: string;
}

/** フォーマット済みグループ */
interface FormattedGroup {
  /** レンダリング済み文字列 */
  text: string;
  /** 次のグループへの接続詞 */
  conjunction: Conjunction | null;
}

// ============================================
// メイン関数
// ============================================

/**
 * 等位接続をレンダリング
 *
 * @param elements - 接続する要素の配列
 * @param renderElement - 各要素をレンダリングする関数
 * @returns フォーマット済み文字列
 *
 * @example
 * // 1階層（フラット）: "A and B" or "A, B, and C"
 * renderCoordinationUnified([
 *   { value: a, groupId: 'x', conjunction: null },
 *   { value: b, groupId: 'x', conjunction: 'and' },
 * ], render)
 *
 * @example
 * // 複数階層: "both A and B, and C"
 * renderCoordinationUnified([
 *   { value: a, groupId: 'x', conjunction: null },
 *   { value: b, groupId: 'x', conjunction: 'and' },
 *   { value: c, groupId: 'y', conjunction: 'and' },
 * ], render)
 */
export function renderCoordinationUnified<T>(
  elements: CoordElement<T>[],
  renderElement: (elem: T) => string
): string {
  if (elements.length === 0) return '___';
  if (elements.length === 1) return renderElement(elements[0].value);

  // 1. グルーピング: 連続する同一グループ・同一接続詞をまとめる
  const groups = groupElements(elements);

  // 2. 階層判定: 複数グループがあるか
  const isNested = groups.length > 1;

  // 3. 各グループをフォーマット
  const formattedGroups: FormattedGroup[] = groups.map((group, index) => {
    const renderedElements = group.elements.map(renderElement);
    const text = formatGroup(renderedElements, group.conjunction, isNested);

    // 次のグループへの接続詞（最後のグループはnull）
    const nextConjunction = index < groups.length - 1
      ? groups[index + 1].conjunction
      : null;

    return { text, conjunction: nextConjunction };
  });

  // 4. グループを結合
  return joinGroups(formattedGroups);
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * 要素をグループにまとめる
 * 連続する同一groupId・同一conjunctionの要素を1グループに
 */
function groupElements<T>(elements: CoordElement<T>[]): CoordGroup<T>[] {
  const groups: CoordGroup<T>[] = [];

  let currentGroup: CoordGroup<T> | null = null;

  for (const elem of elements) {
    const conjunction = elem.conjunction || 'and'; // 最初の要素はデフォルト'and'

    if (
      currentGroup &&
      currentGroup.groupId === elem.groupId &&
      currentGroup.conjunction === conjunction
    ) {
      // 同じグループに追加
      currentGroup.elements.push(elem.value);
    } else {
      // 新しいグループ開始
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        elements: [elem.value],
        conjunction,
        groupId: elem.groupId,
      };
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * グループ内の要素をフォーマット
 *
 * @param elements - レンダリング済み要素
 * @param conjunction - 接続詞
 * @param useCorrelative - correlative（both/either）を使うか
 */
function formatGroup(
  elements: string[],
  conjunction: Conjunction,
  useCorrelative: boolean
): string {
  if (elements.length === 0) return '___';
  if (elements.length === 1) return elements[0];

  if (elements.length === 2) {
    if (useCorrelative) {
      // 複数階層: both A and B / either A or B
      const correlative = conjunction === 'and' ? 'both' : 'either';
      return `${correlative} ${elements[0]} ${conjunction} ${elements[1]}`;
    } else {
      // 1階層: A and B
      return `${elements[0]} ${conjunction} ${elements[1]}`;
    }
  }

  // 3要素以上: A, B, and C（オックスフォードカンマ）
  const allButLast = elements.slice(0, -1);
  const last = elements[elements.length - 1];
  return `${allButLast.join(', ')}, ${conjunction} ${last}`;
}

/**
 * フォーマット済みグループを結合
 */
function joinGroups(groups: FormattedGroup[]): string {
  if (groups.length === 0) return '___';
  if (groups.length === 1) return groups[0].text;

  let result = groups[0].text;
  for (let i = 1; i < groups.length; i++) {
    const prevConjunction = groups[i - 1].conjunction || 'and';
    result += `, ${prevConjunction} ${groups[i].text}`;
  }

  return result;
}

// ============================================
// ユーティリティ
// ============================================

/**
 * プレースホルダーを含む要素配列を生成
 * null/undefined は '___' としてレンダリングされる
 */
export function withPlaceholders<T>(
  items: (T | null | undefined)[],
  getGroupId: (item: T) => string,
  getConjunction: (index: number) => Conjunction | null
): CoordElement<T | null>[] {
  return items.map((item, index) => ({
    value: item ?? null,
    groupId: item ? getGroupId(item) : `__placeholder_${index}`,
    conjunction: index === 0 ? null : (getConjunction(index) || 'and'),
  }));
}

/**
 * レンダリング関数をプレースホルダー対応にラップ
 */
export function withPlaceholderRendering<T>(
  renderFn: (item: T) => string
): (item: T | null) => string {
  return (item: T | null) => item !== null ? renderFn(item) : '___';
}
