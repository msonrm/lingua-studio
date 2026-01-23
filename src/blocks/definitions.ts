import * as Blockly from 'blockly';
import { nouns, adjectives, adverbs, pronouns, findNoun, getVerbsByCategory } from '../data/dictionary';
import type { VerbCategory } from '../types/schema';

// ============================================
// 色の定義（モンテッソーリベース）
// ============================================
const COLORS = {
  // Sentence系（中立・ブラウン系）
  timeFrame: '#5D4E37',  // 暖かみのあるブラウン
  timeChip: '#8B7355',   // 明るめのブラウン

  // Verb系（暖色・赤系グラデーション）
  action: '#DC143C',     // クリムゾンレッド（モンテッソーリ）
  negation: '#E53935',   // 明るい赤
  frequency: '#EF5350',  // さらに明るい赤
  manner: '#EF6C57',     // 赤オレンジ

  // Verb カテゴリ別（モンテッソーリ: 動詞=赤で統一）
  verbMotion: '#DC143C',        // 移動
  verbAction: '#DC143C',        // 動作
  verbTransfer: '#DC143C',      // 授受
  verbCognition: '#DC143C',     // 認知
  verbCommunication: '#DC143C', // 伝達
  verbState: '#DC143C',         // 状態

  // Noun系（寒色・黒〜青系グラデーション）
  person: '#0d1321',     // ほぼ黒（モンテッソーリ）
  thing: '#0d1321',      // ほぼ黒（モンテッソーリ）
  place: '#0d1321',      // ほぼ黒（モンテッソーリ）
  noun: '#0d1321',       // ほぼ黒（統一）

  // Noun Modifier系（寒色・ネイビー系グラデーション）
  determiner: '#1a365d', // ダークネイビー
  adjective: '#2c5282',  // ネイビー
  quantifier: '#2b4c7e', // ネイビー（中間）
  prepNoun: '#3c6e91',   // 明るめネイビー（名詞用前置詞）

  // Verb Modifier系の前置詞
  prepVerb: '#C0392B',   // 暗めの赤（動詞用前置詞）

  // Coordination（等位接続）- 紫系（論理演算のイメージ）
  coordNoun: '#6B5B95',   // ダスティパープル（名詞用）
  coordVerb: '#9B4D8B',   // マゼンタ寄り紫（動詞用）

  // レガシー
  adverb: '#EF6C57',     // 赤オレンジ（様態副詞と同系）
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
  { label: 'Yesterday', value: 'yesterday', tense: 'past', aspect: 'simple' },
  { label: 'Tomorrow', value: 'tomorrow', tense: 'future', aspect: 'simple' },
  { label: 'Every day', value: 'every_day', tense: 'present', aspect: 'simple' },
  { label: 'Last Sunday', value: 'last_sunday', tense: 'past', aspect: 'simple' },
  { label: 'Right now', value: 'right_now', tense: 'present', aspect: 'progressive' },
  { label: 'Next week', value: 'next_week', tense: 'future', aspect: 'simple' },
];

const ASPECTUAL_OPTIONS: TimeChipOption[] = [
  { label: 'Now', value: 'now', tense: 'present', aspect: 'progressive' },
  { label: 'Just now', value: 'just_now', tense: 'past', aspect: 'perfect' },
  { label: 'Already/Yet', value: 'completion', tense: 'inherit', aspect: 'perfect' },
  { label: 'Still', value: 'still', tense: 'inherit', aspect: 'progressive' },
  { label: 'Recently', value: 'recently', tense: 'past', aspect: 'perfect' },
];

const ABSTRACT_OPTIONS: TimeChipOption[] = [
  { label: '[Past]', value: 'past', tense: 'past', aspect: 'inherit' },
  { label: '[Future]', value: 'future', tense: 'future', aspect: 'inherit' },
  { label: '[Current]', value: 'current', tense: 'present', aspect: 'inherit' },
  { label: '[-ing]', value: 'progressive', tense: 'inherit', aspect: 'progressive' },
  { label: '[Perfect]', value: 'perfect', tense: 'inherit', aspect: 'perfect' },
];

// ============================================
// 統合限定詞データ定義
// ============================================
type GrammaticalNumber = 'singular' | 'plural' | 'uncountable';

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
    'all': ['a', 'no'],
    'both': ['a', 'no', 'this', 'that'],
    'half': ['a', 'no'],
  } as Record<string, string[]>,

  // PRE が選ばれた場合、POST で選べないもの
  preBlocksPost: {
    'all': ['one'],
    'both': ['one', 'three', 'many', 'few', 'some', 'several'],
    'half': ['one'],
  } as Record<string, string[]>,

  // CENTRAL が選ばれた場合、PRE で選べないもの
  centralBlocksPre: {
    'a': ['all', 'both', 'half'],
    'no': ['all', 'both', 'half'],
    'this': ['both'],
    'that': ['both'],
  } as Record<string, string[]>,

  // CENTRAL が選ばれた場合、POST で選べないもの
  // 注意: "a few" は有効な英語表現なので 'few' は許可
  centralBlocksPost: {
    'a': ['one', 'two', 'three', 'many', 'some', 'several', '__plural__'],
    'this': ['two', 'three', 'many', 'few', 'some', 'several', '__plural__'],
    'that': ['two', 'three', 'many', 'few', 'some', 'several', '__plural__'],
  } as Record<string, string[]>,

  // POST が選ばれた場合、PRE で選べないもの
  postBlocksPre: {
    'one': ['all', 'both', 'half'],
    'two': ['half'],
    'three': ['both', 'half'],
    'many': ['both', 'half'],
    'few': ['both', 'half'],
    'some': ['both', 'half'],
    'several': ['both', 'half'],
    '__plural__': ['both'],
  } as Record<string, string[]>,

  // POST が選ばれた場合、CENTRAL で選べないもの
  // 注意: "a few" は有効な英語表現なので 'few' + 'a' は許可
  postBlocksCentral: {
    'one': ['a'],
    'two': ['a', 'this', 'that'],
    'three': ['a', 'this', 'that'],
    'many': ['a', 'this', 'that'],
    'few': ['this', 'that'],
    'some': ['a', 'this', 'that'],
    'several': ['a', 'this', 'that'],
    '__plural__': ['a', 'this', 'that'],
  } as Record<string, string[]>,
};

// ============================================
// TimeFrame ブロック（ルート）
// ============================================
Blockly.Blocks['time_frame'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("SENTENCE");
    this.appendValueInput("TIME_CHIP")
        .setCheck("timeChip")
        .appendField("T/A:");
    this.appendStatementInput("ACTION")
        .setCheck("verb")
        .appendField("predicate:");
    this.setColour(COLORS.timeFrame);
    this.setTooltip("The root of a sentence, specifying tense and aspect");
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
        .appendField("TENSE/ASPECT")
        .appendField(new Blockly.FieldDropdown(options), "MODIFIER_VALUE");
    this.setOutput(true, "timeChip");
    this.setColour(COLORS.timeChip);
    this.setTooltip("Tense/aspect modifier (affects verb conjugation)");
  }
};

// ============================================
// カテゴリ別動詞ブロック
// ============================================
const VERB_CATEGORY_CONFIG: Record<VerbCategory, { label: string; color: string }> = {
  motion: { label: 'MOTION', color: COLORS.verbMotion },
  action: { label: 'ACTION', color: COLORS.verbAction },
  transfer: { label: 'TRANSFER', color: COLORS.verbTransfer },
  cognition: { label: 'COGNITION', color: COLORS.verbCognition },
  communication: { label: 'COMMUNICATION', color: COLORS.verbCommunication },
  state: { label: 'STATE', color: COLORS.verbState },
};

// カテゴリ別動詞ブロック生成関数
function createVerbCategoryBlock(category: VerbCategory) {
  const config = VERB_CATEGORY_CONFIG[category];
  const categoryVerbs = getVerbsByCategory(category);

  Blockly.Blocks[`verb_${category}`] = {
    init: function() {
      const verbOptions: [string, string][] = categoryVerbs.map(v => [v.lemma, v.lemma]);

      this.appendDummyInput()
          .appendField(config.label)
          .appendField(new Blockly.FieldDropdown(verbOptions, this.updateShape.bind(this)), "VERB");

      this.setPreviousStatement(true, "verb");
      this.setColour(config.color);
      this.setTooltip(`${config.label} verb`);

      // 初期形状を設定
      if (categoryVerbs.length > 0) {
        this.updateShape(categoryVerbs[0].lemma);
      }
    },

    updateShape: function(verbLemma: string) {
      const verb = categoryVerbs.find(v => v.lemma === verbLemma);
      if (!verb) return verbLemma;

      // 既存のスロットを削除（ARG_で始まるもの）
      const existingInputs = this.inputList
        .filter((input: Blockly.Input) => input.name.startsWith("ARG_"))
        .map((input: Blockly.Input) => input.name);

      existingInputs.forEach((name: string) => this.removeInput(name));

      // 新しいスロットを追加
      verb.valency.forEach((slot: { role: string; label?: string; required: boolean }, index: number) => {
        const inputName = `ARG_${index}`;
        const label = slot.label || slot.role;
        const checkType = slot.role === 'attribute' ? ['noun', 'nounPhrase', 'adjective', 'coordinatedNounPhrase'] : ['noun', 'nounPhrase', 'coordinatedNounPhrase'];
        const displayLabel = slot.required ? `${label}:` : `(${label}):`;
        this.appendValueInput(inputName)
            .setCheck(checkType)
            .appendField(displayLabel);
      });

      return verbLemma;
    }
  };
}

// 6カテゴリの動詞ブロックを生成
(['motion', 'action', 'transfer', 'cognition', 'communication', 'state'] as VerbCategory[]).forEach(createVerbCategoryBlock);

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
      ["── Personal ──", "__label_personal__"],
      ...personalOptions,
      ["── Indefinite ──", "__label_indefinite__"],
      ...indefiniteOptions,
    ];

    this.appendDummyInput()
        .appendField("PRONOUN")
        .appendField(new Blockly.FieldDropdown(allOptions), "PRONOUN_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (personalOptions.length > 0) {
      this.setFieldValue(personalOptions[0][1], "PRONOUN_VALUE");
    }

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
      ["── Common ──", "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [["── Names ──", "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    this.appendDummyInput()
        .appendField("HUMAN")
        .appendField(new Blockly.FieldDropdown(nounOptions), "HUMAN_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (commonOptions.length > 0) {
      this.setFieldValue(commonOptions[0][1], "HUMAN_VALUE");
    }

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
// 場所副詞 (here, there) は一時削除 - 限定詞との相性問題のため

Blockly.Blocks['place_block'] = {
  init: function() {
    const commonOptions: [string, string][] = placeNouns.map(n => [n.lemma, n.lemma]);
    const properOptions: [string, string][] = placeProperNouns.map(n => [n.lemma, n.lemma]);
    const nounOptions: [string, string][] = [
      ["── Common ──", "__label_common__"],
      ...commonOptions,
      ...(properOptions.length > 0 ? [["── Names ──", "__label_proper__"] as [string, string], ...properOptions] : []),
    ];

    this.appendDummyInput()
        .appendField("PLACE")
        .appendField(new Blockly.FieldDropdown(nounOptions), "PLACE_VALUE");

    // デフォルト値を最初の実際の項目に設定
    if (commonOptions.length > 0) {
      this.setFieldValue(commonOptions[0][1], "PLACE_VALUE");
    }

    this.setOutput(true, "noun");
    this.setColour(COLORS.place);
    this.setTooltip("A place (park, school, Tokyo, etc.)");
  }
};

// ============================================
// 抽象概念ブロック (abstract)
// ============================================
const abstractNouns = nouns.filter(n => n.category === 'abstract');

Blockly.Blocks['abstract_block'] = {
  init: function() {
    const nounOptions: [string, string][] = [
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
// 統合限定詞ブロック（3つのプルダウン）- 動的ラベル版
// ============================================
Blockly.Blocks['determiner_unified'] = {
  init: function() {
    const block = this;

    // 接続された名詞のプロパティを取得
    const getConnectedNounInfo = (): { countable: boolean; proper: boolean } | null => {
      const nounInput = block.getInput('NOUN');
      if (!nounInput) return null;
      const connection = nounInput.connection;
      if (!connection || !connection.targetBlock()) return null;
      const targetBlock = connection.targetBlock();
      if (!targetBlock) return null;

      const fieldMap: Record<string, string> = {
        'human_block': 'HUMAN_VALUE',
        'animal_block': 'ANIMAL_VALUE',
        'object_block': 'OBJECT_VALUE',
        'place_block': 'PLACE_VALUE',
        'abstract_block': 'ABSTRACT_VALUE',
      };
      const fieldName = fieldMap[targetBlock.type];
      if (!fieldName) return null;
      const nounLemma = targetBlock.getFieldValue(fieldName);
      if (!nounLemma || nounLemma.startsWith('__')) return null;
      const nounEntry = findNoun(nounLemma);
      if (!nounEntry) return null;
      return { countable: nounEntry.countable, proper: nounEntry.proper === true };
    };

    // 無効マーク付きラベルを生成
    const markInvalid = (label: string) => `× ${label}`;

    // PRE オプション生成（クリック時に呼ばれる）
    const getPreOptions = (): [string, string][] => {
      const central = block.getFieldValue('CENTRAL') || '__none__';
      const post = block.getFieldValue('POST') || '__none__';
      const nounInfo = getConnectedNounInfo();

      return PRE_DETERMINERS.map(o => {
        if (o.value === '__none__') return [o.label, o.value];

        // 固有名詞：全て無効
        if (nounInfo?.proper) return [markInvalid(o.label), o.value];
        // 不可算名詞：both/half 無効
        if (nounInfo && !nounInfo.countable && (o.value === 'both' || o.value === 'half')) {
          return [markInvalid(o.label), o.value];
        }
        // CENTRAL による制約
        if (DETERMINER_CONSTRAINTS.centralBlocksPre[central]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        // POST による制約
        if (DETERMINER_CONSTRAINTS.postBlocksPre[post]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        return [o.label, o.value];
      });
    };

    // CENTRAL オプション生成
    const getCentralOptions = (): [string, string][] => {
      const pre = block.getFieldValue('PRE') || '__none__';
      const post = block.getFieldValue('POST') || '__none__';
      const nounInfo = getConnectedNounInfo();

      return CENTRAL_DETERMINERS.map(o => {
        if (o.value === '__none__') return [o.label, o.value];

        // 固有名詞：全て無効
        if (nounInfo?.proper) return [markInvalid(o.label), o.value];
        // 不可算名詞：a/an 無効
        if (nounInfo && !nounInfo.countable && o.value === 'a') {
          return [markInvalid(o.label), o.value];
        }
        // PRE による制約
        if (DETERMINER_CONSTRAINTS.preBlocksCentral[pre]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        // POST による制約
        if (DETERMINER_CONSTRAINTS.postBlocksCentral[post]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        return [o.label, o.value];
      });
    };

    // POST オプション生成
    const getPostOptions = (): [string, string][] => {
      const pre = block.getFieldValue('PRE') || '__none__';
      const central = block.getFieldValue('CENTRAL') || '__none__';
      const nounInfo = getConnectedNounInfo();
      const countableOnly = ['one', 'two', 'three', 'many', 'few', 'several', '__plural__'];

      return POST_DETERMINERS.map(o => {
        if (o.value === '__none__') return [o.label, o.value];

        // 固有名詞：全て無効
        if (nounInfo?.proper) return [markInvalid(o.label), o.value];
        // 不可算名詞：数量詞無効
        if (nounInfo && !nounInfo.countable && countableOnly.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        // PRE による制約
        if (DETERMINER_CONSTRAINTS.preBlocksPost[pre]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        // CENTRAL による制約
        if (DETERMINER_CONSTRAINTS.centralBlocksPost[central]?.includes(o.value)) {
          return [markInvalid(o.label), o.value];
        }
        return [o.label, o.value];
      });
    };

    // バリデータ：無効なオプション（×マーク付き）を選んだら拒否
    const createValidator = (getOptions: () => [string, string][]) => {
      return function(newValue: string) {
        const options = getOptions();
        const selected = options.find(([, v]) => v === newValue);
        if (selected && selected[0].startsWith('×')) {
          return null;  // 選択を拒否
        }
        return newValue;
      };
    };

    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective"])  // nounまたは形容詞付き名詞
        .appendField("DET")
        .appendField(new Blockly.FieldDropdown(getPreOptions, createValidator(getPreOptions)), "PRE")
        .appendField(new Blockly.FieldDropdown(getCentralOptions, createValidator(getCentralOptions)), "CENTRAL")
        .appendField(new Blockly.FieldDropdown(getPostOptions, createValidator(getPostOptions)), "POST");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.determiner);
    this.setTooltip("Determiner: pre + central + post (× = 選択不可)");

    // 名詞情報取得関数を保存（onchangeで使用）
    this._getConnectedNounInfo = getConnectedNounInfo;
  },

  // 接続変更・名詞変更時に無効な値をリセット
  onchange: function(e: Blockly.Events.Abstract) {
    if (!this.workspace) return;

    // 接続された名詞ブロックを取得
    const nounInput = this.getInput('NOUN');
    const connectedBlock = nounInput?.connection?.targetBlock();

    // BLOCK_MOVE: ブロック接続/切断
    // BLOCK_CHANGE: 接続中の名詞ブロック内のドロップダウン変更
    const isRelevantEvent =
      e.type === Blockly.Events.BLOCK_MOVE ||
      (e.type === Blockly.Events.BLOCK_CHANGE &&
       connectedBlock &&
       (e as Blockly.Events.BlockChange).blockId === connectedBlock.id);

    if (!isRelevantEvent) return;

    const nounInfo = this._getConnectedNounInfo?.();
    if (!nounInfo) return;

    const countableOnly = ['one', 'two', 'three', 'many', 'few', 'several', '__plural__'];

    // 固有名詞：全てリセット
    if (nounInfo.proper) {
      if (this.getFieldValue('PRE') !== '__none__') {
        this.setFieldValue('__none__', 'PRE');
      }
      if (this.getFieldValue('CENTRAL') !== '__none__') {
        this.setFieldValue('__none__', 'CENTRAL');
      }
      if (this.getFieldValue('POST') !== '__none__') {
        this.setFieldValue('__none__', 'POST');
      }
      return;
    }

    // 不可算名詞：無効な値をリセット
    if (!nounInfo.countable) {
      const pre = this.getFieldValue('PRE');
      if (pre === 'both' || pre === 'half') {
        this.setFieldValue('__none__', 'PRE');
      }
      if (this.getFieldValue('CENTRAL') === 'a') {
        this.setFieldValue('__none__', 'CENTRAL');
      }
      const post = this.getFieldValue('POST');
      if (countableOnly.includes(post)) {
        this.setFieldValue('__none__', 'POST');
      }
    }
  },
};

// ============================================
// 形容詞ラッパーブロック（名詞修飾用）
// ============================================
Blockly.Blocks['adjective_wrapper'] = {
  init: function() {
    const adjOptions: [string, string][] = adjectives.map(a => [a.lemma, a.lemma]);

    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective"])  // nounまたは形容詞付き名詞のみ
        .appendField("ADJ")
        .appendField(new Blockly.FieldDropdown(adjOptions), "ADJ_VALUE");

    this.setOutput(true, "adjective");  // 形容詞付き名詞として出力
    this.setColour(COLORS.adjective);
    this.setTooltip("Adjective: modifies a noun (place before DET)");
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
// 前置詞データ定義
// ============================================
const PREPOSITIONS = {
  // 場所
  location: [
    { label: 'in', value: 'in' },
    { label: 'on', value: 'on' },
    { label: 'at', value: 'at' },
    { label: 'under', value: 'under' },
    { label: 'behind', value: 'behind' },
  ],
  // 方向・起点
  direction: [
    { label: 'to', value: 'to' },
    { label: 'from', value: 'from' },
    { label: 'into', value: 'into' },
  ],
  // 関係
  relation: [
    { label: 'with', value: 'with' },
    { label: 'of', value: 'of' },
    { label: 'for', value: 'for' },
    { label: 'about', value: 'about' },
  ],
};

const ALL_PREPOSITIONS: [string, string][] = [
  ...PREPOSITIONS.location,
  ...PREPOSITIONS.direction,
  ...PREPOSITIONS.relation,
].map(p => [p.label, p.value]);

// ============================================
// 前置詞ブロック（動詞用）- PP (VERB)
// ============================================
Blockly.Blocks['preposition_verb'] = {
  init: function() {
    this.appendStatementInput("VERB")
        .setCheck("verb")
        .appendField("PP")
        .appendField(new Blockly.FieldDropdown(ALL_PREPOSITIONS), "PREP_VALUE");

    this.appendValueInput("OBJECT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField("object:");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.prepVerb);
    this.setTooltip("Prepositional Phrase (Verb): adds a prepositional phrase to a verb");
  }
};

// ============================================
// 前置詞ブロック（名詞用）- PP (NOUN)
// ============================================
Blockly.Blocks['preposition_noun'] = {
  init: function() {
    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective", "nounPhrase"])
        .appendField("PP")
        .appendField(new Blockly.FieldDropdown(ALL_PREPOSITIONS), "PREP_VALUE");

    this.appendValueInput("OBJECT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField("object:");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.prepNoun);
    this.setTooltip("Prepositional Phrase (Noun): modifies a noun with a prepositional phrase");
  }
};

// ============================================
// 等位接続ブロック（名詞用）- AND (NOUN)
// ============================================
Blockly.Blocks['coordination_noun_and'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField("AND");

    this.appendValueInput("RIGHT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"]);

    this.setOutput(true, "coordinatedNounPhrase");
    this.setColour(COLORS.coordNoun);
    this.setTooltip("Coordination (Noun): connects two noun phrases with AND");
  }
};

// ============================================
// 等位接続ブロック（名詞用）- OR (NOUN)
// ============================================
Blockly.Blocks['coordination_noun_or'] = {
  init: function() {
    this.appendValueInput("LEFT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"])
        .appendField("OR");

    this.appendValueInput("RIGHT")
        .setCheck(["noun", "adjective", "nounPhrase", "coordinatedNounPhrase"]);

    this.setOutput(true, "coordinatedNounPhrase");
    this.setColour(COLORS.coordNoun);
    this.setTooltip("Coordination (Noun): connects two noun phrases with OR");
  }
};

// ============================================
// 等位接続ブロック（動詞用）- AND (VERB)
// ============================================
Blockly.Blocks['coordination_verb_and'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck("verb")
        .appendField("AND");

    this.appendStatementInput("RIGHT")
        .setCheck("verb");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.coordVerb);
    this.setTooltip("Coordination (Verb): connects two verb phrases with AND");
  }
};

// ============================================
// 等位接続ブロック（動詞用）- OR (VERB)
// ============================================
Blockly.Blocks['coordination_verb_or'] = {
  init: function() {
    this.appendStatementInput("LEFT")
        .setCheck("verb")
        .appendField("OR");

    this.appendStatementInput("RIGHT")
        .setCheck("verb");

    this.setPreviousStatement(true, "verb");
    this.setColour(COLORS.coordVerb);
    this.setTooltip("Coordination (Verb): connects two verb phrases with OR");
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

export const DETERMINER_DATA = {
  pre: PRE_DETERMINERS,
  central: CENTRAL_DETERMINERS,
  post: POST_DETERMINERS,
};

export const FREQUENCY_ADVERB_DATA = FREQUENCY_ADVERBS;

export const PREPOSITION_DATA = PREPOSITIONS;

// ============================================
// ツールボックス定義
// ============================================
export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Sentence",
      colour: COLORS.timeFrame,
      contents: [
        { kind: "label", text: "── Sentence ──" },
        { kind: "block", type: "time_frame" },
        { kind: "label", text: "── Time ──" },
        { kind: "block", type: "time_chip_concrete" },
        { kind: "label", text: "── Aspect ──" },
        { kind: "block", type: "time_chip_aspectual" },
        { kind: "label", text: "── Tense/Aspect ──" },
        { kind: "block", type: "time_chip_abstract" },
      ]
    },
    {
      kind: "category",
      name: "Verbs",
      colour: COLORS.action,
      contents: [
        { kind: "label", text: "── Motion ──" },
        { kind: "block", type: "verb_motion" },
        { kind: "label", text: "── Action ──" },
        { kind: "block", type: "verb_action" },
        { kind: "label", text: "── Transfer ──" },
        { kind: "block", type: "verb_transfer" },
        { kind: "label", text: "── Cognition ──" },
        { kind: "block", type: "verb_cognition" },
        { kind: "label", text: "── Communication ──" },
        { kind: "block", type: "verb_communication" },
        { kind: "label", text: "── State ──" },
        { kind: "block", type: "verb_state" },
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
        { kind: "block", type: "preposition_verb" },
        { kind: "label", text: "── Coordination ──" },
        { kind: "block", type: "coordination_verb_and" },
        { kind: "block", type: "coordination_verb_or" },
      ]
    },
    {
      kind: "category",
      name: "Nouns",
      colour: COLORS.person,
      contents: [
        { kind: "label", text: "── Pronouns ──" },
        { kind: "block", type: "pronoun_block" },
        { kind: "label", text: "── People ──" },
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
        { kind: "label", text: "── Animals ──" },
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
        { kind: "label", text: "── Objects ──" },
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
        { kind: "label", text: "── Places ──" },
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
        { kind: "label", text: "── Abstract ──" },
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
        { kind: "block", type: "preposition_noun" },
        { kind: "label", text: "── Coordination ──" },
        { kind: "block", type: "coordination_noun_and" },
        { kind: "block", type: "coordination_noun_or" },
      ]
    },
  ]
};
