/**
 * 文レベルのブロック
 * - time_frame: 文のルート（時制・相 + 述語）
 * - modal / imperative / question / negation_sentence ラッパー
 * - time_chip_*: 時制・相の指定チップ
 */

import * as Blockly from 'blockly';
import { COLORS, msg } from './shared';
import { CONCRETE_OPTIONS, ASPECTUAL_OPTIONS, ABSTRACT_OPTIONS } from './blockData';
import { labelValidator } from './shared';

// ============================================
// TimeFrame ブロック（ルート）
// ============================================
Blockly.Blocks['time_frame'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(msg('SENTENCE_LABEL', 'SENTENCE'));
    this.appendValueInput("TIME_CHIP")
        .setCheck("timeChip")
        .appendField(msg('SENTENCE_TA_LABEL', 'T/A:'));
    this.appendStatementInput("ACTION")
        .setCheck("verb")
        .appendField(msg('SENTENCE_PREDICATE_LABEL', 'predicate:'));
    // "sentence": modal_wrapperに接続可能
    // "basic_sentence": imperative_wrapperに接続可能（modalは不可）
    this.setPreviousStatement(true, ["sentence", "basic_sentence"]);
    this.setColour(COLORS.timeFrame);
    this.setTooltip(msg('SENTENCE_TOOLTIP', 'The root of a sentence, specifying tense and aspect'));
  }
};

// ============================================
// Modal ラッパーブロック（法助動詞）
// 言語非依存の意味概念として定義
// ============================================
Blockly.Blocks['modal_wrapper'] = {
  init: function() {
    const getModalOptions = (): [string, string][] => [
      [msg('MODAL_ABILITY', 'Ability (can)'), 'ability'],
      [msg('MODAL_VOLITION', 'Volition (will)'), 'volition'],
      [msg('MODAL_ADVICE', 'Advice (should)'), 'advice'],
      [msg('MODAL_OBLIGATION', 'Obligation (must)'), 'obligation'],
      [msg('MODAL_PERMISSION', 'Permission (may)'), 'permission'],
      [msg('MODAL_POSSIBILITY', 'Possibility (might)'), 'possibility'],
      [msg('MODAL_CERTAINTY', 'Certainty (must)'), 'certainty'],
      [msg('MODAL_PREDICTION', 'Prediction (will)'), 'prediction'],
    ];

    this.appendDummyInput()
        .appendField(msg('MODAL_LABEL', 'MODAL'))
        .appendField(new Blockly.FieldDropdown(getModalOptions), "MODAL_VALUE");
    this.appendStatementInput("SENTENCE")
        .setCheck("sentence");
    this.setPreviousStatement(true, ["modal", "sentence"]);  // negation_sentence_wrapper / imperative_wrapper に接続可能
    this.setColour(COLORS.modal);
    this.setTooltip(msg('MODAL_TOOLTIP', 'Modal: adds modality (ability, permission, obligation, etc.) to the sentence'));
  }
};

// ============================================
// Imperative ラッパーブロック（命令文）
// 英語のモーダル動詞には命令形がないため、modalとの組み合わせは不可
// ============================================
Blockly.Blocks['imperative_wrapper'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(msg('IMPERATIVE_LABEL', 'IMPERATIVE'));
    this.appendStatementInput("SENTENCE")
        .setCheck("basic_sentence");  // time_frameのみ接続可能（modalは不可）
    this.setColour(COLORS.imperative);
    this.setTooltip(msg('IMPERATIVE_TOOLTIP', "Imperative: creates a command (e.g., 'Eat the apple!')"));
  }
};

// ============================================
// Question ラッパーブロック（疑問文）
// ============================================
Blockly.Blocks['question_wrapper'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(msg('QUESTION_LABEL', 'QUESTION'));
    this.appendStatementInput("SENTENCE")
        .setCheck("sentence");
    this.setColour(COLORS.imperative);  // 同じ紫系（態度層）
    this.setTooltip(msg('QUESTION_TOOLTIP', "Question: creates a question (e.g., 'Do you like apples?')"));
  }
};

// ============================================
// Negation（文レベル）ラッパーブロック（モダリティ否定）
// ============================================
Blockly.Blocks['negation_sentence_wrapper'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(msg('NEGATION_MODAL_LABEL', 'NOT (modal)'));
    this.appendStatementInput("MODAL")
        .setCheck("modal");
    this.setPreviousStatement(true, "sentence");  // imperative_wrapper / modal_wrapper に接続可能
    this.setColour(COLORS.imperative);  // 紫系（sentence modifier）
    this.setTooltip(msg('NEGATION_MODAL_TOOLTIP', "Negates the modality (e.g., 'need not', 'don't have to')"));
  }
};

// ============================================
// TimeChip - Concrete (時点指定)
// ============================================
Blockly.Blocks['time_chip_concrete'] = {
  init: function() {
    const getOptions = (): [string, string][] => {
      // Past options
      const pastOptions = CONCRETE_OPTIONS.filter(o => o.tense === 'past');
      // Present options
      const presentOptions = CONCRETE_OPTIONS.filter(o => o.tense === 'present');
      // Future options
      const futureOptions = CONCRETE_OPTIONS.filter(o => o.tense === 'future');

      return [
        [msg('GROUP_PAST', '── Past ──'), '__label_past__'],
        ...pastOptions.map(o => [msg(o.msgKey, o.fallback), o.value] as [string, string]),
        [msg('GROUP_PRESENT', '── Present ──'), '__label_present__'],
        ...presentOptions.map(o => [msg(o.msgKey, o.fallback), o.value] as [string, string]),
        [msg('GROUP_FUTURE', '── Future ──'), '__label_future__'],
        ...futureOptions.map(o => [msg(o.msgKey, o.fallback), o.value] as [string, string]),
      ];
    };

    const dropdown = new Blockly.FieldDropdown(getOptions);
    dropdown.setValidator(labelValidator);

    this.appendDummyInput()
        .appendField(msg('TIME_CHIP_CONCRETE_LABEL', 'TIME'))
        .appendField(dropdown, "TIME_VALUE");

    // デフォルト値を最初の実際の値に設定 (yesterday)
    this.setFieldValue('yesterday', 'TIME_VALUE');

    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip(msg('TIME_CHIP_CONCRETE_TOOLTIP', 'Concrete time specification (when?)'));
  }
};

// ============================================
// TimeChip - Aspectual (状態指定)
// ============================================
Blockly.Blocks['time_chip_aspectual'] = {
  init: function() {
    const getOptions = (): [string, string][] =>
      ASPECTUAL_OPTIONS.map(o => [msg(o.msgKey, o.fallback), o.value]);

    this.appendDummyInput()
        .appendField(msg('TIME_CHIP_ASPECTUAL_LABEL', 'ASPECT'))
        .appendField(new Blockly.FieldDropdown(getOptions), "ASPECT_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip(msg('TIME_CHIP_ASPECTUAL_TOOLTIP', 'Aspectual marker (progressive, perfect, etc.)'));
  }
};

// ============================================
// TimeChip - Abstract (抽象指定)
// ============================================
Blockly.Blocks['time_chip_abstract'] = {
  init: function() {
    const getOptions = (): [string, string][] =>
      ABSTRACT_OPTIONS.map(o => [msg(o.msgKey, o.fallback), o.value]);

    this.appendDummyInput()
        .appendField(msg('TIME_CHIP_ABSTRACT_LABEL', 'TENSE/ASPECT'))
        .appendField(new Blockly.FieldDropdown(getOptions), "MODIFIER_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip(msg('TIME_CHIP_ABSTRACT_TOOLTIP', 'Tense/aspect modifier (affects verb conjugation)'));
  }
};

// ============================================
// TimeChip - Unified (統合: Tense × Aspect)
// ============================================
Blockly.Blocks['time_chip_unified'] = {
  init: function() {
    const getTenseOptions = (): [string, string][] => [
      [msg('TENSE_PAST', '[Past]'), 'past'],
      [msg('TENSE_PRESENT', '[Present]'), 'present'],
      [msg('TENSE_FUTURE', '[Future]'), 'future'],
    ];

    const getAspectOptions = (): [string, string][] => [
      [msg('ASPECT_SIMPLE', '[Simple]'), 'simple'],
      [msg('ASPECT_PROGRESSIVE', '[Progressive]'), 'progressive'],
      [msg('ASPECT_PERFECT', '[Perfect]'), 'perfect'],
      [msg('ASPECT_PERF_PROG', '[Perf. Prog.]'), 'perfectProgressive'],
    ];

    this.appendDummyInput()
        .appendField(msg('TIME_CHIP_UNIFIED_LABEL', 'T/A'))
        .appendField(new Blockly.FieldDropdown(getTenseOptions), "TENSE_VALUE")
        .appendField(new Blockly.FieldDropdown(getAspectOptions), "ASPECT_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip(msg('TIME_CHIP_UNIFIED_TOOLTIP', 'Unified Tense/Aspect: select both independently'));
  }
};

