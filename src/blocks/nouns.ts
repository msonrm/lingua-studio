/**
 * 名詞・代名詞のブロック
 * - pronoun / possessive_pronoun
 * - human / animal / object / place / abstract（カテゴリ別の名詞）
 */

import * as Blockly from 'blockly';
import { nounCores, pronounCores, getNounCoresByCategory } from '../concepts';
import { COLORS, msg, labelValidator } from './shared';

// ============================================
// 代名詞ブロック（限定詞不要）
// ============================================
const personalPronouns = pronounCores.filter(p => p.type === 'personal');
const indefinitePronouns = pronounCores.filter(p => p.type === 'indefinite');
const demonstrativePronouns = pronounCores.filter(p => p.type === 'demonstrative');
const interrogativePronouns = pronounCores.filter(p => p.type === 'interrogative');

Blockly.Blocks['pronoun_block'] = {
  init: function() {
    const personalOptions: [string, string][] = personalPronouns.map(p => [p.lemma, p.lemma]);
    const indefiniteOptions: [string, string][] = indefinitePronouns.map(p => [p.lemma, p.lemma]);
    const demonstrativeOptions: [string, string][] = demonstrativePronouns.map(p => [p.lemma, p.lemma]);
    const interrogativeOptions: [string, string][] = interrogativePronouns.map(p => [p.lemma, p.lemma]);

    const getAllOptions = (): [string, string][] => [
      [msg('GROUP_PERSONAL', '── Personal ──'), "__label_personal__"],
      ...personalOptions,
      [msg('GROUP_DEMONSTRATIVE', '── Demonstrative ──'), "__label_demonstrative__"],
      ...demonstrativeOptions,
      [msg('GROUP_INDEFINITE', '── Indefinite ──'), "__label_indefinite__"],
      ...indefiniteOptions,
      [msg('GROUP_INTERROGATIVE', '── Interrogative ──'), "__label_interrogative__"],
      ...interrogativeOptions,
    ];

    const dropdown = new Blockly.FieldDropdown(getAllOptions);
    dropdown.setValidator(labelValidator);

    this.appendDummyInput()
        .appendField(msg('PRONOUN_LABEL', 'PRONOUN'))
        .appendField(dropdown, "PRONOUN_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (personalOptions.length > 0) {
      this.setFieldValue(personalOptions[0][1], "PRONOUN_VALUE");
    }

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.person);
    this.setTooltip(msg('PRONOUN_TOOLTIP', 'A pronoun (I, you, he, this, someone, etc.) - no determiner needed'));
  }
};

// ============================================
// 所有代名詞ブロック（mine, yours, etc.）
// ============================================
const possessivePronouns = pronounCores.filter(p => p.type === 'possessive');

Blockly.Blocks['possessive_pronoun_block'] = {
  init: function() {
    const options: [string, string][] = possessivePronouns.map(p => [p.lemma, p.lemma]);

    this.appendDummyInput()
        .appendField(msg('POSSESSIVE_PRONOUN_LABEL', 'POSSESSIVE'))
        .appendField(new Blockly.FieldDropdown(options), "POSSESSIVE_VALUE");

    // デフォルト値を設定
    if (options.length > 0) {
      this.setFieldValue(options[0][1], "POSSESSIVE_VALUE");
    }

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.thing);  // オブジェクト色（モノを指すため）
    this.setTooltip(msg('POSSESSIVE_PRONOUN_TOOLTIP', 'A possessive pronoun (mine, yours, his, hers, ours, theirs) - refers to a possessed thing'));
  }
};

// ============================================
// 人間ブロック (human)
// ============================================
const humanNouns = nounCores.filter(n => n.category === 'human' && !n.proper);
const humanProperNouns = nounCores.filter(n => n.category === 'human' && n.proper);

Blockly.Blocks['human_block'] = {
  init: function() {
    const commonOptions: [string, string][] = humanNouns.map(n => [n.lemma, n.lemma]);
    const properOptions: [string, string][] = humanProperNouns.map(n => [n.lemma, n.lemma]);

    const getNounOptions = (): [string, string][] => [
      [msg('GROUP_COMMON', '── Common ──'), "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [[msg('GROUP_NAMES', '── Names ──'), "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    const dropdown = new Blockly.FieldDropdown(getNounOptions);
    dropdown.setValidator(labelValidator);

    this.appendDummyInput()
        .appendField(msg('HUMAN_LABEL', 'HUMAN'))
        .appendField(dropdown, "HUMAN_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (commonOptions.length > 0) {
      this.setFieldValue(commonOptions[0][1], "HUMAN_VALUE");
    }

    this.setOutput(true, "noun");
    this.setColour(COLORS.person);
    this.setTooltip(msg('HUMAN_TOOLTIP', 'A human (father, teacher, John, etc.)'));
  }
};

// ============================================
// 動物ブロック (animal)
// ============================================
const animalNouns = getNounCoresByCategory('animal');

Blockly.Blocks['animal_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ...animalNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField(msg('ANIMAL_LABEL', 'ANIMAL'))
        .appendField(new Blockly.FieldDropdown(nounOptions), "ANIMAL_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip(msg('ANIMAL_TOOLTIP', 'An animal (cat, dog, bird, etc.)'));
  }
};

// ============================================
// 物体ブロック (object)
// ============================================
const objectNouns = getNounCoresByCategory('object');

Blockly.Blocks['object_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ...objectNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField(msg('OBJECT_LABEL', 'OBJECT'))
        .appendField(new Blockly.FieldDropdown(nounOptions), "OBJECT_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip(msg('OBJECT_TOOLTIP', 'An object (apple, book, pen, water, etc.)'));
  }
};

// ============================================
// 場所ブロック (place)
// ============================================
const placeNouns = nounCores.filter(n => n.category === 'place' && !n.proper);
const placeProperNouns = nounCores.filter(n => n.category === 'place' && n.proper);
// 場所副詞 (here, there) は一時削除 - 限定詞との相性問題のため

Blockly.Blocks['place_block'] = {
  init: function() {
    const commonOptions: [string, string][] = placeNouns.map(n => [n.lemma, n.lemma]);
    const properOptions: [string, string][] = placeProperNouns.map(n => [n.lemma, n.lemma]);

    const getNounOptions = (): [string, string][] => [
      [msg('GROUP_COMMON', '── Common ──'), "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [[msg('GROUP_NAMES', '── Names ──'), "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    const dropdown = new Blockly.FieldDropdown(getNounOptions);
    dropdown.setValidator(labelValidator);

    this.appendDummyInput()
        .appendField(msg('PLACE_LABEL', 'PLACE'))
        .appendField(dropdown, "PLACE_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (commonOptions.length > 0) {
      this.setFieldValue(commonOptions[0][1], "PLACE_VALUE");
    }

    this.setOutput(true, "noun");
    this.setColour(COLORS.place);
    this.setTooltip(msg('PLACE_TOOLTIP', 'A place (park, school, Tokyo, etc.)'));
  }
};

// ============================================
// 抽象概念ブロック (abstract)
// ============================================
const abstractNouns = getNounCoresByCategory('abstract');

Blockly.Blocks['abstract_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ...abstractNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField(msg('ABSTRACT_LABEL', 'ABSTRACT'))
        .appendField(new Blockly.FieldDropdown(nounOptions), "ABSTRACT_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip(msg('ABSTRACT_TOOLTIP', 'An abstract concept (idea, love, music, etc.)'));
  }
};

