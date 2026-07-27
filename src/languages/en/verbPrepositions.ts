/**
 * 動詞が項に要求する前置詞（英語固有）
 *
 * ## なぜ言語パックに置くか
 *
 * 「どんな項を取るか」（結合価）は言語非依存だが、**それをどう標示するか**は
 * 言語ごとに違う。英語は前置詞、日本語は格助詞で標示する。
 * `belong to` の `to` に対応するものは日本語には無い（「属する」で完結する）。
 *
 * 以前は `ArgumentSlot.preposition` として言語非依存の `concepts/` 側にあったが、
 * 一度も設定されない死んだフィールドだった。
 *
 * ## 2種類ある
 *
 * | 種類 | 例 | 前置詞は | AST に出るか |
 * |---|---|---|---|
 * | `fixed` | belong **to** / wait **for** | 語彙的に固定。差し替え不可 | **出ない** |
 * | `choice` | live **in** / put **on** | 利用者が選ぶ。差し替えで意味が変わる | **出る** |
 *
 * この区別は判定できる。**前置詞を差し替えて別の意味の正しい文になるか**を見る。
 *
 * ```
 * It belongs to me.   → to 以外にならない        → fixed
 * I put it on/in/under the table.  → 全部成り立つ → choice
 * ```
 *
 * ## AST に出す / 出さない
 *
 * LinguaScript は**情報を担うものだけ**を持つ。
 *
 * - `fixed` の前置詞は選択の余地がなく情報量がゼロなので、AST に出さない
 *   （`eats` の `-s` を AST に出さないのと同じ）。動詞の綴りの一部として扱う
 * - `choice` の前置詞は差し替えで命題が変わるので、AST に出す必要がある
 *
 * ## 何も書かない動詞
 *
 * `leave the park` / `visit the park` のように前置詞を取らない動詞は表に書かない。
 * 役割名では決まらない（`goal` は visit=不要 / put=必須）ので、動詞ごとに持つ。
 */

import type { SemanticRole } from '../../types/schema';

export type PrepositionRule =
  /** 語彙的に固定。動詞と一体で1語として扱う */
  | { kind: 'fixed'; preposition: string }
  /** 利用者が選ぶ。未指定なら欠損として示す */
  | { kind: 'choice' };

const VERB_PREPOSITIONS: Record<string, Partial<Record<SemanticRole, PrepositionRule>>> = {
  // ---- fixed: 前置詞動詞（動詞+前置詞で1語）----
  go: { goal: { kind: 'fixed', preposition: 'to' } },
  come: { goal: { kind: 'fixed', preposition: 'to' } },
  arrive: { goal: { kind: 'fixed', preposition: 'at' } },
  belong: { recipient: { kind: 'fixed', preposition: 'to' } },
  wait: { theme: { kind: 'fixed', preposition: 'for' } },

  // ---- choice: 前置詞を利用者が選ぶ ----
  live: { location: { kind: 'choice' } },
  reside: { location: { kind: 'choice' } },
  stay: { location: { kind: 'choice' } },
  put: { goal: { kind: 'choice' } },
  place: { goal: { kind: 'choice' } },
  hang: { goal: { kind: 'choice' } },
};

/** 動詞×役割の前置詞規則を引く。前置詞を取らない項では undefined */
export function findPrepositionRule(
  verbLemma: string,
  role: SemanticRole
): PrepositionRule | undefined {
  return VERB_PREPOSITIONS[verbLemma]?.[role];
}

/**
 * 動詞の表示名（前置詞動詞は "belong to" のように前置詞込み）
 *
 * ブロックのラベルに使う。前置詞が固定の動詞は、前置詞とセットで
 * 覚えるのが正しい教え方なので、1つの語として見せる。
 */
export function displayVerbLemma(verbLemma: string): string {
  const rules = VERB_PREPOSITIONS[verbLemma];
  if (!rules) return verbLemma;

  for (const rule of Object.values(rules)) {
    if (rule?.kind === 'fixed') return `${verbLemma} ${rule.preposition}`;
  }
  return verbLemma;
}
