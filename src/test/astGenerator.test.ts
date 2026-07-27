/**
 * レイヤーB: astGenerator のゴールデンテスト
 *
 * Blockly ブロック木 → AST をスナップショットで固定する。
 * Phase 2 で `parseVerbChain`（426行）をテーブル駆動に分割する際の安全網。
 *
 * ヘッドレス Blockly（`new Blockly.Workspace()`）が Node 環境で動くため、
 * ブロック定義の onchange（限定詞の自動補正など）も含めて検証できる。
 */

import { describe, it, expect } from 'vitest';
import { generateMultipleAST } from '../renderer/astGenerator';
import { isCoordinatedVerbPhrase, type VerbPhraseConjunct } from '../types/schema';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { buildWorkspace, pronoun, timeFrame, type BlockSpec } from './workspace';

import { allGroups, coordination, eatVerb, runVerb } from './astGenerator.cases';


// ============================================
// テスト
// ============================================

describe.each(allGroups)('$group', ({ cases }) => {
  it.each(cases)('$name', async ({ spec }) => {
    const ws = await buildWorkspace(spec);
    try {
      const asts = generateMultipleAST(ws);
      expect(asts).toHaveLength(1);
      expect({
        ast: asts[0],
        en: renderToEnglishWithLogs(asts[0]).output,
      }).toMatchSnapshot();
    } finally {
      ws.dispose();
    }
  });
});

describe('astGenerator の不変条件', () => {
  const flat = allGroups.flatMap(g => g.cases);

  it.each(flat)('$name: AST を1件生成する', async ({ spec }) => {
    const ws = await buildWorkspace(spec);
    try {
      expect(generateMultipleAST(ws)).toHaveLength(1);
    } finally {
      ws.dispose();
    }
  });

  it('空のワークスペースは AST を生成しない', async () => {
    const ws = await buildWorkspace();
    try {
      expect(generateMultipleAST(ws)).toHaveLength(0);
    } finally {
      ws.dispose();
    }
  });

  it('複数の文を並べると AST も複数生成される', async () => {
    const ws = await buildWorkspace(
      timeFrame('current', eatVerb()),
      timeFrame('past', runVerb())
    );
    try {
      expect(generateMultipleAST(ws)).toHaveLength(2);
    } finally {
      ws.dispose();
    }
  });

  /** 等位接続ツリーを `or(and(A, B), C)` のような文字列にする */
  function describeCoordination(node: VerbPhraseConjunct): string {
    if (!isCoordinatedVerbPhrase(node)) return node.verb.lemma;
    return `${node.conjunction}(${node.conjuncts.map(describeCoordination).join(', ')})`;
  }

  it('入れ子の等位接続で項が失われない（回帰テスト）', async () => {
    const nested = coordination.find(c => c.name.includes('入れ子'))!;
    const ws = await buildWorkspace(nested.spec);
    try {
      const [ast] = generateMultipleAST(ws);
      expect(describeCoordination(ast.clause.verbPhrase)).toBe('or(and(eat, drink), run)');
    } finally {
      ws.dispose();
    }
  });

  it('左入れ子と右入れ子を区別できる（回帰テスト）', async () => {
    // 連結リスト表現では両方が eat ─and→ drink ─or→ build に潰れ、
    // 意味の違う2文が同じ AST・同じ LinguaScript になっていた。
    const v = (lemma: string): BlockSpec => ({
      type: 'verb_action',
      fields: { VERB: lemma },
      inputs: { ARG_0: pronoun('I') },
    });
    const coord = (kind: 'and' | 'or', left: BlockSpec, right: BlockSpec): BlockSpec => ({
      type: `coordination_verb_${kind}`,
      inputs: { LEFT: left, RIGHT: right },
    });

    const leftNested = await buildWorkspace(
      timeFrame('current', coord('or', coord('and', v('eat'), v('drink')), v('build')))
    );
    const rightNested = await buildWorkspace(
      timeFrame('current', coord('and', v('eat'), coord('or', v('drink'), v('build'))))
    );

    try {
      const [leftAst] = generateMultipleAST(leftNested);
      const [rightAst] = generateMultipleAST(rightNested);

      expect(describeCoordination(leftAst.clause.verbPhrase)).toBe('or(and(eat, drink), build)');
      expect(describeCoordination(rightAst.clause.verbPhrase)).toBe('and(eat, or(drink, build))');

      // 英語は correlative（both / either）で範囲を書き分ける
      expect(renderToEnglishWithLogs(leftAst).output).not.toBe(
        renderToEnglishWithLogs(rightAst).output
      );
    } finally {
      leftNested.dispose();
      rightNested.dispose();
    }
  });

  it('同じ接続詞が続く場合は1つのグループに畳まれる', async () => {
    const v = (lemma: string): BlockSpec => ({
      type: 'verb_action',
      fields: { VERB: lemma },
      inputs: { ARG_0: pronoun('I') },
    });
    const ws = await buildWorkspace(
      timeFrame('current', {
        type: 'coordination_verb_and',
        inputs: {
          LEFT: {
            type: 'coordination_verb_and',
            inputs: { LEFT: v('eat'), RIGHT: v('drink') },
          },
          RIGHT: v('build'),
        },
      })
    );
    try {
      const [ast] = generateMultipleAST(ws);
      // and(and(A, B), C) は and(A, B, C) に畳まれる
      expect(describeCoordination(ast.clause.verbPhrase)).toBe('and(eat, drink, build)');
    } finally {
      ws.dispose();
    }
  });

  it('ラベル行はデシリアライズ経由でも弾かれる（回帰テスト）', async () => {
    // parseAdverbWrapper にラベル行の分岐を持たせない根拠。
    // labelValidator が setFieldValue とワークスペース復元の両方を守っている。
    const { serialization, Workspace } = await import('blockly');
    const ws = await buildWorkspace(
      timeFrame('current', {
        type: 'manner_wrapper',
        fields: { MANNER_VALUE: 'quickly' },
        inputs: { VERB: runVerb() },
      })
    );
    const state = serialization.workspaces.save(ws);
    ws.dispose();

    // JSON を直接書き換えてラベル行を仕込む（バリデータを経由しない経路）
    const tampered = JSON.parse(
      JSON.stringify(state).replace('"MANNER_VALUE":"quickly"', '"MANNER_VALUE":"__label_common__"')
    );
    const restored = new Workspace();
    serialization.workspaces.load(tampered, restored);
    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      const block = restored.getBlocksByType('manner_wrapper', false)[0];
      expect(block.getFieldValue('MANNER_VALUE')).toBe('quickly');
      expect(renderToEnglishWithLogs(generateMultipleAST(restored)[0]).output).toBe('I run quickly.');
    } finally {
      restored.dispose();
    }
  });

  it('シリアライズ往復で AST が変わらない', async () => {
    const { serialization, Workspace } = await import('blockly');
    const ws = await buildWorkspace(timeFrame('current', eatVerb()));
    const state = serialization.workspaces.save(ws);

    const restored = new Workspace();
    serialization.workspaces.load(state, restored);

    try {
      expect(generateMultipleAST(restored)).toEqual(generateMultipleAST(ws));
    } finally {
      ws.dispose();
      restored.dispose();
    }
  });
});
