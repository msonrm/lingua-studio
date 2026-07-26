/**
 * 名詞を修飾するブロック
 * - カテゴリ別の形容詞ブロック
 * - preposition_noun: 名詞修飾の前置詞句
 * - coordination_noun_and / or: 名詞の等位接続
 */

import * as Blockly from 'blockly';
import type { AdjectiveCategory } from '../types/schema';
import { getAdjectiveCoresByCategory } from '../concepts';
import { COLORS, msg, labelValidator } from './shared';
import { getPrepositionOptions } from './prepositions';

// ============================================
// カテゴリ別形容詞ブロック
// ============================================
const ADJECTIVE_CATEGORY_KEYS: Record<AdjectiveCategory, { msgKey: string; fallback: string; color: string }> = {
  size: { msgKey: 'ADJ_SIZE', fallback: 'SIZE', color: COLORS.adjective },
  age: { msgKey: 'ADJ_AGE', fallback: 'AGE', color: COLORS.adjective },
  color: { msgKey: 'ADJ_COLOR', fallback: 'COLOR', color: COLORS.adjective },
  physical: { msgKey: 'ADJ_PHYSICAL', fallback: 'PHYSICAL', color: COLORS.adjective },
  quality: { msgKey: 'ADJ_QUALITY', fallback: 'QUALITY', color: COLORS.adjective },
  emotion: { msgKey: 'ADJ_EMOTION', fallback: 'EMOTION', color: COLORS.adjective },
};

// カテゴリ別形容詞ブロック生成関数
function createAdjectiveCategoryBlock(category: AdjectiveCategory) {
  const config = ADJECTIVE_CATEGORY_KEYS[category];
  const categoryAdjs = getAdjectiveCoresByCategory(category);

  Blockly.Blocks[`adjective_${category}`] = {
    init: function() {
      const adjOptions: [string, string][] = categoryAdjs.map(a => [a.lemma, a.lemma]);
      const label = msg(config.msgKey, config.fallback);

      this.appendValueInput("NOUN")
          .setCheck(["noun", "adjective"])
          .appendField(label)
          .appendField(new Blockly.FieldDropdown(adjOptions), "ADJ_VALUE");

      this.setOutput(true, "adjective");
      this.setColour(config.color);
      this.setTooltip(`${label} adjective: modifies a noun`);
    }
  };
}

// 6カテゴリの形容詞ブロックを生成
(['size', 'age', 'color', 'physical', 'quality', 'emotion'] as AdjectiveCategory[]).forEach(createAdjectiveCategoryBlock);

// ============================================
// 前置詞ブロック（名詞用）- PP (NOUN)
// ============================================
Blockly.Blocks['preposition_noun'] = {
  init: function() {
    const dropdown = new Blockly.FieldDropdown(getPrepositionOptions);
    dropdown.setValidator(labelValidator);

    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective", "nounPhrase"])
        .appendField(msg('PP_LABEL', 'PP'))
        .appendField(dropdown, "PREP_VALUE");

    this.appendValueInput("OBJECT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('PP_OBJECT_LABEL', 'object:'));

    // デフォルト値を設定（最初の実際の値）
    this.setFieldValue('in', 'PREP_VALUE');

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.prepNoun);
    this.setTooltip(msg('PP_NOUN_TOOLTIP', 'Prepositional Phrase (Noun): modifies a noun with a prepositional phrase'));
  }
};

// ============================================
// 等位接続ブロック（名詞用）- AND (NOUN)
// ============================================
Blockly.Blocks['coordination_noun_and'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('COORD_AND_LABEL', 'and'));

    this.appendValueInput("RIGHT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"]);

    this.setOutput(true, "coordinatedNounPhrase");
    this.setColour(COLORS.coordNoun);
    this.setTooltip(msg('COORD_NOUN_AND_TOOLTIP', 'Coordination (Noun): connects two noun phrases with AND'));
  }
};

// ============================================
// 等位接続ブロック（名詞用）- OR (NOUN)
// ============================================
Blockly.Blocks['coordination_noun_or'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField(msg('COORD_OR_LABEL', 'or'));

    this.appendValueInput("RIGHT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"]);

    this.setOutput(true, "coordinatedNounPhrase");
    this.setColour(COLORS.coordNoun);
    this.setTooltip(msg('COORD_NOUN_OR_TOOLTIP', 'Coordination (Noun): connects two noun phrases with OR'));
  }
};

