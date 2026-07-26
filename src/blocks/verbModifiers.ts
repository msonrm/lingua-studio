/**
 * 動詞を修飾するブロック
 * - negation / frequency / manner / locative / time_adverb ラッパー
 * - preposition_verb: 動詞修飾の前置詞句
 * - coordination_verb_and / or: 動詞の等位接続
 */

import * as Blockly from 'blockly';
import { adverbCores } from '../concepts';
import { COLORS, msg, labelValidator } from './shared';
import { getPrepositionOptions } from './prepositions';

// ============================================
// 頻度副詞データ定義
// ============================================
const FREQUENCY_ADVERBS = [
  { label: 'always', value: 'always' },
  { label: 'usually', value: 'usually' },
  { label: 'often', value: 'often' },
  { label: 'sometimes', value: 'sometimes' },
  { label: 'rarely', value: 'rarely' },
  { label: 'never', value: 'never' },
];

// ============================================
// 様態副詞データ定義
// ============================================
const MANNER_ADVERBS = adverbCores.filter(a => a.type === 'manner');

// ============================================
// 否定ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['negation_wrapper'] = {
  init: function() {
    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('NEGATION_LABEL', 'not'));

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.negation);
    this.setTooltip(msg('NEGATION_TOOLTIP', 'Negation: makes the action negative'));
  }
};

// ============================================
// 頻度副詞ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['frequency_wrapper'] = {
  init: function() {
    const options: [string, string][] = FREQUENCY_ADVERBS.map(a => [a.label, a.value]);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('FREQUENCY_LABEL', 'FREQ'))
        .appendField(new Blockly.FieldDropdown(options), "FREQ_VALUE");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.frequency);
    this.setTooltip(msg('FREQUENCY_TOOLTIP', 'Frequency: how often the action occurs'));
  }
};

// ============================================
// 様態副詞ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['manner_wrapper'] = {
  init: function() {
    // 通常の様態副詞 + 疑問副詞 ?how
    const getOptions = (): [string, string][] => [
      [msg('GROUP_COMMON', '── Common ──'), '__label_common__'],
      ...MANNER_ADVERBS.filter(a => !a.lemma.startsWith('?')).map(a => [a.lemma, a.lemma] as [string, string]),
      [msg('GROUP_INTERROGATIVE', '── Interrogative ──'), '__label_interrogative__'],
      ['?how', '?how'],
    ];

    const dropdown = new Blockly.FieldDropdown(getOptions);
    dropdown.setValidator(labelValidator);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('MANNER_LABEL', 'MANNER'))
        .appendField(dropdown, "MANNER_VALUE");

    // デフォルト値を設定（最初の実際の値）
    this.setFieldValue('quickly', 'MANNER_VALUE');

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.manner);
    this.setTooltip(msg('MANNER_TOOLTIP', 'Manner: how the action is performed'));
  }
};

// ============================================
// 場所副詞データ定義
// ============================================
const LOCATIVE_ADVERBS = adverbCores.filter(a => a.type === 'place');

// ============================================
// 場所副詞ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['locative_wrapper'] = {
  init: function() {
    // 通常の場所副詞 + 疑問副詞 ?where
    const getOptions = (): [string, string][] => [
      [msg('GROUP_COMMON', '── Common ──'), '__label_common__'],
      ...LOCATIVE_ADVERBS.filter(a => !a.lemma.startsWith('?')).map(a => [a.lemma, a.lemma] as [string, string]),
      [msg('GROUP_INTERROGATIVE', '── Interrogative ──'), '__label_interrogative__'],
      ['?where', '?where'],
    ];

    const dropdown = new Blockly.FieldDropdown(getOptions);
    dropdown.setValidator(labelValidator);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('LOCATIVE_LABEL', 'LOCATION'))
        .appendField(dropdown, "LOCATIVE_VALUE");

    // デフォルト値を設定（最初の実際の値）
    this.setFieldValue('here', 'LOCATIVE_VALUE');

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.locative);
    this.setTooltip(msg('LOCATIVE_TOOLTIP', 'Location: where the action occurs'));
  }
};

// ============================================
// 時間副詞データ定義
// ============================================
const TIME_ADVERBS = [
  { label: 'yesterday', value: 'yesterday' },
  { label: 'today', value: 'today' },
  { label: 'tomorrow', value: 'tomorrow' },
  { label: 'now', value: 'now' },
  { label: 'then', value: 'then' },
  { label: 'soon', value: 'soon' },
  { label: 'later', value: 'later' },
  { label: 'recently', value: 'recently' },
];

// ============================================
// 時間副詞ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['time_adverb_wrapper'] = {
  init: function() {
    // 通常の時間副詞 + 疑問副詞 ?when
    const getOptions = (): [string, string][] => [
      [msg('GROUP_COMMON', '── Common ──'), '__label_common__'],
      ...TIME_ADVERBS.map(a => [a.label, a.value] as [string, string]),
      [msg('GROUP_INTERROGATIVE', '── Interrogative ──'), '__label_interrogative__'],
      ['?when', '?when'],
    ];

    const dropdown = new Blockly.FieldDropdown(getOptions);
    dropdown.setValidator(labelValidator);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('TIME_ADVERB_LABEL', 'TIME'))
        .appendField(dropdown, "TIME_ADVERB_VALUE");

    // デフォルト値を設定
    this.setFieldValue('yesterday', 'TIME_ADVERB_VALUE');

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.timeChip);
    this.setTooltip(msg('TIME_ADVERB_TOOLTIP', 'Time: when the action occurs'));
  }
};

// ============================================
// 前置詞ブロック（動詞用）- PP (VERB)
// ============================================
Blockly.Blocks['preposition_verb'] = {
  init: function() {
    const dropdown = new Blockly.FieldDropdown(getPrepositionOptions);
    dropdown.setValidator(labelValidator);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(msg('PP_LABEL', 'PP'))
        .appendField(dropdown, "PREP_VALUE");

    this.appendValueInput("OBJECT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('PP_OBJECT_LABEL', 'object:'));

    // デフォルト値を設定（最初の実際の値）
    this.setFieldValue('in', 'PREP_VALUE');

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.prepVerb);
    this.setTooltip(msg('PP_VERB_TOOLTIP', 'Prepositional Phrase (Verb): adds a prepositional phrase to a verb'));
  }
};

// ============================================
// 等位接続ブロック（動詞用）- AND (VERB)
// ============================================
Blockly.Blocks['coordination_verb_and'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck("verb")
        .appendField(msg('COORD_AND_LABEL', 'and'));

    this.appendStatementInput("RIGHT")
        .setCheck("verb");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.coordVerb);
    this.setTooltip(msg('COORD_VERB_AND_TOOLTIP', 'Coordination (Verb): connects two verb phrases with AND'));
  }
};

// ============================================
// 等位接続ブロック（動詞用）- OR (VERB)
// ============================================
Blockly.Blocks['coordination_verb_or'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck("verb")
        .appendField(msg('COORD_OR_LABEL', 'or'));

    this.appendStatementInput("RIGHT")
        .setCheck("verb");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.coordVerb);
    this.setTooltip(msg('COORD_VERB_OR_TOOLTIP', 'Coordination (Verb): connects two verb phrases with OR'));
  }
};

