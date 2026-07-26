/**
 * 初回起動時（保存状態がないとき）にワークスペースへ置くブロック。
 *
 * 生成される文: "I eat an apple."
 *   sentence(present+simple(eat(agent:'I, patient:noun(det:'a, head:'apple))))
 *
 * 限定詞 `a` は明示的に設定しない。`determiner_unified` に名詞を繋いだ時点で
 * ブロック側の onchange が可算名詞を検出して自動補正する。
 */

import * as Blockly from 'blockly';

/** ブロック木の宣言的な指定 */
export interface InitialBlockSpec {
  type: string;
  fields?: Record<string, string>;
  /** 入力名 → 子ブロック。value / statement は接続の種類から自動判別する */
  inputs?: Record<string, InitialBlockSpec>;
}

/**
 * 配置するブロック木。
 *
 * 実際の配置（`placeInitialBlocks`）は SVG ワークスペースを要するためテストできないが、
 * この仕様自体はヘッドレスで組み立てて検証できる（`initialWorkspace.test.ts`）。
 */
export const INITIAL_BLOCKS: InitialBlockSpec = {
  type: 'time_frame',
  inputs: {
    TIME_CHIP: {
      type: 'time_chip_abstract',
      fields: { MODIFIER_VALUE: 'current' },
    },
    ACTION: {
      type: 'verb_action',
      fields: { VERB: 'eat' },
      inputs: {
        ARG_0: {
          type: 'pronoun_block',
          fields: { PRONOUN_VALUE: 'I' },
        },
        ARG_1: {
          type: 'determiner_unified',
          inputs: {
            NOUN: {
              type: 'object_block',
              fields: { OBJECT_VALUE: 'apple' },
            },
          },
        },
      },
    },
  },
};

/** BlockSpec からブロックを生成して描画する（SVG ワークスペース用） */
function createBlock(
  workspace: Blockly.WorkspaceSvg,
  spec: InitialBlockSpec
): Blockly.BlockSvg {
  const block = workspace.newBlock(spec.type) as Blockly.BlockSvg;

  for (const [name, value] of Object.entries(spec.fields ?? {})) {
    block.setFieldValue(value, name);
  }

  block.initSvg();
  block.render();

  // 子を先に完成させてから親へ繋ぐ。
  // determiner_unified は名詞が繋がった時点の onchange で限定詞を自動補正するため、
  // この順序（名詞 → DET、そのあと DET → 引数スロット）を保つ必要がある。
  for (const [inputName, childSpec] of Object.entries(spec.inputs ?? {})) {
    const child = createBlock(workspace, childSpec);
    const connection = block.getInput(inputName)?.connection;
    // value 入力なら出力側、statement 入力なら previous 側を繋ぐ
    const childConnection = child.outputConnection ?? child.previousConnection;
    if (connection && childConnection) {
      connection.connect(childConnection);
    }
  }

  return block;
}

/** 初期ブロックをワークスペースに配置する */
export function placeInitialBlocks(workspace: Blockly.WorkspaceSvg): void {
  const root = createBlock(workspace, INITIAL_BLOCKS);
  root.moveBy(50, 50);
}
