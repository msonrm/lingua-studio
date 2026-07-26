/**
 * ヘッドレス Blockly ワークスペースの構築ヘルパー（レイヤーB用）
 *
 * Blockly は Node 環境でも `new Blockly.Workspace()` で動作する（`Blockly.inject` は DOM が要るが不要）。
 * ブロック定義の読み込み（`import '../blocks'`）も副作用込みで動く。
 *
 * ⚠ Blockly はイベントを非同期にフラッシュする。
 *    determiner_unified の自動補正など `onchange` に依存する挙動は
 *    `flushBlocklyEvents()` を待たないと反映されない。
 */

import * as Blockly from 'blockly';
import '../blocks';

/** ブロック木の宣言的な指定 */
export interface BlockSpec {
  type: string;
  fields?: Record<string, string>;
  /** 入力名 → 子ブロック。value / statement は接続の種類から自動判別する */
  inputs?: Record<string, BlockSpec>;
}

/** 子ブロックを親の入力へ接続する（value / statement を自動判別） */
function connect(parent: Blockly.Block, inputName: string, child: Blockly.Block): void {
  const connection = parent.getInput(inputName)?.connection;
  if (!connection) {
    throw new Error(`ブロック "${parent.type}" に入力 "${inputName}" がありません`);
  }
  if (child.outputConnection) {
    connection.connect(child.outputConnection);
  } else if (child.previousConnection) {
    connection.connect(child.previousConnection);
  } else {
    throw new Error(`ブロック "${child.type}" に接続可能な出力がありません`);
  }
}

/** BlockSpec からブロック木を生成する */
function buildBlock(ws: Blockly.Workspace, spec: BlockSpec): Blockly.Block {
  const block = ws.newBlock(spec.type);

  for (const [name, value] of Object.entries(spec.fields ?? {})) {
    if (!block.getField(name)) {
      throw new Error(`ブロック "${spec.type}" にフィールド "${name}" がありません`);
    }
    block.setFieldValue(value, name);
  }

  for (const [inputName, childSpec] of Object.entries(spec.inputs ?? {})) {
    connect(block, inputName, buildBlock(ws, childSpec));
  }

  return block;
}

/**
 * Blockly のイベントキューをフラッシュする。
 * `determiner_unified` の限定詞自動補正など、onchange 依存の挙動を反映させるために必要。
 */
function flushBlocklyEvents(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10));
}

/** BlockSpec 群からワークスペースを構築し、イベントをフラッシュして返す */
export async function buildWorkspace(...specs: BlockSpec[]): Promise<Blockly.Workspace> {
  const ws = new Blockly.Workspace();
  for (const spec of specs) {
    buildBlock(ws, spec);
  }
  await flushBlocklyEvents();
  return ws;
}

// ============================================
// よく使う部品
// ============================================

/** 代名詞ブロック */
export const pronoun = (lemma: string): BlockSpec => ({
  type: 'pronoun_block',
  fields: { PRONOUN_VALUE: lemma },
});

/** 限定詞つきの名詞（DET の値は自動補正に任せる） */
const detNoun = (blockType: string, fieldName: string, lemma: string): BlockSpec => ({
  type: 'determiner_unified',
  inputs: { NOUN: { type: blockType, fields: { [fieldName]: lemma } } },
});

/** object_block を限定詞で包んだもの */
export const anObject = (lemma: string): BlockSpec =>
  detNoun('object_block', 'OBJECT_VALUE', lemma);

/** place_block を限定詞で包んだもの */
export const aPlace = (lemma: string): BlockSpec =>
  detNoun('place_block', 'PLACE_VALUE', lemma);

/** 時制・相を指定する time_frame（TimeChip は abstract を使う） */
export const timeFrame = (modifier: string, action: BlockSpec): BlockSpec => ({
  type: 'time_frame',
  inputs: {
    TIME_CHIP: { type: 'time_chip_abstract', fields: { MODIFIER_VALUE: modifier } },
    ACTION: action,
  },
});
