/**
 * ゴールデンテストの網羅性を機械的に確認する
 *
 * ## なぜ要るか
 *
 * これまで見つかった不具合の多くは「テストが無い」ではなく
 * **「痩せた形でしかテストされていない」**ことが原因だった。
 *
 * - VP 等位接続の項が消える → ケースが全部 `I eat and drink.`（目的語なし）だった
 * - 限定詞なしの可算名詞 → 等位接続のケースが元から非文だった
 *
 * どちらもスナップショットは1件も変わらず、差分レビューでは気づけない。
 * そこで「何が無いか」を出力ではなく**構造から**見る。
 *
 * ## 2つの網羅
 *
 * | | 対象 | 落ちる条件 |
 * |---|---|---|
 * | ブロック網羅 | 自前のブロック定義 | 一度も astGenerator を通らないブロックがある |
 * | 文脈網羅 | AST の入れ子 | 同じノード型が、ある文脈でだけ痩せている |
 *
 * ## 増やすときは
 *
 * ブロックを足したら `astGenerator.test.ts` の `blockCoverage` に1件足す。
 * 意図的に対象外にするなら `EXCLUDED_BLOCKS` に理由付きで書く。
 */

import { describe, it, expect } from 'vitest';
import * as Blockly from 'blockly';
import { allCases } from './cases';
import { collectUsedBlockTypes } from './astGenerator.cases';

// ============================================
// ブロック網羅
// ============================================

/**
 * 網羅の対象外にするブロック
 *
 * astGenerator を通らない（UI だけで完結する / 他ブロックの内部で使われる）ものを書く。
 */
const EXCLUDED_BLOCKS: Record<string, string> = {};

/**
 * Blockly 組み込みブロックの接頭辞
 *
 * `import 'blockly'` が `blockly/blocks` を巻き込むため、`Blockly.Blocks` には
 * 自前の定義と組み込みが混ざる。登録前後の差分では区別できない
 * （`./astGenerator.cases` の静的 import が先に `../blocks` を読み込むため、
 * このファイルが動く時点で既に登録済み）ので、名前で分ける。
 *
 * 組み込みが増えたら過検出して落ちる。黙って見逃すより安全な方向。
 */
const BUILTIN_PREFIXES = [
  'controls_',
  'logic_',
  'math_',
  'text',
  'lists_',
  'variables_',
  'procedures_',
];

/** 自前のブロック定義（Blockly 組み込みを除く） */
function ownBlockTypes(): string[] {
  return Object.keys(Blockly.Blocks)
    .filter(t => !BUILTIN_PREFIXES.some(p => t.startsWith(p)))
    .sort();
}

describe('ブロック網羅', () => {
  it('自前のブロックを組み込みと区別できている', () => {
    // 名前で分けているので、想定数から大きくずれたら分類が壊れている
    const own = ownBlockTypes();
    expect(own.length).toBeGreaterThan(40);
    expect(own).not.toContain('math_number');
    expect(own).toContain('determiner_unified');
  });

  it('すべてのブロックが astGenerator を通る', async () => {
    const own = ownBlockTypes();

    // ケース表のブロック木を実際に組んで、生成されたブロック型を集める
    const used = await collectUsedBlockTypes();

    const missing = own
      .filter(t => !used.has(t))
      .filter(t => !(t in EXCLUDED_BLOCKS))
      // 拡張ブロック（*_ext）はユーザー辞書に語がある時だけ登録されるので別テストで見る
      .filter(t => !t.endsWith('_ext'));

    expect(missing, '一度も生成されていないブロック').toEqual([]);
  });
});

// ============================================
// 文脈網羅
// ============================================

/**
 * ノードが持つ任意要素を列挙する
 *
 * 「値が何か」ではなく「その要素を持っているか」だけを見る。
 * 配列は空かどうか、引数は filler が埋まっている数を見る。
 */
function featuresOf(node: Record<string, unknown>): string[] {
  const found: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type' || value == null) continue;

    if (Array.isArray(value)) {
      if (value.length > 0) found.push(`${key}[]`);
      if (key === 'arguments') {
        const filled = value.filter(a => (a as { filler?: unknown }).filler != null).length;
        if (filled >= 2) found.push('arguments:filled2+');
      }
      continue;
    }
    if (typeof value === 'object') {
      found.push(key);
      continue;
    }
    if (value === false) continue;
    found.push(`${key}=${String(value)}`);
  }
  return found;
}

/** 文脈は「親ノード型.フィールド名」で表す */
type Context = string;

interface Walked {
  /** ノード型 → その型が全体で持ちえた要素 */
  overall: Map<string, Set<string>>;
  /** 文脈 → ノード型 → その文脈で持てた要素 */
  perContext: Map<Context, Map<string, Set<string>>>;
  /** ノード型 → 出現した文脈 */
  contexts: Map<string, Set<Context>>;
}

function walkAll(): Walked {
  const overall = new Map<string, Set<string>>();
  const perContext = new Map<Context, Map<string, Set<string>>>();
  const contexts = new Map<string, Set<Context>>();

  const add = (map: Map<string, Set<string>>, key: string, values: string[]) => {
    if (!map.has(key)) map.set(key, new Set());
    values.forEach(v => map.get(key)!.add(v));
  };

  const walk = (node: unknown, context: Context): void => {
    if (Array.isArray(node)) {
      node.forEach(n => walk(n, context));
      return;
    }
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    const nodeType = typeof obj.type === 'string' ? obj.type : null;

    if (nodeType) {
      const features = featuresOf(obj);
      add(overall, nodeType, features);
      if (!perContext.has(context)) perContext.set(context, new Map());
      add(perContext.get(context)!, nodeType, features);
      add(contexts as Map<string, Set<string>>, nodeType, [context]);
    }

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'type') continue;
      walk(value, `${nodeType ?? '?'}.${key}`);
    }
  };

  for (const group of allCases) {
    for (const testCase of group.cases) walk(testCase.ast, 'root');
  }
  return { overall, perContext, contexts };
}

/**
 * 見逃してよい痩せ方
 *
 * 文法上その文脈では起こりえない組み合わせ。「テストが無い」ではなく
 * 「そもそも作れない」ものをここに書く。
 */
const ALLOWED_THIN: { context: string; nodeType: string; feature: string }[] = [
  // 論理演算のオペランドは命題そのもの。オペランド自身が更に logicOp を持つ入れ子は
  // leftOperand 側だけで表現され、rightOperand には現れない
  { context: '?.rightOperand', nodeType: 'verbPhrase', feature: 'logicOp' },
  // 等位接続の項に logicOp は付かない（節レベルの命題演算と排他）
  { context: 'coordinatedVerbPhrase.conjuncts', nodeType: 'verbPhrase', feature: 'logicOp' },
];

describe('文脈網羅', () => {
  it('同じノード型がある文脈でだけ痩せていない', () => {
    const { overall, perContext, contexts } = walkAll();

    const thin: string[] = [];
    for (const [nodeType, allFeatures] of overall) {
      for (const context of contexts.get(nodeType) ?? []) {
        const here = perContext.get(context)?.get(nodeType) ?? new Set<string>();
        for (const feature of allFeatures) {
          if (here.has(feature)) continue;
          const allowed = ALLOWED_THIN.some(
            a => a.context === context && a.nodeType === nodeType && a.feature === feature
          );
          if (!allowed) thin.push(`${context} → ${nodeType}: ${feature}`);
        }
      }
    }

    // 完全な網羅は現実的でないので、既知の残りを固定して増加だけを止める。
    // 減らしたらこの数字を下げること
    expect(
      thin.length,
      `未カバーの「文脈 × 要素」が ${KNOWN_THIN_COUNT} 件から増えた:\n${thin.sort().join('\n')}`
    ).toBeLessThanOrEqual(KNOWN_THIN_COUNT);
  });
});

/**
 * 未カバーの「文脈 × 要素」の残数
 *
 * 0 を目指す性質のものではない。残っているのはほとんどが限定詞の値の組み合わせで
 * （`determiner=no` を前置詞句の目的語にも等位接続の項にも入れる、など）、
 * 潰しても得るものが少ない割に表が膨らむ。**増やさないこと**が目的。
 */
const KNOWN_THIN_COUNT = 23;
