/**
 * レイヤーB のケース表（Blockly ブロック木 → AST）
 *
 * レイヤーA の `cases.ts` と同じく、ケースを表として持つ。
 * テスト本体（`astGenerator.test.ts`）と網羅性チェック（`coverage.test.ts`）の
 * 両方から読むため、テストファイルとは分けてある。
 */

import {
  buildWorkspace,
  pronoun,
  anObject,
  aPlace,
  timeFrame,
  type BlockSpec,
} from './workspace';

export interface WorkspaceCase {
  name: string;
  spec: BlockSpec;
  note?: string;
}

// 「I eat <object>」の動詞ブロック
export const eatVerb = (patient: BlockSpec = anObject('apple')): BlockSpec => ({
  type: 'verb_action',
  fields: { VERB: 'eat' },
  inputs: { ARG_0: pronoun('I'), ARG_1: patient },
});

export const runVerb = (): BlockSpec => ({
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
    name: 'ラッパー: preposition_verb（目的語なし）',
    note: '欠損時は ___ マーカーの名詞句が入る',
    spec: timeFrame('current', {
      type: 'preposition_verb',
      fields: { PREP_VALUE: 'to' },
      inputs: {
        VERB: { type: 'verb_motion', fields: { VERB: 'go' }, inputs: { ARG_0: pronoun('I') } },
      },
    }),
  },
  {
    name: 'ラッパー: manner（ラベル行は labelValidator が弾く）',
    note:
      'ラベル行（__ 始まり）を setFieldValue しても blocks/shared.ts の labelValidator が\n' +
      '変更を拒否するため、フィールドはデフォルト値（quickly）のまま。\n' +
      'ワークスペースのデシリアライズ経由でも同じく弾かれる（下の回帰テスト参照）。',
    spec: timeFrame('current', {
      type: 'manner_wrapper',
      fields: { MANNER_VALUE: '__label_common__' },
      inputs: { VERB: runVerb() },
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

export const coordination: WorkspaceCase[] = [
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

// ============================================
// ブロック網羅
//
// 自前のブロック49個のうち22個が、レイヤーBのテストで一度も生成されていなかった。
// VP 等位接続の項欠落（各項が目的語を持つケースが1件も無かった）と同じ穴なので、
// 全ブロックが最低1回は非自明な構成で astGenerator を通るようにする。
// ============================================

const det = (inner: BlockSpec): BlockSpec => ({
  type: 'determiner_unified',
  inputs: { NOUN: inner },
});
const beWith = (attr: BlockSpec): BlockSpec => ({
  type: 'verb_state',
  fields: { VERB: 'be' },
  inputs: { ARG_0: pronoun('I'), ARG_1: attr },
});
const teacher = (): BlockSpec => ({ type: 'human_block', fields: { HUMAN_VALUE: 'teacher' } });
const chip = (timeChip: BlockSpec, action: BlockSpec): BlockSpec => ({
  type: 'time_frame',
  inputs: { TIME_CHIP: timeChip, ACTION: action },
});

const blockCoverage: WorkspaceCase[] = [
  // --- 名詞ブロック ---
  {
    name: '名詞: human_block',
    spec: timeFrame('current', beWith(det(teacher()))),
  },
  {
    name: '名詞: animal_block',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'have' },
      inputs: { ARG_0: pronoun('I'), ARG_1: det({ type: 'animal_block', fields: { ANIMAL_VALUE: 'dog' } }) },
    }),
  },
  {
    name: '名詞: abstract_block（不可算 → 限定詞なし）',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'have' },
      inputs: { ARG_0: pronoun('I'), ARG_1: det({ type: 'abstract_block', fields: { ABSTRACT_VALUE: 'music' } }) },
    }),
  },
  {
    name: '名詞: possessive_pronoun_block',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'be' },
      inputs: { ARG_0: pronoun('it'), ARG_1: { type: 'possessive_pronoun_block', fields: { POSSESSIVE_VALUE: 'mine' } } },
    }),
  },

  // --- 形容詞ブロック（5カテゴリ × 級） ---
  {
    name: '形容詞: adjective_size（原級）',
    spec: timeFrame('current', beWith(det({
      type: 'adjective_size',
      fields: { ADJ_VALUE: 'big', GRADE: 'positive' },
      inputs: { NOUN: teacher() },
    }))),
  },
  {
    name: '形容詞: adjective_emotion（比較級）',
    spec: timeFrame('current', beWith(det({
      type: 'adjective_emotion',
      fields: { ADJ_VALUE: 'happy', GRADE: 'comparative' },
      inputs: { NOUN: teacher() },
    }))),
  },
  {
    name: '形容詞: adjective_quality（最上級 → DET が the に補正）',
    spec: timeFrame('current', beWith(det({
      type: 'adjective_quality',
      fields: { ADJ_VALUE: 'good', GRADE: 'superlative' },
      inputs: { NOUN: teacher() },
    }))),
  },
  {
    name: '形容詞: adjective_age',
    spec: timeFrame('current', beWith(det({
      type: 'adjective_age',
      fields: { ADJ_VALUE: 'old', GRADE: 'positive' },
      inputs: { NOUN: teacher() },
    }))),
    note: 'KNOWN ISSUE: 人に対する old は「古い」ではなく「年老いた」が適切。語彙の問題',
  },
  {
    name: '形容詞: adjective_physical',
    spec: timeFrame('current', eatVerb(det({
      type: 'adjective_physical',
      fields: { ADJ_VALUE: 'hard', GRADE: 'positive' },
      inputs: { NOUN: { type: 'object_block', fields: { OBJECT_VALUE: 'apple' } } },
    }))),
  },

  // --- 動詞カテゴリ ---
  {
    name: '動詞: verb_cognition',
    spec: timeFrame('current', {
      type: 'verb_cognition',
      fields: { VERB: 'think' },
      inputs: { ARG_0: pronoun('I') },
    }),
  },
  {
    name: '動詞: verb_communication',
    spec: timeFrame('current', {
      type: 'verb_communication',
      fields: { VERB: 'say' },
      inputs: { ARG_0: pronoun('I') },
    }),
  },
  {
    name: '動詞: verb_transfer（3項）',
    spec: timeFrame('current', {
      type: 'verb_transfer',
      fields: { VERB: 'give' },
      inputs: { ARG_0: pronoun('I'), ARG_1: anObject('apple'), ARG_2: pronoun('you') },
    }),
    note: 'valency は agent → theme → recipient の順。英語は "give you an apple" と語順が入れ替わる',
  },
  {
    name: '動詞: verb_state（location を取る）',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'live' },
      inputs: { ARG_0: pronoun('I'), ARG_1: aPlace('park') },
    }),
    note:
      'KNOWN BUG: 英語が location の項に前置詞を付けない（"I live a park."）。\n' +
      '日本語も location を一律「で」にしており、住む・居住する・滞在するは「に」が正しい。',
  },

  // --- TimeChip の3種 ---
  {
    name: 'TimeChip: aspectual（now）',
    spec: chip({ type: 'time_chip_aspectual', fields: { ASPECT_VALUE: 'now' } }, eatVerb()),
  },
  {
    name: 'TimeChip: concrete（yesterday）',
    spec: chip({ type: 'time_chip_concrete', fields: { TIME_VALUE: 'yesterday' } }, eatVerb()),
  },
  {
    name: 'TimeChip: unified（past + perfect）',
    spec: chip(
      { type: 'time_chip_unified', fields: { TENSE_VALUE: 'past', ASPECT_VALUE: 'perfect' } },
      eatVerb()
    ),
    note: 'KNOWN ISSUE: 日本語は過去完了と単純過去を区別せず、どちらも「食べた」になる',
  },

  // --- 等位接続・疑問・否定・前置詞 ---
  {
    name: '等位接続: coordination_noun_or',
    spec: timeFrame('current', eatVerb({
      type: 'coordination_noun_or',
      inputs: { LEFT: anObject('apple'), RIGHT: anObject('orange') },
    })),
  },
  {
    name: '疑問: choice_question_block',
    spec: timeFrame('current', {
      type: 'verb_action',
      fields: { VERB: 'drink' },
      inputs: {
        ARG_0: pronoun('you'),
        ARG_1: {
          type: 'choice_question_block',
          inputs: {
            LEFT: { type: 'object_block', fields: { OBJECT_VALUE: 'water' } },
            RIGHT: { type: 'object_block', fields: { OBJECT_VALUE: 'milk' } },
          },
        },
      },
    }),
  },
  {
    name: '疑問: wh_placeholder_block（主語）',
    spec: timeFrame('current', {
      type: 'verb_action',
      fields: { VERB: 'eat' },
      inputs: { ARG_0: { type: 'wh_placeholder_block', fields: { WH_VALUE: '?who' } } },
    }),
  },
  {
    name: '疑問: wh_adverb_block',
    spec: timeFrame('current', {
      type: 'wh_adverb_block',
      fields: { WH_ADVERB_VALUE: '?where' },
      inputs: {
        VERB: { type: 'verb_action', fields: { VERB: 'eat' }, inputs: { ARG_0: pronoun('you') } },
      },
    }),
  },
  {
    name: '文ラッパー: negation_sentence_wrapper（モダリティの否定）',
    spec: {
      type: 'negation_sentence_wrapper',
      inputs: {
        MODAL: {
          type: 'modal_wrapper',
          fields: { MODAL_VALUE: 'ability' },
          inputs: { SENTENCE: timeFrame('current', eatVerb()) },
        },
      },
    },
  },
  {
    name: '名詞修飾: preposition_noun',
    spec: timeFrame('current', beWith({
      type: 'preposition_noun',
      fields: { PREP_VALUE: 'in' },
      inputs: {
        NOUN: det(teacher()),
        OBJECT: { type: 'place_block', fields: { PLACE_VALUE: 'park' } },
      },
    })),
  },
];

// ============================================
// 前置詞動詞
//
// 「動詞+前置詞」が1語として意味を持つもの（belong to / wait for）と、
// 前置詞を利用者が選ぶもの（live in / put on）を区別する。
// ============================================

const prepositionalVerbs: WorkspaceCase[] = [
  {
    name: '前置詞動詞: go to（固定）',
    spec: timeFrame('current', {
      type: 'verb_motion',
      fields: { VERB: 'go' },
      inputs: { ARG_0: pronoun('I'), ARG_1: aPlace('school') },
    }),
    note:
      '前置詞 to は語彙的に固定で選択の余地がないため、AST には出さない。\n' +
      'LinguaScript は go(agent, goal) となり、to は英語の綴りの一部として扱う。',
  },
  {
    name: '前置詞動詞: arrive at（固定）',
    spec: timeFrame('current', {
      type: 'verb_motion',
      fields: { VERB: 'arrive' },
      inputs: { ARG_0: pronoun('I'), ARG_1: aPlace('park') },
    }),
  },
  {
    name: '前置詞動詞: wait for（固定）',
    spec: timeFrame('current', {
      type: 'verb_action',
      fields: { VERB: 'wait' },
      inputs: { ARG_0: pronoun('I'), ARG_1: pronoun('you') },
    }),
  },
  {
    name: '前置詞動詞: belong to（固定）',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'belong' },
      inputs: { ARG_0: pronoun('it'), ARG_1: pronoun('me') },
    }),
  },
  {
    name: '前置詞動詞: go（項なし → 前置詞も出ない）',
    spec: timeFrame('current', {
      type: 'verb_motion',
      fields: { VERB: 'go' },
      inputs: { ARG_0: pronoun('I') },
    }),
  },
  {
    name: '前置詞なし: leave（他動詞）',
    spec: timeFrame('current', {
      type: 'verb_motion',
      fields: { VERB: 'leave' },
      inputs: { ARG_0: pronoun('I'), ARG_1: aPlace('park') },
    }),
    note: 'source を取るが前置詞は要らない。役割名では決まらないので動詞ごとに持つ',
  },
  {
    name: '前置詞が選択: live（欠けを ___ で示す）',
    spec: timeFrame('current', {
      type: 'verb_state',
      fields: { VERB: 'live' },
      inputs: { ARG_0: pronoun('I'), ARG_1: aPlace('park') },
    }),
    note:
      'in / at / on で意味が変わるので利用者が選ぶ。勝手に補うと WYSIWYG が崩れるため、\n' +
      '限定詞欠損と同じ ___ で欠けを示す。日本語は「に」を取る（「で」は動作の場所）。',
  },
  {
    name: '前置詞が選択: put（欠けを ___ で示す）',
    spec: timeFrame('current', {
      type: 'verb_action',
      fields: { VERB: 'put' },
      inputs: { ARG_0: pronoun('I'), ARG_1: anObject('apple'), ARG_2: aPlace('park') },
    }),
    note: 'on / in / under で意味が変わる。前置詞句スロットにするのは今後の課題',
  },
];

export const allGroups: { group: string; cases: WorkspaceCase[] }[] = [
  { group: 'astGen/基本', cases: basics },
  { group: 'astGen/動詞ラッパー', cases: verbWrappers },
  { group: 'astGen/等位接続', cases: coordination },
  { group: 'astGen/文ラッパー', cases: sentenceWrappers },
  { group: 'astGen/Logic', cases: logic },
  { group: 'astGen/限定詞', cases: determiners },
  { group: 'astGen/ブロック網羅', cases: blockCoverage },
  { group: 'astGen/前置詞動詞', cases: prepositionalVerbs },
];

/**
 * ケース表を実際に組んで、生成されたブロック型を集める
 *
 * `coverage.test.ts` のブロック網羅チェックが使う。
 */
export async function collectUsedBlockTypes(): Promise<Set<string>> {
  const used = new Set<string>();
  for (const { spec } of allGroups.flatMap(g => g.cases)) {
    const ws = await buildWorkspace(spec);
    try {
      ws.getAllBlocks(false).forEach(b => used.add(b.type));
    } finally {
      ws.dispose();
    }
  }
  return used;
}
