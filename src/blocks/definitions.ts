import * as Blockly from 'blockly';
import { nounCores, adjectiveCores, adverbCores, pronounCores, verbCores } from '../data/dictionary-core';
import type { VerbCategory, AdjectiveCategory } from '../types/schema';
import {
  PRE_DETERMINERS,
  CENTRAL_DETERMINERS,
  getPostDeterminers,
  NOUN_TYPE_CONSTRAINTS,
  applyExclusionRules,
  isExcludedByOthers,
  calculateNounTypeValues,
  type DetField,
  type NounType,
  type DeterminerOption,
} from './det-rules-en';

// ============================================
// ヘルパー関数（dictionary-core.ts ベース）
// ============================================
const findNounCore = (lemma: string) => nounCores.find(n => n.lemma === lemma);
const getVerbCoresByCategory = (category: VerbCategory) => verbCores.filter(v => v.category === category);

// ============================================
// ドロップダウンラベル用バリデーター
// ラベル行（__label_で始まる値）の選択を防ぐ
// ============================================
const labelValidator = (newValue: string): string | null => {
  if (newValue.startsWith('__label_')) {
    return null;  // 選択を拒否
  }
  return newValue;
};

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
  locative: '#F08C70',   // 明るい赤オレンジ（場所副詞）

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

  // Sentence Wrapper系（紫系グラデーション - 外側ほど濃い）
  imperative: '#4A148C',  // 濃紫（最外側）
  modal: '#9C27B0',       // 薄紫（内側）

  // Logic系（青緑系 - 論理・科学のイメージ）
  logic: '#00695C',       // ティール（fact, AND, OR, NOT）
  logicOp: '#00897B',     // 明るいティール（ブール演算子）

  // レガシー
  adverb: '#EF6C57',     // 赤オレンジ（様態副詞と同系）
};

// ============================================
// ヘルパー関数: Blockly.Msg から取得（フォールバック付き）
// ============================================
function msg(key: string, fallback: string): string {
  return Blockly.Msg[key] || fallback;
}

// ============================================
// TimeChip データ定義
// ============================================
type Tense = 'past' | 'present' | 'future' | 'inherit';
type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive' | 'inherit';

interface TimeChipOption {
  msgKey: string;
  fallback: string;
  value: string;
  tense: Tense;
  aspect: Aspect;
}

const CONCRETE_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TIME_YESTERDAY', fallback: 'Yesterday', value: 'yesterday', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_TODAY', fallback: 'Today', value: 'today', tense: 'present', aspect: 'simple' },
  { msgKey: 'TIME_TOMORROW', fallback: 'Tomorrow', value: 'tomorrow', tense: 'future', aspect: 'simple' },
  { msgKey: 'TIME_EVERY_DAY', fallback: 'Every day', value: 'every_day', tense: 'present', aspect: 'simple' },
  { msgKey: 'TIME_LAST_SUNDAY', fallback: 'Last Sunday', value: 'last_sunday', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_RIGHT_NOW', fallback: 'Right now', value: 'right_now', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_AT_THE_MOMENT', fallback: 'At the moment', value: 'at_the_moment', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_NEXT_WEEK', fallback: 'Next week', value: 'next_week', tense: 'future', aspect: 'simple' },
];

const ASPECTUAL_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TIME_NOW', fallback: 'Now', value: 'now', tense: 'present', aspect: 'progressive' },
  { msgKey: 'TIME_JUST_NOW', fallback: 'Just now', value: 'just_now', tense: 'past', aspect: 'simple' },
  { msgKey: 'TIME_ALREADY_YET', fallback: 'Already/Yet', value: 'completion', tense: 'inherit', aspect: 'perfect' },
  { msgKey: 'TIME_STILL', fallback: 'Still', value: 'still', tense: 'inherit', aspect: 'inherit' },
  { msgKey: 'TIME_RECENTLY', fallback: 'Recently', value: 'recently', tense: 'past', aspect: 'perfect' },
];

const ABSTRACT_OPTIONS: TimeChipOption[] = [
  { msgKey: 'TENSE_PAST', fallback: '[Past]', value: 'past', tense: 'past', aspect: 'inherit' },
  { msgKey: 'TENSE_FUTURE', fallback: '[Future]', value: 'future', tense: 'future', aspect: 'inherit' },
  { msgKey: 'TENSE_PRESENT', fallback: '[Current]', value: 'current', tense: 'present', aspect: 'inherit' },
  { msgKey: 'ASPECT_PROGRESSIVE', fallback: '[Progressive]', value: 'progressive', tense: 'inherit', aspect: 'progressive' },
  { msgKey: 'ASPECT_PERFECT', fallback: '[Perfect]', value: 'perfect', tense: 'inherit', aspect: 'perfect' },
  { msgKey: 'ASPECT_PERF_PROG', fallback: '[Perf. Prog.]', value: 'perfectProgressive', tense: 'inherit', aspect: 'perfectProgressive' },
];


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

// ============================================
// カテゴリ別動詞ブロック
// ============================================
const VERB_CATEGORY_KEYS: Record<VerbCategory, { msgKey: string; fallback: string; color: string }> = {
  motion: { msgKey: 'VERB_MOTION', fallback: 'MOTION', color: COLORS.verbMotion },
  action: { msgKey: 'VERB_ACTION', fallback: 'ACTION', color: COLORS.verbAction },
  transfer: { msgKey: 'VERB_TRANSFER', fallback: 'TRANSFER', color: COLORS.verbTransfer },
  cognition: { msgKey: 'VERB_COGNITION', fallback: 'COGNITION', color: COLORS.verbCognition },
  communication: { msgKey: 'VERB_COMMUNICATION', fallback: 'COMMUNICATION', color: COLORS.verbCommunication },
  state: { msgKey: 'VERB_STATE', fallback: 'STATE', color: COLORS.verbState },
};

// カテゴリ別動詞ブロック生成関数
function createVerbCategoryBlock(category: VerbCategory) {
  const config = VERB_CATEGORY_KEYS[category];
  const categoryVerbs = getVerbCoresByCategory(category);

  Blockly.Blocks[`verb_${category}`] = {
    init: function() {
      const verbOptions: [string, string][] = categoryVerbs.map(v => [v.lemma, v.lemma]);
      const label = msg(config.msgKey, config.fallback);

      this.appendDummyInput()
          .appendField(label)
          .appendField(new Blockly.FieldDropdown(verbOptions, this.updateShape.bind(this)), "VERB");

      this.setPreviousStatement(true, "verb");
      this.setColour(config.color);
      this.setTooltip(`${label} verb`);

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
        const labelKey = slot.label || slot.role;
        const roleKey = `ROLE_${labelKey.toUpperCase()}`;
        const translatedLabel = msg(roleKey, labelKey);
        const checkType = slot.role === 'attribute' ? ['noun', 'nounPhrase', 'adjective', 'coordinatedNounPhrase'] : ['noun', 'nounPhrase', 'coordinatedNounPhrase'];
        const displayLabel = slot.required ? `${translatedLabel}:` : `(${translatedLabel}):`;
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
const animalNouns = nounCores.filter(n => n.category === 'animal');

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
const objectNouns = nounCores.filter(n => n.category === 'object');

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
const abstractNouns = nounCores.filter(n => n.category === 'abstract');

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

// ============================================
// 統合限定詞ブロック（3つのプルダウン）- 新設計版
// ============================================
Blockly.Blocks['determiner_unified'] = {
  init: function() {
    const block = this;

    // 接続された名詞のプロパティを取得
    const getConnectedNounInfo = (): { countable: boolean; proper: boolean; zeroArticle: boolean } | null => {
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
      const nounEntry = findNounCore(nounLemma);
      if (!nounEntry) return null;
      return {
        countable: nounEntry.countable,
        proper: nounEntry.proper === true,
        zeroArticle: nounEntry.zeroArticle === true,
      };
    };

    // 名詞タイプを判定
    const getNounType = (): NounType | null => {
      const nounInfo = getConnectedNounInfo();
      if (!nounInfo) return null;
      if (nounInfo.proper) return 'proper';
      if (nounInfo.zeroArticle) return 'zeroArticle';
      if (!nounInfo.countable) return 'uncountable';
      return 'countable';
    };

    // 現在のDET値を取得
    const getCurrentValues = () => ({
      PRE: block.getFieldValue('PRE') || '__none__',
      CENTRAL: block.getFieldValue('CENTRAL') || '__none__',
      POST: block.getFieldValue('POST') || '__none__',
    });

    // 無効マーク付きラベルを生成
    const markInvalid = (label: string) => `× ${label}`;

    // オプション生成（共通ロジック）
    const getOptionsForField = (
      field: DetField,
      determiners: DeterminerOption[]
    ): [string, string][] => {
      const currentValues = getCurrentValues();
      const nounType = getNounType();

      return determiners.map(o => {
        if (o.value === '__none__') return [o.label, o.value];

        // 名詞タイプによる制約
        if (nounType) {
          const constraint = NOUN_TYPE_CONSTRAINTS[nounType];
          const invalidList = constraint.invalid[field.toLowerCase() as 'pre' | 'central' | 'post'];
          if (invalidList.includes(o.value)) {
            return [markInvalid(o.label), o.value];
          }
        }

        // 他のフィールドとの排他チェック
        if (isExcludedByOthers(field, o.value, currentValues)) {
          return [markInvalid(o.label), o.value];
        }

        return [o.label, o.value];
      });
    };

    // 各フィールドのオプション生成
    const getPreOptions = (): [string, string][] =>
      getOptionsForField('PRE', PRE_DETERMINERS);

    const getCentralOptions = (): [string, string][] =>
      getOptionsForField('CENTRAL', CENTRAL_DETERMINERS);

    const getPostOptions = (): [string, string][] =>
      getOptionsForField('POST', getPostDeterminers());

    // 一括更新モードフラグ（バリデーターをバイパスするため）
    let bulkUpdateMode = false;

    // バリデータ：無効なオプション（×マーク付き）を選んだら拒否
    const createValidator = (
      field: DetField,
      getOptions: () => [string, string][]
    ) => {
      return function(this: Blockly.FieldDropdown, newValue: string) {
        // 一括更新モード中はバリデーションをスキップ
        if (bulkUpdateMode) {
          return newValue;
        }

        const options = getOptions();
        const selected = options.find(([, v]) => v === newValue);
        if (selected && selected[0].startsWith('×')) {
          return null;  // 選択を拒否
        }

        // 排他ルール適用：変更後の値を使って計算し、一括適用
        // （バリデーター実行時点ではまだ値が確定していないため、newValueを使用）
        const currentValues = getCurrentValues();
        const valuesWithChange = { ...currentValues, [field]: newValue };

        // 他のフィールドへの影響を計算
        const newValues = { ...valuesWithChange };
        applyExclusionRules(
          field,
          newValue,
          valuesWithChange,
          (f, v) => { newValues[f] = v; }
        );

        // 変更があれば一括適用（変更されたフィールド以外）
        if (newValues.PRE !== valuesWithChange.PRE ||
            newValues.CENTRAL !== valuesWithChange.CENTRAL ||
            newValues.POST !== valuesWithChange.POST) {
          // 遅延実行で他のフィールドを更新（自分自身は除く）
          setTimeout(() => {
            bulkUpdateMode = true;
            try {
              if (field !== 'PRE') block.setFieldValue(newValues.PRE, 'PRE');
              if (field !== 'CENTRAL') block.setFieldValue(newValues.CENTRAL, 'CENTRAL');
              if (field !== 'POST') block.setFieldValue(newValues.POST, 'POST');
            } finally {
              bulkUpdateMode = false;
            }
          }, 0);
        }

        return newValue;
      };
    };

    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective"])
        .appendField(msg('DETERMINER_LABEL', 'DET'))
        .appendField(new Blockly.FieldDropdown(getPreOptions, createValidator('PRE', getPreOptions)), "PRE")
        .appendField(new Blockly.FieldDropdown(getCentralOptions, createValidator('CENTRAL', getCentralOptions)), "CENTRAL")
        .appendField(new Blockly.FieldDropdown(getPostOptions, createValidator('POST', getPostOptions)), "POST");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.determiner);
    this.setTooltip(msg('DETERMINER_TOOLTIP', 'Determiner: pre + central + post'));

    // 内部関数を保存（onchangeで使用）
    this._getNounType = getNounType;
    this._getCurrentValues = getCurrentValues;

    // 一括更新関数（バリデーションをスキップして値をまとめて設定）
    this._bulkSetValues = (values: { PRE: string; CENTRAL: string; POST: string }) => {
      bulkUpdateMode = true;
      try {
        block.setFieldValue(values.PRE, 'PRE');
        block.setFieldValue(values.CENTRAL, 'CENTRAL');
        block.setFieldValue(values.POST, 'POST');
      } finally {
        bulkUpdateMode = false;
      }
    };
  },

  // 接続変更・名詞変更時に名詞タイプ制約を適用
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

    const nounType = this._getNounType?.() as NounType | null;
    if (!nounType) return;

    const currentValues = this._getCurrentValues?.() as { PRE: string; CENTRAL: string; POST: string };
    if (!currentValues) return;

    // 名詞タイプに基づいて新しい値を計算
    const newValues = calculateNounTypeValues(nounType, currentValues);
    if (newValues) {
      // 計算した値を一括で適用（バリデーションをバイパス）
      this._bulkSetValues?.(newValues);
    }
  },
};

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
  const categoryAdjs = adjectiveCores.filter(a => a.category === category);

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

const getPrepositionOptions = (): [string, string][] => [
  [msg('GROUP_LOCATION', '── Location ──'), '__label_location__'],
  ...PREPOSITIONS.location.map(p => [p.label, p.value] as [string, string]),
  [msg('GROUP_DIRECTION', '── Direction ──'), '__label_direction__'],
  ...PREPOSITIONS.direction.map(p => [p.label, p.value] as [string, string]),
  [msg('GROUP_RELATION', '── Relation ──'), '__label_relation__'],
  ...PREPOSITIONS.relation.map(p => [p.label, p.value] as [string, string]),
];

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

// ============================================
// オプションのエクスポート（コンパイラ用）
// ============================================
export const TIME_CHIP_DATA = {
  concrete: CONCRETE_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
  aspectual: ASPECTUAL_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
  abstract: ABSTRACT_OPTIONS.map(o => ({ label: o.fallback, value: o.value, tense: o.tense, aspect: o.aspect })),
};

export const DETERMINER_DATA = {
  pre: PRE_DETERMINERS,
  central: CENTRAL_DETERMINERS,
  post: getPostDeterminers(),
};

export const FREQUENCY_ADVERB_DATA = FREQUENCY_ADVERBS;

export const PREPOSITION_DATA = PREPOSITIONS;

// ============================================
// ツールボックス定義（動的生成）
// ============================================
export function createToolbox() {
  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: msg('TOOLBOX_SENTENCE', 'Sentence'),
        colour: COLORS.timeFrame,
        contents: [
          { kind: "block", type: "time_frame" },
          { kind: "label", text: msg('SECTION_TIME', '── Time ──') },
          { kind: "block", type: "time_chip_concrete" },
          { kind: "label", text: msg('SECTION_ASPECT', '── Aspect ──') },
          { kind: "block", type: "time_chip_aspectual" },
          { kind: "label", text: msg('SECTION_TENSE_ASPECT', '── Tense/Aspect ──') },
          { kind: "block", type: "time_chip_abstract" },
          { kind: "block", type: "time_chip_unified" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_SENTENCE_MODIFIER', 'Sentence Modifier'),
        colour: COLORS.modal,
        contents: [
          { kind: "label", text: msg('SECTION_IMPERATIVE', '── Imperative ──') },
          { kind: "block", type: "imperative_wrapper" },
          { kind: "label", text: msg('SECTION_MODAL_NEGATION', '── Modal Negation ──') },
          { kind: "block", type: "negation_sentence_wrapper" },
          { kind: "label", text: msg('SECTION_MODAL', '── Modal ──') },
          { kind: "block", type: "modal_wrapper" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_VERBS', 'Verbs'),
        colour: COLORS.action,
        contents: [
          { kind: "label", text: msg('SECTION_ACTION', '── Action ──') },
          { kind: "block", type: "verb_action" },
          { kind: "label", text: msg('SECTION_MOTION', '── Motion ──') },
          { kind: "block", type: "verb_motion" },
          { kind: "label", text: msg('SECTION_STATE', '── State ──') },
          { kind: "block", type: "verb_state" },
          { kind: "label", text: msg('SECTION_COMMUNICATION', '── Communication ──') },
          { kind: "block", type: "verb_communication" },
          { kind: "label", text: msg('SECTION_COGNITION', '── Cognition ──') },
          { kind: "block", type: "verb_cognition" },
          { kind: "label", text: msg('SECTION_TRANSFER', '── Transfer ──') },
          { kind: "block", type: "verb_transfer" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_VERB_MODIFIERS', 'Verb Modifiers'),
        colour: COLORS.frequency,
        contents: [
          { kind: "block", type: "negation_wrapper" },
          { kind: "block", type: "frequency_wrapper" },
          { kind: "block", type: "manner_wrapper" },
          { kind: "block", type: "locative_wrapper" },
          { kind: "block", type: "time_adverb_wrapper" },
          { kind: "block", type: "preposition_verb" },
          { kind: "label", text: msg('SECTION_COORDINATION', '── Coordination ──') },
          { kind: "block", type: "coordination_verb_and" },
          { kind: "block", type: "coordination_verb_or" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_NOUNS', 'Nouns'),
        colour: COLORS.person,
        contents: [
          { kind: "label", text: msg('SECTION_PRONOUNS', '── Pronouns ──') },
          { kind: "block", type: "pronoun_block" },
          { kind: "block", type: "possessive_pronoun_block" },
          { kind: "label", text: msg('SECTION_PEOPLE', '── People ──') },
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
          { kind: "label", text: msg('SECTION_ANIMALS', '── Animals ──') },
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
          { kind: "label", text: msg('SECTION_OBJECTS', '── Objects ──') },
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
          { kind: "label", text: msg('SECTION_PLACES', '── Places ──') },
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
          { kind: "label", text: msg('SECTION_ABSTRACT', '── Abstract ──') },
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
        name: msg('TOOLBOX_NOUN_MODIFIERS', 'Noun Modifiers'),
        colour: COLORS.determiner,
        contents: [
          { kind: "block", type: "determiner_unified" },
          { kind: "label", text: msg('SECTION_ADJECTIVES', '── Adjectives ──') },
          { kind: "block", type: "adjective_size" },
          { kind: "block", type: "adjective_age" },
          { kind: "block", type: "adjective_color" },
          { kind: "block", type: "adjective_physical" },
          { kind: "block", type: "adjective_quality" },
          { kind: "block", type: "adjective_emotion" },
          { kind: "label", text: msg('SECTION_PREPOSITION', '── Preposition ──') },
          { kind: "block", type: "preposition_noun" },
          { kind: "label", text: msg('SECTION_COORDINATION', '── Coordination ──') },
          { kind: "block", type: "coordination_noun_and" },
          { kind: "block", type: "coordination_noun_or" },
          { kind: "block", type: "choice_question_block" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_QUESTION', 'Question'),
        colour: COLORS.imperative,
        contents: [
          { kind: "block", type: "question_wrapper" },
          { kind: "label", text: msg('SECTION_WH_NOUNS', '── Wh-Nouns ──') },
          { kind: "block", type: "wh_placeholder_block" },
          { kind: "block", type: "choice_question_block" },
          { kind: "label", text: msg('SECTION_WH_ADVERBS', '── Wh-Adverbs ──') },
          { kind: "block", type: "wh_adverb_block" },
        ]
      },
      {
        kind: "category",
        name: msg('TOOLBOX_LOGIC', 'Logic'),
        colour: COLORS.logic,
        contents: [
          { kind: "label", text: msg('SECTION_ASSERTION', '── Assertion ──') },
          { kind: "block", type: "fact_wrapper" },
          { kind: "label", text: msg('SECTION_BOOLEAN', '── Boolean ──') },
          { kind: "block", type: "logic_and_block" },
          { kind: "block", type: "logic_or_block" },
          { kind: "block", type: "logic_not_block" },
          { kind: "label", text: msg('SECTION_CONDITIONAL', '── Conditional ──') },
          { kind: "block", type: "logic_if_block" },
          { kind: "block", type: "logic_because_block" },
        ]
      },
    ]
  };
}

// 後方互換性のための静的エクスポート（非推奨）
export const toolbox = createToolbox();
