/**
 * 前置詞のデータとドロップダウン選択肢
 *
 * 動詞修飾（preposition_verb）と名詞修飾（preposition_noun）の両方が使う。
 */

import { msg } from './shared';

// ============================================
// 前置詞データ定義
// ============================================
const PREPOSITIONS = {
  // 場所
  location: [
    { label: 'in', value: 'in' },
    { label: 'on', value: 'on' },
    { label: 'at', value: 'at' },
    { label: 'under', value: 'under' },
    { label: 'behind', value: 'behind' },
  ],
  // 方向・起点
  direction: [
    { label: 'to', value: 'to' },
    { label: 'from', value: 'from' },
    { label: 'into', value: 'into' },
  ],
  // 関係
  relation: [
    { label: 'with', value: 'with' },
    { label: 'of', value: 'of' },
    { label: 'for', value: 'for' },
    { label: 'about', value: 'about' },
  ],
};

export const getPrepositionOptions = (): [string, string][] => [
  [msg('GROUP_LOCATION', '── Location ──'), '__label_location__'],
  ...PREPOSITIONS.location.map(p => [p.label, p.value] as [string, string]),
  [msg('GROUP_DIRECTION', '── Direction ──'), '__label_direction__'],
  ...PREPOSITIONS.direction.map(p => [p.label, p.value] as [string, string]),
  [msg('GROUP_RELATION', '── Relation ──'), '__label_relation__'],
  ...PREPOSITIONS.relation.map(p => [p.label, p.value] as [string, string]),
];