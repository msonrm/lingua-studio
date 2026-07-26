/**
 * Logic Extension: 命題論理のブロック
 *
 * 等位接続（小文字 and/or）とは別系統で、大文字 AND/OR/NOT/IF/BECAUSE を扱う。
 * fact_wrapper の中でのみ接続できる（setPreviousStatement が "logic" タイプ）。
 */

import * as Blockly from 'blockly';
import { COLORS, msg } from './shared';

// ============================================
// Logic Extension: fact ブロック
// ============================================
// fact_wrapper は "verb" と "logic" の両方を受け入れる
// これにより fact 内で AND/OR/NOT と通常の動詞ブロック両方が使える
Blockly.Blocks['fact_wrapper'] = {
  init: function() {
    this.appendStatementInput("PROPOSITION")
        .setCheck(["verb", "logic"])  // verb（動詞）と logic（AND/OR/NOT）両方受け入れ
        .appendField(msg('FACT_LABEL', 'fact'));

    this.setColour(COLORS.logic);
    this.setTooltip(msg('FACT_TOOLTIP', 'Declares a logical fact (assertion). Exclusive with sentence/modal.'));
  }
};

// ============================================
// Logic Extension: AND ブロック（命題レベル）
// ============================================
// setPreviousStatement を "logic" タイプにすることで fact_wrapper 内でのみ接続可能
Blockly.Blocks['logic_and_block'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_AND_LABEL', 'AND'));

    this.appendStatementInput("RIGHT")
        .setCheck(["verb", "logic"]);

    this.setPreviousStatement(true, "logic");
    this.setColour(COLORS.logicOp);
    this.setTooltip(msg('LOGIC_AND_TOOLTIP', 'Logical conjunction (AND): both propositions must be true'));
  }
};

// ============================================
// Logic Extension: OR ブロック（命題レベル）
// ============================================
Blockly.Blocks['logic_or_block'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_OR_LABEL', 'OR'));

    this.appendStatementInput("RIGHT")
        .setCheck(["verb", "logic"]);

    this.setPreviousStatement(true, "logic");
    this.setColour(COLORS.logicOp);
    this.setTooltip(msg('LOGIC_OR_TOOLTIP', 'Logical disjunction (OR): at least one proposition must be true'));
  }
};

// ============================================
// Logic Extension: NOT ブロック（命題レベル）
// ============================================
Blockly.Blocks['logic_not_block'] = {
  init: function() {
    this.appendStatementInput("PROPOSITION")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_NOT_LABEL', 'NOT'));

    this.setPreviousStatement(true, "logic");
    this.setColour(COLORS.logicOp);
    this.setTooltip(msg('LOGIC_NOT_TOOLTIP', 'Logical negation (NOT): the proposition is false'));
  }
};

// ============================================
// Logic Extension: IF ブロック（条件・含意）
// IF(P, then:Q) - 「PならばQ」
// ============================================
Blockly.Blocks['logic_if_block'] = {
  init: function() {
    this.appendStatementInput("CONDITION")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_IF_LABEL', 'IF'));
    this.appendStatementInput("CONSEQUENCE")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_THEN_LABEL', 'THEN'));

    this.setPreviousStatement(true, "logic");
    this.setColour(COLORS.logicOp);
    this.setTooltip(msg('LOGIC_IF_TOOLTIP', 'Conditional (IF...THEN): if the condition is true, the consequence follows'));
  }
};

// ============================================
// Logic Extension: BECAUSE ブロック（因果関係）
// BECAUSE(P, effect:Q) - 「Pだから、Q」
// ============================================
Blockly.Blocks['logic_because_block'] = {
  init: function() {
    this.appendStatementInput("CAUSE")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_BECAUSE_LABEL', 'BECAUSE'));
    this.appendStatementInput("EFFECT")
        .setCheck(["verb", "logic"])
        .appendField(msg('LOGIC_EFFECT_LABEL', 'EFFECT'));

    this.setPreviousStatement(true, "logic");
    this.setColour(COLORS.logicOp);
    this.setTooltip(msg('LOGIC_BECAUSE_TOOLTIP', 'Causation (BECAUSE...EFFECT): the cause leads to the effect'));
  }
};

