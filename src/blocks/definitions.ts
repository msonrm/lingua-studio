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
// 数量詞データ定義（レガシー）
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
// 統合限定詞データ定義
// ============================================
interface DeterminerOption {
  label: string;
  value: string;
  number?: GrammaticalNumber;  // 文法数への影響
  output: string | null;       // null = 出力なし
}

// 前置限定詞（predeterminer）
const PRE_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'all', value: 'all', number: 'plural', output: 'all' },
  { label: 'both', value: 'both', number: 'plural', output: 'both' },
  { label: 'half', value: 'half', output: 'half' },
];

// 中央限定詞（central determiner）
const CENTRAL_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'the', value: 'the', output: 'the' },
  { label: 'this', value: 'this', number: 'singular', output: 'this' },
  { label: 'that', value: 'that', number: 'singular', output: 'that' },
  { label: 'a/an', value: 'a', number: 'singular', output: 'a' },
  { label: 'my', value: 'my', output: 'my' },
  { label: 'your', value: 'your', output: 'your' },
  { label: 'no', value: 'no', output: 'no' },
];

// 後置限定詞（postdeterminer）
const POST_DETERMINERS: DeterminerOption[] = [
  { label: '─', value: '__none__', output: null },
  { label: 'one', value: 'one', number: 'singular', output: 'one' },
  { label: 'two', value: 'two', number: 'plural', output: 'two' },
  { label: 'three', value: 'three', number: 'plural', output: 'three' },
  { label: 'many', value: 'many', number: 'plural', output: 'many' },
  { label: 'few', value: 'few', number: 'plural', output: 'few' },
  { label: 'some', value: 'some', number: 'plural', output: 'some' },
  { label: 'several', value: 'several', number: 'plural', output: 'several' },
  { label: '[plural]', value: '__plural__', number: 'plural', output: null },
  { label: '[–]', value: '__uncountable__', number: 'uncountable', output: null },
];

// ============================================
// 制約ルール（双方向）
// ============================================
const DETERMINER_CONSTRAINTS = {
  // PRE が選ばれた場合、CENTRAL で選べないもの
  preBlocksCentral: {
    'all': ['a', 'no'],           // "all a student" ✗, "all no students" ✗
    'both': ['a', 'no', 'this', 'that'],  // "both a/this student" ✗ (both=2, this=1)
    'half': ['a', 'no'],          // "half a student" ✗ (half the=OK)
  } as Record<string, string[]>,

  // PRE が選ばれた場合、POST で選べないもの
  preBlocksPost: {
    'all': ['one'],               // "all the one" ✗ (数の不一致)
    'both': ['one', 'three', 'many', 'few', 'some', 'several'],  // both=2のみ
    'half': ['one'],              // "half the one" ✗
  } as Record<string, string[]>,

  // CENTRAL が選ばれた場合、PRE で選べないもの
  centralBlocksPre: {
    'a': ['all', 'both', 'half'],   // "all a student" ✗
    'no': ['all', 'both', 'half'],  // "all no students" ✗
    'this': ['both'],               // "both this student" ✗
    'that': ['both'],               // "both that student" ✗
  } as Record<string, string[]>,

  // CENTRAL が選ばれた場合、POST で選べないもの
  centralBlocksPost: {
    'a': ['one', 'two', 'three', 'many', 'few', 'some', 'several', '__plural__'],  // a + 数量詞 ✗
    'this': ['two', 'three', 'many', 'few', 'some', 'several', '__plural__'],  // this + 複数 ✗
    'that': ['two', 'three', 'many', 'few', 'some', 'several', '__plural__'],  // that + 複数 ✗
  } as Record<string, string[]>,

  // POST が選ばれた場合、PRE で選べないもの
  postBlocksPre: {
    'one': ['all', 'both', 'half'],     // "all the one" ✗
    'two': ['half'],                     // "half the two" is odd
    'three': ['both', 'half'],           // "both the three" ✗
    'many': ['both', 'half'],
    'few': ['both', 'half'],
    'some': ['both', 'half'],
    'several': ['both', 'half'],
    '__plural__': ['both'],              // "both the [plural]" is vague
  } as Record<string, string[]>,

  // POST が選ばれた場合、CENTRAL で選べないもの
  postBlocksCentral: {
    'one': ['a'],                        // "a one book" ✗ (冗長)
    'two': ['a', 'this', 'that'],        // "a/this two books" ✗
    'three': ['a', 'this', 'that'],
    'many': ['a', 'this', 'that'],
    'few': ['a', 'this', 'that'],        // 注: "a few" は例外的イディオム
    'some': ['a', 'this', 'that'],
    'several': ['a', 'this', 'that'],
    '__plural__': ['a', 'this', 'that'], // 数の不一致
  } as Record<string, string[]>,
};


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

    // 既存のスロットを削除（ARG_で始まるもの）
    const existingInputs = this.inputList
      .filter((input: Blockly.Input) => input.name.startsWith("ARG_"))
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

    // 副詞は Verb Modifiers (FREQ, MANNER) で対応

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
// 代名詞ブロック（限定詞不要）
// ============================================
const personalPronouns = pronouns.filter(p => p.type === 'personal');
const indefinitePronouns = pronouns.filter(p => p.type === 'indefinite');

Blockly.Blocks['pronoun_block'] = {
  init: function() {
    const personalOptions: [string, string][] = personalPronouns.map(p => [p.lemma, p.lemma]);
    const indefiniteOptions: [string, string][] = indefinitePronouns.map(p => [p.lemma, p.lemma]);
    const allOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ["── Personal ──", "__label_personal__"],
      ...personalOptions,
      ["── Indefinite ──", "__label_indefinite__"],
      ...indefiniteOptions,
    ];

    this.appendDummyInput()
        .appendField("PRONOUN")
        .appendField(new Blockly.FieldDropdown(allOptions), "PRONOUN_VALUE");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.person);
    this.setTooltip("A pronoun (I, you, he, someone, etc.) - no determiner needed");
  }
};

// ============================================
// 人間ブロック (human)
// ============================================
const humanNouns = nouns.filter(n => n.category === 'human' && !n.proper);
const humanProperNouns = nouns.filter(n => n.category === 'human' && n.proper);

Blockly.Blocks['human_block'] = {
  init: function() {
    const commonOptions: [string, string][] = humanNouns.map(n => [n.lemma, n.lemma]);
    const properOptions: [string, string][] = humanProperNouns.map(n => [n.lemma, n.lemma]);
    const nounOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ["── Common ──", "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [["── Names ──", "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    this.appendDummyInput()
        .appendField("HUMAN")
        .appendField(new Blockly.FieldDropdown(nounOptions), "HUMAN_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.person);
    this.setTooltip("A human (father, teacher, John, etc.)");
  }
};

// ============================================
// 動物ブロック (animal)
// ============================================
const animalNouns = nouns.filter(n => n.category === 'animal');

Blockly.Blocks['animal_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ...animalNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField("ANIMAL")
        .appendField(new Blockly.FieldDropdown(nounOptions), "ANIMAL_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip("An animal (cat, dog, bird, etc.)");
  }
};

// ============================================
// 物体ブロック (object)
// ============================================
const objectNouns = nouns.filter(n => n.category === 'object');

Blockly.Blocks['object_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ...objectNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField("OBJECT")
        .appendField(new Blockly.FieldDropdown(nounOptions), "OBJECT_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip("An object (apple, book, pen, water, etc.)");
  }
};

// ============================================
// 場所ブロック (place)
// ============================================
const placeNouns = nouns.filter(n => n.category === 'place' && !n.proper);
const placeProperNouns = nouns.filter(n => n.category === 'place' && n.proper);
const placeAdverbs = [
  { lemma: "here", value: "here" },
  { lemma: "there", value: "there" },
];

Blockly.Blocks['place_block'] = {
  init: function() {
    const commonOptions: [string, string][] = placeNouns.map(n => [n.lemma, n.lemma]);
    const properOptions: [string, string][] = placeProperNouns.map(n => [n.lemma, n.lemma]);
    const adverbOptions: [string, string][] = placeAdverbs.map(a => [a.lemma, a.value]);
    const nounOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ["── Adverbs ──", "__label_adverbs__"],
      ...adverbOptions,
      ["── Common ──", "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [["── Names ──", "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    this.appendDummyInput()
        .appendField("PLACE")
        .appendField(new Blockly.FieldDropdown(nounOptions), "PLACE_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.place);
    this.setTooltip("A place (park, school, Tokyo, here, etc.)");
  }
};

// ============================================
// 抽象概念ブロック (abstract)
// ============================================
const abstractNouns = nouns.filter(n => n.category === 'abstract');

Blockly.Blocks['abstract_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
      ["Select...", "__placeholder__"],
      ...abstractNouns.map(n => [n.lemma, n.lemma] as [string, string]),
    ];

    this.appendDummyInput()
        .appendField("ABSTRACT")
        .appendField(new Blockly.FieldDropdown(nounOptions), "ABSTRACT_VALUE");

    this.setOutput(true, "noun");
    this.setColour(COLORS.thing);
    this.setTooltip("An abstract concept (idea, love, music, etc.)");
  }
};

// ============================================
// レガシー互換：Person ブロック
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
// レガシー互換：Thing ブロック
// ============================================
const thingPronouns = pronouns.filter(p => p.lemma.includes('thing'));
const thingNouns = nouns.filter(n => n.category === 'object' || n.category === 'abstract' || n.category === 'animal');

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
// 統合限定詞ブロック（3つのプルダウン）
// ============================================
Blockly.Blocks['determiner_unified'] = {
  init: function() {
    // 動的オプション生成関数（開くたびに呼ばれる）
    const getPreOptions = (): [string, string][] => {
      const central = this.getFieldValue('CENTRAL') || '__none__';
      const post = this.getFieldValue('POST') || '__none__';

      return PRE_DETERMINERS
        .filter(o => {
          if (o.value === '__none__') return true;
          // CENTRAL がこの PRE をブロックしているか？
          const centralBlocks = DETERMINER_CONSTRAINTS.centralBlocksPre[central] || [];
          if (centralBlocks.includes(o.value)) return false;
          // POST がこの PRE をブロックしているか？
          const postBlocks = DETERMINER_CONSTRAINTS.postBlocksPre[post] || [];
          if (postBlocks.includes(o.value)) return false;
          return true;
        })
        .map(o => [o.label, o.value]);
    };

    const getCentralOptions = (): [string, string][] => {
      const pre = this.getFieldValue('PRE') || '__none__';
      const post = this.getFieldValue('POST') || '__none__';

      return CENTRAL_DETERMINERS
        .filter(o => {
          if (o.value === '__none__') return true;
          // PRE がこの CENTRAL をブロックしているか？
          const preBlocks = DETERMINER_CONSTRAINTS.preBlocksCentral[pre] || [];
          if (preBlocks.includes(o.value)) return false;
          // POST がこの CENTRAL をブロックしているか？
          const postBlocks = DETERMINER_CONSTRAINTS.postBlocksCentral[post] || [];
          if (postBlocks.includes(o.value)) return false;
          return true;
        })
        .map(o => [o.label, o.value]);
    };

    const getPostOptions = (): [string, string][] => {
      const pre = this.getFieldValue('PRE') || '__none__';
      const central = this.getFieldValue('CENTRAL') || '__none__';

      return POST_DETERMINERS
        .filter(o => {
          if (o.value === '__none__') return true;
          // PRE がこの POST をブロックしているか？
          const preBlocks = DETERMINER_CONSTRAINTS.preBlocksPost[pre] || [];
          if (preBlocks.includes(o.value)) return false;
          // CENTRAL がこの POST をブロックしているか？
          const centralBlocks = DETERMINER_CONSTRAINTS.centralBlocksPost[central] || [];
          if (centralBlocks.includes(o.value)) return false;
          return true;
        })
        .map(o => [o.label, o.value]);
    };

    // プルダウンの参照を保持（動的オプション生成）
    const preDropdown = new Blockly.FieldDropdown(getPreOptions, this.validatePre.bind(this));
    const centralDropdown = new Blockly.FieldDropdown(getCentralOptions, this.validateCentral.bind(this));
    const postDropdown = new Blockly.FieldDropdown(getPostOptions, this.validatePost.bind(this));

    this.appendValueInput("NOUN")
        .setCheck(["noun", "nounPhrase"])
        .appendField("DET")
        .appendField(preDropdown, "PRE")
        .appendField(centralDropdown, "CENTRAL")
        .appendField(postDropdown, "POST");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.determiner);
    this.setTooltip("Determiner: pre + central + post (e.g., 'all the two')");
  },

  // Pre選択時のバリデーション
  validatePre: function(newValue: string): string | null {
    if (newValue === '__none__') return newValue;

    const central = this.getFieldValue('CENTRAL');
    const post = this.getFieldValue('POST');

    // CENTRAL がこの PRE をブロックしているか？
    const centralBlocks = DETERMINER_CONSTRAINTS.centralBlocksPre[central] || [];
    if (centralBlocks.includes(newValue)) {
      // CENTRAL をリセット
      setTimeout(() => {
        if (this.getField('CENTRAL')) {
          this.setFieldValue('__none__', 'CENTRAL');
        }
      }, 0);
    }

    // POST がこの PRE をブロックしているか？
    const postBlocks = DETERMINER_CONSTRAINTS.postBlocksPre[post] || [];
    if (postBlocks.includes(newValue)) {
      // POST をリセット
      setTimeout(() => {
        if (this.getField('POST')) {
          this.setFieldValue('__none__', 'POST');
        }
      }, 0);
    }

    return newValue;
  },

  // Central選択時のバリデーション
  validateCentral: function(newValue: string): string | null {
    if (newValue === '__none__') return newValue;

    const pre = this.getFieldValue('PRE');
    const post = this.getFieldValue('POST');

    // PRE がこの CENTRAL をブロックしているか？
    const preBlocks = DETERMINER_CONSTRAINTS.preBlocksCentral[pre] || [];
    if (preBlocks.includes(newValue)) {
      // PRE をリセット
      setTimeout(() => {
        if (this.getField('PRE')) {
          this.setFieldValue('__none__', 'PRE');
        }
      }, 0);
    }

    // POST がこの CENTRAL をブロックしているか？
    const postBlocks = DETERMINER_CONSTRAINTS.postBlocksCentral[post] || [];
    if (postBlocks.includes(newValue)) {
      // POST をリセット
      setTimeout(() => {
        if (this.getField('POST')) {
          this.setFieldValue('__none__', 'POST');
        }
      }, 0);
    }

    return newValue;
  },

  // Post選択時のバリデーション
  validatePost: function(newValue: string): string | null {
    if (newValue === '__none__') return newValue;

    const pre = this.getFieldValue('PRE');
    const central = this.getFieldValue('CENTRAL');

    // PRE がこの POST をブロックしているか？
    const preBlocks = DETERMINER_CONSTRAINTS.preBlocksPost[pre] || [];
    if (preBlocks.includes(newValue)) {
      // PRE をリセット
      setTimeout(() => {
        if (this.getField('PRE')) {
          this.setFieldValue('__none__', 'PRE');
        }
      }, 0);
    }

    // CENTRAL がこの POST をブロックしているか？
    const centralBlocks = DETERMINER_CONSTRAINTS.centralBlocksPost[central] || [];
    if (centralBlocks.includes(newValue)) {
      // CENTRAL をリセット
      setTimeout(() => {
        if (this.getField('CENTRAL')) {
          this.setFieldValue('__none__', 'CENTRAL');
        }
      }, 0);
    }

    return newValue;
  },
};

// ============================================
// 限定詞ブロック（レガシー・ラッパー）
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
// 数量詞ブロック（レガシー・ラッパー）
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
// 様態副詞ラッパーブロック（動詞修飾）
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
    this.setTooltip("Manner: how the action is performed");
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

export const DETERMINER_DATA = {
  pre: PRE_DETERMINERS,
  central: CENTRAL_DETERMINERS,
  post: POST_DETERMINERS,
  constraints: DETERMINER_CONSTRAINTS,
};

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
        { kind: "label", text: "── 代名詞 ──" },
        { kind: "block", type: "pronoun_block" },
        { kind: "label", text: "── 人 ──" },
        {
          kind: "block",
          type: "determiner_unified",
          inputs: {
            NOUN: {
              block: { type: "human_block" }
            }
          },
          fields: {
            PRE: "__none__",
            CENTRAL: "a",
            POST: "__none__"
          }
        },
        { kind: "label", text: "── 生き物 ──" },
        {
          kind: "block",
          type: "determiner_unified",
          inputs: {
            NOUN: {
              block: { type: "animal_block" }
            }
          },
          fields: {
            PRE: "__none__",
            CENTRAL: "a",
            POST: "__none__"
          }
        },
        { kind: "label", text: "── もの ──" },
        {
          kind: "block",
          type: "determiner_unified",
          inputs: {
            NOUN: {
              block: { type: "object_block" }
            }
          },
          fields: {
            PRE: "__none__",
            CENTRAL: "a",
            POST: "__none__"
          }
        },
        { kind: "label", text: "── 場所 ──" },
        {
          kind: "block",
          type: "determiner_unified",
          inputs: {
            NOUN: {
              block: { type: "place_block" }
            }
          },
          fields: {
            PRE: "__none__",
            CENTRAL: "the",
            POST: "__none__"
          }
        },
        { kind: "label", text: "── 抽象 ──" },
        {
          kind: "block",
          type: "determiner_unified",
          inputs: {
            NOUN: {
              block: { type: "abstract_block" }
            }
          },
          fields: {
            PRE: "__none__",
            CENTRAL: "a",
            POST: "__none__"
          }
        },
      ]
    },
    {
      kind: "category",
      name: "Noun Modifiers",
      colour: COLORS.determiner,
      contents: [
        { kind: "block", type: "determiner_unified" },
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
