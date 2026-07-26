/**
 * ユーザー辞書に追加した語が実際に文で使えるかのテスト
 *
 * 「辞書に追加できるのにツールボックスに現れない」品詞が無いことを担保する。
 * 形容詞・副詞は動詞・名詞と現れ方が違うので、それぞれの経路を確認する。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import '../blocks';
import { addVerb, addNoun, addAdjective, addAdverb } from '../userDictionary';
import { generateMultipleAST } from '../renderer/astGenerator';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { renderToJapanese } from '../renderer/japanese';
import { buildWorkspace, pronoun, timeFrame, type BlockSpec } from './workspace';

beforeAll(() => {
  addVerb({
    lemma: 'gather',
    type: 'action',
    category: 'action',
    valency: [
      { role: 'agent', required: true },
      { role: 'patient', required: false },
    ],
    forms: {
      en: { past: 'gathered', pp: 'gathered', ing: 'gathering', s: 'gathers' },
      ja: { ja: '集める', verbType: 'ichidan' },
    },
  });
  addNoun({
    lemma: 'notebook',
    category: 'object',
    countable: true,
    forms: { en: { plural: 'notebooks' }, ja: { ja: 'ノート' } },
  });
  addAdjective({
    lemma: 'tidy',
    category: 'quality',
    forms: { ja: { ja: 'きちんとした' } },
  });
  addAdverb({
    lemma: 'neatly',
    type: 'manner',
    forms: { ja: { ja: 'きちんと' } },
  });
});

describe('ユーザー辞書の語が文に使える', () => {
  it('動詞・名詞は拡張ブロックとして登録される', () => {
    expect(Blockly.Blocks['verb_action_ext']).toBeDefined();
    expect(Blockly.Blocks['noun_object_ext']).toBeDefined();
  });

  it('形容詞も拡張ブロックとして登録される', () => {
    // 以前は形容詞・副詞は辞書に追加できてもブロックが作られなかった
    expect(Blockly.Blocks['adjective_quality_ext']).toBeDefined();
  });

  it('副詞はラッパーのドロップダウン項目として現れる', () => {
    // 副詞は独立したブロックではないので *_ext ブロックは作らない
    expect(Blockly.Blocks['adverb_manner_ext']).toBeUndefined();

    const ws = new Blockly.Workspace();
    try {
      const block = ws.newBlock('manner_wrapper');
      const field = block.getField('MANNER_VALUE') as Blockly.FieldDropdown;
      const values = field.getOptions(false).map(o => o[1]);
      expect(values).toContain('neatly');
    } finally {
      ws.dispose();
    }
  });

  it('拡張の形容詞と名詞を組み合わせた文が両言語で出る', async () => {
    const spec: BlockSpec = timeFrame('current', {
      type: 'verb_action_ext',
      fields: { VERB: 'gather' },
      inputs: {
        ARG_0: pronoun('I'),
        ARG_1: {
          type: 'determiner_unified',
          inputs: {
            NOUN: {
              type: 'adjective_quality_ext',
              fields: { ADJ_VALUE: 'tidy' },
              inputs: { NOUN: { type: 'noun_object_ext', fields: { LEMMA: 'notebook' } } },
            },
          },
        },
      },
    });

    const ws = await buildWorkspace(spec);
    try {
      const [ast] = generateMultipleAST(ws);
      expect(renderToEnglishWithLogs(ast).output).toBe('I gather a tidy notebook.');
      // 一段動詞として活用され、形容詞・名詞も訳語が使われる
      expect(renderToJapanese(ast)).toBe('私はきちんとしたノートを集める。');
    } finally {
      ws.dispose();
    }
  });

  it('拡張の副詞を使った文が両言語で出る', async () => {
    const ws = await buildWorkspace(
      timeFrame('current', {
        type: 'manner_wrapper',
        fields: { MANNER_VALUE: 'neatly' },
        inputs: {
          VERB: {
            type: 'verb_action_ext',
            fields: { VERB: 'gather' },
            inputs: { ARG_0: pronoun('I') },
          },
        },
      })
    );
    try {
      const [ast] = generateMultipleAST(ws);
      expect(renderToEnglishWithLogs(ast).output).toBe('I gather neatly.');
      expect(renderToJapanese(ast)).toBe('私はきちんと集める。');
    } finally {
      ws.dispose();
    }
  });
});
