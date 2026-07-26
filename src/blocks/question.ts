/**
 * 疑問文セクションのブロック
 * - choice_question: 選択疑問（?which）
 * - wh_placeholder / wh_adverb: 疑問詞のプレースホルダー
 */

import * as Blockly from 'blockly';
import { COLORS, msg } from './shared';

// ============================================
// 選択疑問ブロック (?which)
// ============================================
Blockly.Blocks['choice_question_block'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('CHOICE_QUESTION_LABEL', '?which'));

    this.appendValueInput("RIGHT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('CHOICE_QUESTION_OR', 'or'));

    this.setOutput(true, "coordinatedNounPhrase");
    this.setColour(COLORS.coordNoun);
    this.setTooltip(msg('CHOICE_QUESTION_TOOLTIP', 'Choice Question: asks which option (e.g., "tea or coffee?")'));
  }
};

// ============================================
// Wh疑問詞プレースホルダーブロック（Questionセクション用）
// ============================================
Blockly.Blocks['wh_placeholder_block'] = {
  init: function() {
    const options: [string, string][] = [
      ['?who', '?who'],
      ['?what', '?what'],
    ];

    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(options), "WH_VALUE");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.imperative);  // 紫系（疑問と同系）
    this.setTooltip(msg('WH_PLACEHOLDER_TOOLTIP', 'Wh-question word: who (person) or what (thing)'));
  }
};

// ============================================
// Wh疑問副詞プレースホルダーブロック（Questionセクション用）
// ============================================
Blockly.Blocks['wh_adverb_block'] = {
  init: function() {
    const options: [string, string][] = [
      ['?where', '?where'],
      ['?when', '?when'],
      ['?how', '?how'],
    ];

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField(new Blockly.FieldDropdown(options), "WH_ADVERB_VALUE");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.imperative);  // 紫系（疑問と同系）
    this.setTooltip(msg('WH_ADVERB_TOOLTIP', 'Wh-adverb: where (place), when (time), or how (manner)'));
  }
};

