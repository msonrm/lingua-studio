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
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import {
  buildWorkspace,
  pronoun,
  anObject,
  aPlace,
  timeFrame,
  type BlockSpec,
} from './workspace';

interface WorkspaceCase {
  name: string;
  spec: BlockSpec;
  note?: string;
}

// 「I eat <object>」の動詞ブロック
const eatVerb = (patient: BlockSpec = anObject('apple')): BlockSpec => ({
  type: 'verb_action',
  fields: { VERB: 'eat' },
  inputs: { ARG_0: pronoun('I'), ARG_1: patient },
});

const runVerb = (): BlockSpec => ({
  type: 'verb_motion',
  fields: { VERB: 'run' },
  inputs: { ARG_0: pronoun('I') },
});

// ============================================
// ケース表
// ============================================

const basics: WorkspaceCase[] = [
  { name: '基本: I eat an apple', spec: timeFrame('current', eatVerb()) },
  { name: '基本: 自動詞', spec: timeFrame('current', runVerb()) },
  { name: 'TimeChip: past', spec: timeFrame('past', eatVerb()) },
  { name: 'TimeChip: future', spec: timeFrame('future', eatVerb()) },
  { name: 'TimeChip: progressive', spec: timeFrame('progressive', eatVerb()) },
  { name: 'TimeChip: perfect', spec: timeFrame('perfect', eatVerb()) },
  { name: 'TimeChip: perfectProgressive', spec: timeFrame('perfectProgressive', eatVerb()) },
];

// parseVerbChain のラッパー分岐（Phase 2 の主対象）
const verbWrappers: WorkspaceCase[] = [
  {
    name: 'ラッパー: negation',
    spec: timeFrame('current', { type: 'negation_wrapper', inputs: { VERB: eatVerb() } }),
  },
  {
    name: 'ラッパー: frequency',
    spec: timeFrame('current', {
      type: 'frequency_wrapper',
      fields: { FREQ_VALUE: 'often' },
      inputs: { VERB: runVerb() },
    }),
  },
  {
    name: 'ラッパー: manner',
    spec: timeFrame('current', {
      type: 'manner_wrapper',
      fields: { MANNER_VALUE: 'quickly' },
      inputs: { VERB: runVerb() },
    }),
  },
  {
    name: 'ラッパー: locative',
    spec: timeFrame('current', {
      type: 'locative_wrapper',
      fields: { LOCATIVE_VALUE: 'here' },
      inputs: { VERB: runVerb() },
    }),
  },
  {
    name: 'ラッパー: time_adverb',
    spec: timeFrame('current', {
      type: 'time_adverb_wrapper',
      fields: { TIME_ADVERB_VALUE: 'today' },
      inputs: { VERB: runVerb() },
    }),
  },
  {
    name: 'ラッパー: preposition_verb',
    spec: timeFrame('current', {
      type: 'preposition_verb',
      fields: { PREP_VALUE: 'to' },
      inputs: {
        VERB: { type: 'verb_motion', fields: { VERB: 'go' }, inputs: { ARG_0: pronoun('I') } },
        OBJECT: aPlace('park'),
      },
    }),
  },
  {
    name: 'ラッパー: 多重（negation + frequency）',
    spec: timeFrame('current', {
      type: 'negation_wrapper',
      inputs: {
        VERB: {
          type: 'frequency_wrapper',
          fields: { FREQ_VALUE: 'often' },
          inputs: { VERB: runVerb() },
        },
      },
    }),
  },
];

const coordination: WorkspaceCase[] = [
  {
    name: '等位接続: VP and',
    spec: timeFrame('current', {
      type: 'coordination_verb_and',
      inputs: {
        LEFT: { type: 'verb_action', fields: { VERB: 'eat' }, inputs: { ARG_0: pronoun('I') } },
        RIGHT: { type: 'verb_action', fields: { VERB: 'drink' }, inputs: { ARG_0: pronoun('I') } },
      },
    }),
  },
  {
    name: '等位接続: VP or',
    spec: timeFrame('current', {
      type: 'coordination_verb_or',
      inputs: {
        LEFT: { type: 'verb_action', fields: { VERB: 'eat' }, inputs: { ARG_0: pronoun('I') } },
        RIGHT: { type: 'verb_action', fields: { VERB: 'drink' }, inputs: { ARG_0: pronoun('I') } },
      },
    }),
  },
  {
    name: '等位接続: VP 入れ子 or(and(A, B), C)',
    note:
      '内側の等位接続が失われないことの回帰テスト。\n' +
      'AST は eat ─and→ drink ─or→ run の鎖になる（appendCoordination）。\n' +
      '英語は coordination.ts の設計どおり correlative で構造を明示し\n' +
      '"Both I eat and drink, or run." になる。',
    spec: timeFrame('current', {
      type: 'coordination_verb_or',
      inputs: {
        LEFT: {
          type: 'coordination_verb_and',
          inputs: {
            LEFT: {
              type: 'verb_action',
              fields: { VERB: 'eat' },
              inputs: { ARG_0: pronoun('I') },
            },
            RIGHT: {
              type: 'verb_action',
              fields: { VERB: 'drink' },
              inputs: { ARG_0: pronoun('I') },
            },
          },
        },
        RIGHT: { type: 'verb_motion', fields: { VERB: 'run' }, inputs: { ARG_0: pronoun('I') } },
      },
    }),
  },
  {
    name: '等位接続: VP + 個別の否定',
    spec: timeFrame('current', {
      type: 'coordination_verb_and',
      inputs: {
        LEFT: {
          type: 'negation_wrapper',
          inputs: {
            VERB: {
              type: 'verb_action',
              fields: { VERB: 'eat' },
              inputs: { ARG_0: pronoun('I') },
            },
          },
        },
        RIGHT: { type: 'verb_action', fields: { VERB: 'drink' }, inputs: { ARG_0: pronoun('I') } },
      },
    }),
  },
  {
    name: '等位接続: NP and',
    spec: timeFrame('current', {
      type: 'verb_action',
      fields: { VERB: 'eat' },
      inputs: {
        ARG_0: {
          type: 'coordination_noun_and',
          inputs: { LEFT: pronoun('I'), RIGHT: pronoun('he') },
        },
        ARG_1: anObject('apple'),
      },
    }),
  },
];

const sentenceWrappers: WorkspaceCase[] = [
  {
    name: '文ラッパー: question',
    spec: { type: 'question_wrapper', inputs: { SENTENCE: timeFrame('current', eatVerb()) } },
  },
  {
    name: '文ラッパー: imperative',
    spec: {
      type: 'imperative_wrapper',
      inputs: {
        SENTENCE: timeFrame('current', {
          type: 'verb_action',
          fields: { VERB: 'eat' },
          inputs: { ARG_1: anObject('apple') },
        }),
      },
    },
  },
  {
    name: '文ラッパー: modal（ability）',
    spec: {
      type: 'modal_wrapper',
      fields: { MODAL_VALUE: 'ability' },
      inputs: { SENTENCE: timeFrame('current', eatVerb()) },
    },
  },
  {
    name: '文ラッパー: modal（obligation）',
    spec: {
      type: 'modal_wrapper',
      fields: { MODAL_VALUE: 'obligation' },
      inputs: { SENTENCE: timeFrame('current', eatVerb()) },
    },
  },
  {
    name: '文ラッパー: fact（timeless fact）',
    note: 'fact_wrapper の入力は PROPOSITION で、time_frame ではなく verb chain を直接取る',
    spec: { type: 'fact_wrapper', inputs: { PROPOSITION: eatVerb() } },
  },
];

// 命題論理は fact_wrapper の PROPOSITION 直下に置く（logic ブロックは time_frame に接続できない）
const eatI = (): BlockSpec => ({
  type: 'verb_action',
  fields: { VERB: 'eat' },
  inputs: { ARG_0: pronoun('I') },
});
const drinkI = (): BlockSpec => ({
  type: 'verb_action',
  fields: { VERB: 'drink' },
  inputs: { ARG_0: pronoun('I') },
});

const logic: WorkspaceCase[] = [
  {
    name: 'Logic: AND',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: {
          type: 'logic_and_block',
          inputs: { LEFT: eatI(), RIGHT: drinkI() },
        },
      },
    },
  },
  {
    name: 'Logic: OR',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: {
          type: 'logic_or_block',
          inputs: { LEFT: eatI(), RIGHT: drinkI() },
        },
      },
    },
  },
  {
    name: 'Logic: NOT',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: { type: 'logic_not_block', inputs: { PROPOSITION: eatI() } },
      },
    },
  },
  {
    name: 'Logic: IF',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: {
          type: 'logic_if_block',
          inputs: { CONDITION: eatI(), CONSEQUENCE: drinkI() },
        },
      },
    },
  },
  {
    name: 'Logic: BECAUSE',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: {
          type: 'logic_because_block',
          inputs: { CAUSE: eatI(), EFFECT: drinkI() },
        },
      },
    },
  },
  {
    name: 'Logic: 入れ子 AND(NOT(P), Q)',
    spec: {
      type: 'fact_wrapper',
      inputs: {
        PROPOSITION: {
          type: 'logic_and_block',
          inputs: {
            LEFT: { type: 'logic_not_block', inputs: { PROPOSITION: eatI() } },
            RIGHT: drinkI(),
          },
        },
      },
    },
  },
];

// determiner_unified の自動補正（onchange 依存 → イベントフラッシュが必要）
const determiners: WorkspaceCase[] = [
  {
    name: '限定詞: 可算名詞に a が自動設定される',
    spec: timeFrame('current', eatVerb(anObject('apple'))),
  },
  {
    name: '限定詞: 形容詞を挟んでも名詞を辿れる',
    note: 'CHANGELOG 2026-02-01「DET → adjective → noun」の回帰テスト',
    spec: timeFrame(
      'current',
      eatVerb({
        type: 'determiner_unified',
        inputs: {
          NOUN: {
            type: 'adjective_color',
            fields: { ADJ_VALUE: 'red' },
            inputs: { NOUN: { type: 'object_block', fields: { OBJECT_VALUE: 'apple' } } },
          },
        },
      })
    ),
  },
];

const allGroups: { group: string; cases: WorkspaceCase[] }[] = [
  { group: 'astGen/基本', cases: basics },
  { group: 'astGen/動詞ラッパー', cases: verbWrappers },
  { group: 'astGen/等位接続', cases: coordination },
  { group: 'astGen/文ラッパー', cases: sentenceWrappers },
  { group: 'astGen/Logic', cases: logic },
  { group: 'astGen/限定詞', cases: determiners },
];

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

  it('入れ子の等位接続で項が失われない（回帰テスト）', async () => {
    // or(and(eat, drink), run) → eat ─and→ drink ─or→ run の鎖になること。
    // 以前は内側の coordinatedWith が外側の coordination に上書きされ drink が消えていた。
    const nested = coordination.find(c => c.name.includes('入れ子'))!;
    const ws = await buildWorkspace(nested.spec);
    try {
      const [ast] = generateMultipleAST(ws);

      // 鎖を辿って動詞と接続詞を集める
      const verbs: string[] = [];
      const conjunctions: string[] = [];
      let vp: typeof ast.clause.verbPhrase | undefined = ast.clause.verbPhrase;
      while (vp) {
        verbs.push(vp.verb.lemma);
        if (vp.coordinatedWith) conjunctions.push(vp.coordinatedWith.conjunction);
        vp = vp.coordinatedWith?.verbPhrase;
      }

      expect(verbs).toEqual(['eat', 'drink', 'run']);
      expect(conjunctions).toEqual(['and', 'or']);
    } finally {
      ws.dispose();
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
