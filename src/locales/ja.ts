import type { LocaleData } from './types';

export const ja: LocaleData = {
  code: 'ja',
  name: '日本語',
  blockly: {
    // Sentence blocks
    SENTENCE_LABEL: '文',
    SENTENCE_TA_LABEL: '時制/相:',
    SENTENCE_PREDICATE_LABEL: '述語:',
    SENTENCE_TOOLTIP: '文のルート。時制と相を指定する',

    // Modal wrapper
    MODAL_LABEL: 'モダリティ',
    MODAL_TOOLTIP: 'モダリティ: 能力・許可・義務などを文に追加',
    MODAL_ABILITY: '能力 (can)',
    MODAL_PERMISSION: '許可 (may)',
    MODAL_POSSIBILITY: '可能性 (might)',
    MODAL_OBLIGATION: '義務 (must)',
    MODAL_CERTAINTY: '確信 (must)',
    MODAL_ADVICE: '助言 (should)',
    MODAL_VOLITION: '意志 (will)',
    MODAL_PREDICTION: '予測 (will)',

    // Imperative wrapper
    IMPERATIVE_LABEL: '命令文',
    IMPERATIVE_TOOLTIP: '命令文: 命令を作成（例: "Eat the apple!"）',

    // Negation sentence wrapper
    NEGATION_MODAL_LABEL: 'NOT (モダリティ)',
    NEGATION_MODAL_TOOLTIP: 'モダリティの否定（例: "しなくてもよい"）',

    // Time chips
    TIME_CHIP_CONCRETE_LABEL: '時間',
    TIME_CHIP_CONCRETE_TOOLTIP: '具体的な時間指定（いつ？）',
    TIME_CHIP_ASPECTUAL_LABEL: '相',
    TIME_CHIP_ASPECTUAL_TOOLTIP: '相マーカー（進行、完了など）',
    TIME_CHIP_ABSTRACT_LABEL: '時制/相',
    TIME_CHIP_ABSTRACT_TOOLTIP: '時制・相の修飾（動詞活用に影響）',
    TIME_CHIP_UNIFIED_LABEL: '時制/相',
    TIME_CHIP_UNIFIED_TOOLTIP: '時制と相を独立して選択',

    // Time options
    TIME_YESTERDAY: '昨日',
    TIME_TODAY: '今日',
    TIME_TOMORROW: '明日',
    TIME_EVERY_DAY: '毎日',
    TIME_LAST_SUNDAY: '先週の日曜',
    TIME_RIGHT_NOW: '今すぐ',
    TIME_AT_THE_MOMENT: '現時点で',
    TIME_NEXT_WEEK: '来週',
    TIME_NOW: '今',
    TIME_JUST_NOW: 'たった今',
    TIME_ALREADY_YET: 'もう/まだ',
    TIME_STILL: 'まだ',
    TIME_RECENTLY: '最近',

    // Tense/Aspect options
    TENSE_PAST: '[過去]',
    TENSE_PRESENT: '[現在]',
    TENSE_FUTURE: '[未来]',
    ASPECT_SIMPLE: '[単純]',
    ASPECT_PROGRESSIVE: '[進行]',
    ASPECT_PERFECT: '[完了]',
    ASPECT_PERF_PROG: '[完了進行]',

    // Noun blocks
    PRONOUN_LABEL: '代名詞',
    PRONOUN_TOOLTIP: '代名詞（I, you, he, this, someone等）- 限定詞不要',
    POSSESSIVE_PRONOUN_LABEL: '所有代名詞',
    POSSESSIVE_PRONOUN_TOOLTIP: '所有代名詞（mine, yours, his, hers, ours, theirs）- 所有物を指す',
    HUMAN_LABEL: '人',
    HUMAN_TOOLTIP: '人（father, teacher, John等）',
    ANIMAL_LABEL: '動物',
    ANIMAL_TOOLTIP: '動物（cat, dog, bird等）',
    OBJECT_LABEL: '物',
    OBJECT_TOOLTIP: '物（apple, book, pen, water等）',
    PLACE_LABEL: '場所',
    PLACE_TOOLTIP: '場所（park, school, Tokyo等）',
    ABSTRACT_LABEL: '抽象概念',
    ABSTRACT_TOOLTIP: '抽象概念（idea, love, music等）',

    // Noun group labels
    GROUP_PERSONAL: '── 人称 ──',
    GROUP_DEMONSTRATIVE: '── 指示 ──',
    GROUP_INDEFINITE: '── 不定 ──',
    GROUP_COMMON: '── 普通名詞 ──',
    GROUP_NAMES: '── 固有名詞 ──',

    // Determiner
    DETERMINER_LABEL: '限定詞',
    DETERMINER_TOOLTIP: '限定詞: 前置 + 中央 + 後置',
    DETERMINER_NONE: '─',
    DET_PLURAL: '[複数]',
    DET_UNCOUNTABLE: '[不可算]',

    // Verb modifiers
    NEGATION_LABEL: '否定',
    NEGATION_TOOLTIP: '否定: 動作を否定する',
    FREQUENCY_LABEL: '頻度',
    FREQUENCY_TOOLTIP: '頻度: 動作がどれくらい頻繁に起こるか',
    MANNER_LABEL: '様態',
    MANNER_TOOLTIP: '様態: 動作がどのように行われるか',
    LOCATIVE_LABEL: '場所',
    LOCATIVE_TOOLTIP: '場所: 動作がどこで起こるか',

    // Prepositions
    PP_LABEL: '前置詞句',
    PP_OBJECT_LABEL: '目的語:',
    PP_VERB_TOOLTIP: '前置詞句（動詞修飾）: 動詞に前置詞句を追加',
    PP_NOUN_TOOLTIP: '前置詞句（名詞修飾）: 名詞を前置詞句で修飾',

    // Coordination
    COORD_AND_LABEL: 'AND',
    COORD_OR_LABEL: 'OR',
    COORD_NOUN_AND_TOOLTIP: '等位接続（名詞）: ANDで2つの名詞句を接続',
    COORD_NOUN_OR_TOOLTIP: '等位接続（名詞）: ORで2つの名詞句を接続',
    COORD_VERB_AND_TOOLTIP: '等位接続（動詞）: ANDで2つの動詞句を接続',
    COORD_VERB_OR_TOOLTIP: '等位接続（動詞）: ORで2つの動詞句を接続',

    // Verb categories
    VERB_MOTION: '移動',
    VERB_ACTION: '動作',
    VERB_TRANSFER: '授与',
    VERB_COGNITION: '認知',
    VERB_COMMUNICATION: '伝達',
    VERB_STATE: '状態',

    // Semantic role labels
    ROLE_AGENT: '動作主',
    ROLE_PATIENT: '被動者',
    ROLE_THEME: '主題',
    ROLE_EXPERIENCER: '経験者',
    ROLE_STIMULUS: '刺激',
    ROLE_RECIPIENT: '受領者',
    ROLE_POSSESSOR: '所有者',
    ROLE_ATTRIBUTE: '属性',
    ROLE_PLACE: '起点',
    ROLE_GOAL: '着点',
    ROLE_LOCATION: '位置',
    ROLE_SUBJECT: '主語',

    // Adjective categories
    ADJ_SIZE: '大きさ',
    ADJ_AGE: '新旧',
    ADJ_COLOR: '色',
    ADJ_PHYSICAL: '形状',
    ADJ_QUALITY: '性質',
    ADJ_EMOTION: '感情',

    // Toolbox categories
    TOOLBOX_SENTENCE: '文',
    TOOLBOX_SENTENCE_MODIFIER: '文修飾',
    TOOLBOX_VERBS: '動詞',
    TOOLBOX_VERB_MODIFIERS: '動詞修飾',
    TOOLBOX_NOUNS: '名詞',
    TOOLBOX_NOUN_MODIFIERS: '名詞修飾',

    // Toolbox section labels
    SECTION_TIME: '── 時間 ──',
    SECTION_ASPECT: '── 相 ──',
    SECTION_TENSE_ASPECT: '── 時制/相 ──',
    SECTION_IMPERATIVE: '── 命令文 ──',
    SECTION_MODAL_NEGATION: '── モダリティ否定 ──',
    SECTION_MODAL: '── モダリティ ──',
    SECTION_MOTION: '── 移動 ──',
    SECTION_ACTION: '── 動作 ──',
    SECTION_TRANSFER: '── 授与 ──',
    SECTION_COGNITION: '── 認知 ──',
    SECTION_COMMUNICATION: '── 伝達 ──',
    SECTION_STATE: '── 状態 ──',
    SECTION_COORDINATION: '── 等位接続 ──',
    SECTION_PRONOUNS: '── 代名詞 ──',
    SECTION_PEOPLE: '── 人 ──',
    SECTION_ANIMALS: '── 動物 ──',
    SECTION_OBJECTS: '── 物 ──',
    SECTION_PLACES: '── 場所 ──',
    SECTION_ABSTRACT: '── 抽象概念 ──',
    SECTION_ADJECTIVES: '── 形容詞 ──',
    SECTION_PREPOSITION: '── 前置詞 ──',
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: '自然言語のためのIDE',

    // Tabs
    TAB_BLOCKS: 'ブロック',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_COMING_SOON: '準備中',

    // Panels
    PANEL_OUTPUT: '出力',
    PANEL_LINGUASCRIPT: 'LinguaScript',
    PANEL_GRAMMAR_CONSOLE: '文法コンソール',
    PANEL_AST: 'AST',

    // Placeholders
    PLACEHOLDER_OUTPUT: 'ブロックで文を組み立ててください...',
    PLACEHOLDER_LINGUASCRIPT: '// 文を組み立てるとLinguaScriptが表示されます',
    PLACEHOLDER_GRAMMAR: '文法の説明がここに表示されます...',
    PLACEHOLDER_AST: '// ASTはまだ生成されていません',

    // Errors
    ERROR_INCOMPLETE: '(不完全)',

    // Settings
    SHOW_AST: 'AST',
    LANGUAGE: '言語',
  },
};
