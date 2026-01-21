import * as Blockly from 'blockly';
import { verbs, nouns, adjectives, adverbs } from '../data/dictionary';

// ============================================
// 色の定義
// ============================================
const COLORS = {
  sentence: 45,    // オレンジ
  verb: 160,       // 緑
  noun: 230,       // 青
  adjective: 290,  // 紫
  adverb: 20,      // 赤オレンジ
  tense: 65,       // 黄色
};

// ============================================
// 文ブロック（ルート）
// ============================================
Blockly.Blocks['sentence'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("SENTENCE");
    this.appendValueInput("TENSE")
        .setCheck("tense")
        .appendField("time/aspect:");
    this.appendStatementInput("VERB_PHRASE")
        .setCheck("verb")
        .appendField("verb:");
    this.setColour(COLORS.sentence);
    this.setTooltip("A complete sentence");
  }
};

// ============================================
// 時制ブロック
// ============================================
Blockly.Blocks['tense'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["present", "present"],
          ["past", "past"],
          ["future", "future"],
        ]), "TENSE");
    this.setOutput(true, "tense");
    this.setColour(COLORS.tense);
    this.setTooltip("Select tense");
  }
};

// ============================================
// 動詞ブロック（動的スロット生成）
// ============================================
Blockly.Blocks['verb'] = {
  init: function() {
    const verbOptions: [string, string][] = verbs.map(v => [v.lemma, v.lemma]);

    this.appendDummyInput()
        .appendField("VERB")
        .appendField(new Blockly.FieldDropdown(verbOptions, this.updateShape.bind(this)), "VERB");

    this.appendValueInput("ADVERB")
        .setCheck("adverb")
        .appendField("adverb:");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.verb);
    this.setTooltip("Select a verb");

    // 初期形状を設定
    this.updateShape(verbs[0]?.lemma || "sleep");
  },

  updateShape: function(verbLemma: string) {
    const verb = verbs.find(v => v.lemma === verbLemma);
    if (!verb) return verbLemma;

    // 既存のスロットを削除
    const existingInputs = this.inputList
      .filter((input: Blockly.Input) => input.name.startsWith("ARG_"))
      .map((input: Blockly.Input) => input.name);

    existingInputs.forEach((name: string) => this.removeInput(name));

    // 新しいスロットを追加
    verb.valency.forEach((slot, index) => {
      const inputName = `ARG_${index}`;
      this.appendValueInput(inputName)
          .setCheck("nounPhrase")
          .appendField(`${slot.role}${slot.required ? '*' : ''}:`);
    });

    return verbLemma;
  }
};

// ============================================
// 名詞句ブロック
// ============================================
Blockly.Blocks['noun_phrase'] = {
  init: function() {
    const nounOptions: [string, string][] = nouns.map(n => [n.lemma, n.lemma]);

    this.appendDummyInput()
        .appendField("NP");
    this.appendValueInput("ADJ1")
        .setCheck("adjective")
        .appendField("adj:");
    this.appendValueInput("ADJ2")
        .setCheck("adjective")
        .appendField("adj:");
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["(none)", "none"],
          ["a/an", "indefinite"],
          ["the", "definite"],
        ]), "DETERMINER")
        .appendField(new Blockly.FieldDropdown(nounOptions), "NOUN")
        .appendField(new Blockly.FieldDropdown([
          ["singular", "singular"],
          ["plural", "plural"],
        ]), "NUMBER");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.noun);
    this.setTooltip("A noun phrase");
  }
};

// ============================================
// 形容詞ブロック
// ============================================
Blockly.Blocks['adjective'] = {
  init: function() {
    const adjOptions: [string, string][] = adjectives.map(a => [a.lemma, a.lemma]);

    this.appendDummyInput()
        .appendField("ADJ")
        .appendField(new Blockly.FieldDropdown(adjOptions), "ADJECTIVE");

    this.setOutput(true, "adjective");
    this.setColour(COLORS.adjective);
    this.setTooltip("An adjective");
  }
};

// ============================================
// 副詞ブロック
// ============================================
Blockly.Blocks['adverb'] = {
  init: function() {
    const advOptions: [string, string][] = adverbs.map(a => [a.lemma, a.lemma]);

    this.appendDummyInput()
        .appendField("ADV")
        .appendField(new Blockly.FieldDropdown(advOptions), "ADVERB");

    this.setOutput(true, "adverb");
    this.setColour(COLORS.adverb);
    this.setTooltip("An adverb");
  }
};

// ============================================
// ツールボックス定義
// ============================================
export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Sentence",
      colour: COLORS.sentence,
      contents: [
        { kind: "block", type: "sentence" },
      ]
    },
    {
      kind: "category",
      name: "Tense",
      colour: COLORS.tense,
      contents: [
        { kind: "block", type: "tense" },
      ]
    },
    {
      kind: "category",
      name: "Verbs",
      colour: COLORS.verb,
      contents: [
        { kind: "block", type: "verb" },
      ]
    },
    {
      kind: "category",
      name: "Nouns",
      colour: COLORS.noun,
      contents: [
        { kind: "block", type: "noun_phrase" },
      ]
    },
    {
      kind: "category",
      name: "Adjectives",
      colour: COLORS.adjective,
      contents: [
        { kind: "block", type: "adjective" },
      ]
    },
    {
      kind: "category",
      name: "Adverbs",
      colour: COLORS.adverb,
      contents: [
        { kind: "block", type: "adverb" },
      ]
    },
  ]
};
