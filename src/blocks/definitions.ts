import * as Blockly from 'blockly';
import { verbs, nouns, adjectives, adverbs, pronouns } from '../data/dictionary';

// ============================================
// 色の定義
// ============================================
const COLORS = {
  timeFrame: '#8B0000',  // ダークレッド
  timeChip: '#DAA520',   // ゴールド
  action: '#DC143C',     // クリムゾンレッド（モンテッソーリ的）
  noun: 230,             // 青（レガシー）
  person: '#0d1321',     // ほぼ黒の濃紺（モンテッソーリ的）
  thing: '#0d1321',      // ほぼ黒の濃紺（モンテッソーリ的）
  place: '#1a0a0a',      // ほぼ黒の暗赤（モンテッソーリ的）
  determiner: '#2d4a3e', // 暗緑（限定詞）
  quantifier: '#3d2d4a', // 暗紫（数量詞）
  adjective: 290,        // 紫
  adverb: 20,            // 赤オレンジ
  // Verb modifiers
  negation: '#C71585',   // マゼンタ（否定）
  frequency: '#FF8C00',  // オレンジ（頻度副詞）
  manner: '#FF6347',     // トマト（様態副詞）
};

// ============================================
// TimeChip データ定義
// ============================================
type Tense = 'past' | 'present' | 'future' | 'inherit';
type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive' | 'inherit';

interface TimeChipOption {
  label: string;
  value: string;
  tense: Tense;
  aspect: Aspect;
}

const CONCRETE_OPTIONS: TimeChipOption[] = [
  { label: 'Select time...', value: '__placeholder__', tense: 'present', aspect: 'simple' },
  { label: 'Yesterday', value: 'yesterday', tense: 'past', aspect: 'simple' },
  { label: 'Tomorrow', value: 'tomorrow', tense: 'future', aspect: 'simple' },
  { label: 'Every day', value: 'every_day', tense: 'present', aspect: 'simple' },
  { label: 'Last Sunday', value: 'last_sunday', tense: 'past', aspect: 'simple' },
  { label: 'Right now', value: 'right_now', tense: 'present', aspect: 'progressive' },
  { label: 'Next week', value: 'next_week', tense: 'future', aspect: 'simple' },
];

const ASPECTUAL_OPTIONS: TimeChipOption[] = [
  { label: 'Select aspect...', value: '__placeholder__', tense: 'present', aspect: 'simple' },
  { label: 'Now', value: 'now', tense: 'present', aspect: 'progressive' },
  { label: 'Just now', value: 'just_now', tense: 'past', aspect: 'perfect' },
  { label: 'Already/Yet', value: 'completion', tense: 'inherit', aspect: 'perfect' },
  { label: 'Still', value: 'still', tense: 'inherit', aspect: 'progressive' },
  { label: 'Recently', value: 'recently', tense: 'past', aspect: 'perfect' },
];

const ABSTRACT_OPTIONS: TimeChipOption[] = [
  { label: 'Select modifier...', value: '__placeholder__', tense: 'present', aspect: 'simple' },
  { label: '[Past]', value: 'past', tense: 'past', aspect: 'inherit' },
  { label: '[Future]', value: 'future', tense: 'future', aspect: 'inherit' },
  { label: '[Current]', value: 'current', tense: 'present', aspect: 'inherit' },
  { label: '[-ing]', value: 'progressive', tense: 'inherit', aspect: 'progressive' },
  { label: '[Perfect]', value: 'perfect', tense: 'inherit', aspect: 'perfect' },
];

// ============================================
// 数量詞データ定義
// ============================================
type GrammaticalNumber = 'singular' | 'plural' | 'uncountable';

interface QuantifierOption {
  label: string;
  value: string;
  number: GrammaticalNumber;
  output: string | null;  // null = 出力なし（[plural]など）
}

const QUANTIFIER_OPTIONS: QuantifierOption[] = [
  // 単数
  { label: 'a/an', value: 'a', number: 'singular', output: 'a' },
  { label: 'one', value: 'one', number: 'singular', output: 'one' },
  // 複数
  { label: 'two', value: 'two', number: 'plural', output: 'two' },
  { label: 'three', value: 'three', number: 'plural', output: 'three' },
  { label: 'many', value: 'many', number: 'plural', output: 'many' },
  { label: 'some', value: 'some', number: 'plural', output: 'some' },
  { label: 'few', value: 'few', number: 'plural', output: 'few' },
  { label: 'all', value: 'all', number: 'plural', output: 'all' },
  { label: 'no', value: 'no', number: 'plural', output: 'no' },
  // 抽象（出力なし）
  { label: '[plural]', value: '__plural__', number: 'plural', output: null },
  { label: '[–]', value: '__uncountable__', number: 'uncountable', output: null },
];

// ============================================
// TimeFrame ブロック（ルート）
// ============================================
Blockly.Blocks['time_frame'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("TIME FRAME");
    this.appendValueInput("TIME_CHIP")
        .setCheck("timeChip")
        .appendField("when:");
    this.appendStatementInput("ACTION")
        .setCheck("verb")
        .appendField("action:");
    this.setColour(COLORS.timeFrame);
    this.setTooltip("The root of a sentence, specifying time frame");
  }
};

// ============================================
// TimeChip - Concrete (時点指定)
// ============================================
Blockly.Blocks['time_chip_concrete'] = {
  init: function() {
    const options: [string, string][] = CONCRETE_OPTIONS.map(o => [o.label, o.value]);

    this.appendDummyInput()
        .appendField("TIME")
        .appendField(new Blockly.FieldDropdown(options), "TIME_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip("Concrete time specification (when?)");
  }
};

// ============================================
// TimeChip - Aspectual (状態指定)
// ============================================
Blockly.Blocks['time_chip_aspectual'] = {
  init: function() {
    const options: [string, string][] = ASPECTUAL_OPTIONS.map(o => [o.label, o.value]);

    this.appendDummyInput()
        .appendField("ASPECT")
        .appendField(new Blockly.FieldDropdown(options), "ASPECT_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip("Aspectual marker (progressive, perfect, etc.)");
  }
};

// ============================================
// TimeChip - Abstract (抽象指定)
// ============================================
Blockly.Blocks['time_chip_abstract'] = {
  init: function() {
    const options: [string, string][] = ABSTRACT_OPTIONS.map(o => [o.label, o.value]);

    this.appendDummyInput()
        .appendField("MODIFIER")
        .appendField(new Blockly.FieldDropdown(options), "MODIFIER_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip("Abstract time modifier (affects verb conjugation only)");
  }
};

// ============================================
// Action ブロック（動的スロット生成）
// ============================================
Blockly.Blocks['verb'] = {
  init: function() {
    const verbOptions: [string, string][] = verbs.map(v => [v.lemma, v.lemma]);

    this.appendDummyInput()
        .appendField("ACTION")
        .appendField(new Blockly.FieldDropdown(verbOptions, this.updateShape.bind(this)), "VERB");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.action);
    this.setTooltip("Select an action (verb)");

    // 初期形状を設定
    this.updateShape(verbs[0]?.lemma || "run");
  },

  updateShape: function(verbLemma: string) {
    const verb = verbs.find(v => v.lemma === verbLemma);
    if (!verb) return verbLemma;

    // 既存のスロットを削除（ARG_で始まるものとADVERB）
    const existingInputs = this.inputList
      .filter((input: Blockly.Input) => input.name.startsWith("ARG_") || input.name === "ADVERB")
      .map((input: Blockly.Input) => input.name);

    existingInputs.forEach((name: string) => this.removeInput(name));

    // 新しいスロットを追加
    verb.valency.forEach((slot, index) => {
      const inputName = `ARG_${index}`;
      const label = slot.label || slot.role;
      const checkType = slot.role === 'attribute' ? ['noun', 'nounPhrase', 'adjective'] : ['noun', 'nounPhrase'];
      this.appendValueInput(inputName)
          .setCheck(checkType)
          .appendField(`${label}${slot.required ? '*' : ''}:`);
    });

    // 副詞スロットを最後に追加
    this.appendValueInput("ADVERB")
        .setCheck("adverb")
        .appendField("how:");

    return verbLemma;
  }
};

// ============================================
// 名詞句ブロック（レガシー）
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
// Person ブロック（代名詞・人名詞）
// ============================================
const personPronouns = pronouns.filter(p => p.type === 'personal' || !p.lemma.includes('thing'));
const personNouns = nouns.filter(n => n.category === 'human');

Blockly.Blocks['person_block'] = {
  init: function() {
    const pronounOptions: [string, string][] = personPronouns.map(p => [p.lemma, p.lemma]);
    const nounOptions: [string, string][] = personNouns.map(n => [n.lemma, n.lemma]);
    const allOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ["── Pronouns ──", "__label_pronouns__"],
      ...pronounOptions,
      ["── People ──", "__label_people__"],
      ...nounOptions,
    ];

    this.appendDummyInput()
        .appendField("PERSON")
        .appendField(new Blockly.FieldDropdown(allOptions), "PERSON_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.person);
    this.setTooltip("A person (pronoun or noun)");
  }
};

// ============================================
// Thing ブロック（物・抽象名詞）
// ============================================
const thingPronouns = pronouns.filter(p => p.lemma.includes('thing'));
const thingNouns = nouns.filter(n => n.category === 'thing' || n.category === 'abstract' || n.category === 'animal');

Blockly.Blocks['thing_block'] = {
  init: function() {
    const pronounOptions: [string, string][] = thingPronouns.map(p => [p.lemma, p.lemma]);
    const nounOptions: [string, string][] = thingNouns.map(n => [n.lemma, n.lemma]);
    const allOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ...pronounOptions.length > 0 ? [["── Pronouns ──", "__label_pronouns__"] as [string, string], ...pronounOptions] : [],
      ["── Things ──", "__label_things__"],
      ...nounOptions,
    ];

    this.appendDummyInput()
        .appendField("THING")
        .appendField(new Blockly.FieldDropdown(allOptions), "THING_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip("A thing (pronoun or noun)");
  }
};

// ============================================
// Place ブロック（場所名詞）
// ============================================
const placeNouns = nouns.filter(n => n.category === 'place');
const placeAdverbs = [
  { lemma: "here", value: "here" },
  { lemma: "there", value: "there" },
];

Blockly.Blocks['place_block'] = {
  init: function() {
    const nounOptions: [string, string][] = placeNouns.map(n => [n.lemma, n.lemma]);
    const adverbOptions: [string, string][] = placeAdverbs.map(a => [a.lemma, a.value]);
    const allOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ["── Place Adverbs ──", "__label_adverbs__"],
      ...adverbOptions,
      ["── Places ──", "__label_places__"],
      ...nounOptions,
    ];

    this.appendDummyInput()
        .appendField("PLACE")
        .appendField(new Blockly.FieldDropdown(allOptions), "PLACE_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.place);
    this.setTooltip("A place (noun or adverb)");
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
// 限定詞ブロック（ラッパー）
// ============================================
Blockly.Blocks['determiner_block'] = {
  init: function() {
    this.appendValueInput("NOUN")
        .setCheck(["noun", "nounPhrase"])
        .appendField("DET")
        .appendField(new Blockly.FieldDropdown([
          ["the", "the"],
          ["this", "this"],
          ["that", "that"],
        ]), "DET_VALUE");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.determiner);
    this.setTooltip("Determiner: specifies WHICH one (definite)");
  }
};

// ============================================
// 数量詞ブロック（ラッパー）
// ============================================
Blockly.Blocks['quantifier_block'] = {
  init: function() {
    const options: [string, string][] = QUANTIFIER_OPTIONS.map(o => [o.label, o.value]);

    this.appendValueInput("NOUN")
        .setCheck(["noun", "nounPhrase"])
        .appendField("QTY")
        .appendField(new Blockly.FieldDropdown(options), "QTY_VALUE");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.quantifier);
    this.setTooltip("Quantifier: specifies HOW MANY");
  }
};

// ============================================
// 形容詞ラッパーブロック（名詞修飾用）
// ============================================
Blockly.Blocks['adjective_wrapper'] = {
  init: function() {
    const adjOptions: [string, string][] = adjectives.map(a => [a.lemma, a.lemma]);

    this.appendValueInput("NOUN")
        .setCheck(["noun", "nounPhrase"])
        .appendField("ADJ")
        .appendField(new Blockly.FieldDropdown(adjOptions), "ADJ_VALUE");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.adjective);
    this.setTooltip("Adjective: modifies a noun");
  }
};

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
const MANNER_ADVERBS = adverbs.filter(a => a.type === 'manner');

// ============================================
// 否定ラッパーブロック（動詞修飾）
// ============================================
Blockly.Blocks['negation_wrapper'] = {
  init: function() {
    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField("NOT");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.negation);
    this.setTooltip("Negation: makes the action negative");
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
        .appendField("FREQ")
        .appendField(new Blockly.FieldDropdown(options), "FREQ_VALUE");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.frequency);
    this.setTooltip("Frequency: how often the action occurs");
  }
};

// ============================================
// 様態副詞ラッパーブロック（動詞修飾・外側のみ）
// ============================================
Blockly.Blocks['manner_wrapper'] = {
  init: function() {
    const options: [string, string][] = MANNER_ADVERBS.map(a => [a.lemma, a.lemma]);

    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField("MANNER")
        .appendField(new Blockly.FieldDropdown(options), "MANNER_VALUE");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.manner);
    this.setTooltip("Manner: how the action is performed (outer wrapper only)");
  }
};

// ============================================
// オプションのエクスポート（コンパイラ用）
// ============================================
export const TIME_CHIP_DATA = {
  concrete: CONCRETE_OPTIONS,
  aspectual: ASPECTUAL_OPTIONS,
  abstract: ABSTRACT_OPTIONS,
};

export const QUANTIFIER_DATA = QUANTIFIER_OPTIONS;

export const FREQUENCY_ADVERB_DATA = FREQUENCY_ADVERBS;

// ============================================
// ツールボックス定義
// ============================================
export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Time",
      colour: COLORS.timeFrame,
      contents: [
        { kind: "label", text: "── TimeFrame ──" },
        { kind: "block", type: "time_frame" },
        { kind: "label", text: "── Concrete ──" },
        { kind: "block", type: "time_chip_concrete" },
        { kind: "label", text: "── Aspectual ──" },
        { kind: "block", type: "time_chip_aspectual" },
        { kind: "label", text: "── Abstract ──" },
        { kind: "block", type: "time_chip_abstract" },
      ]
    },
    {
      kind: "category",
      name: "Actions",
      colour: COLORS.action,
      contents: [
        { kind: "block", type: "verb" },
      ]
    },
    {
      kind: "category",
      name: "Nouns",
      colour: COLORS.person,
      contents: [
        { kind: "block", type: "person_block" },
        { kind: "block", type: "thing_block" },
        { kind: "block", type: "place_block" },
      ]
    },
    {
      kind: "category",
      name: "Noun Modifiers",
      colour: COLORS.determiner,
      contents: [
        { kind: "block", type: "determiner_block" },
        { kind: "block", type: "quantifier_block" },
        { kind: "block", type: "adjective_wrapper" },
      ]
    },
    {
      kind: "category",
      name: "Verb Modifiers",
      colour: COLORS.frequency,
      contents: [
        { kind: "block", type: "negation_wrapper" },
        { kind: "block", type: "frequency_wrapper" },
        { kind: "block", type: "manner_wrapper" },
      ]
    },
  ]
};
