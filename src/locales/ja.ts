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
    MODAL_LABEL: '助動詞',
    MODAL_TOOLTIP: '助動詞: 能力・許可・義務などを文に追加',
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

    // Question wrapper
    QUESTION_LABEL: '疑問文',
    QUESTION_TOOLTIP: '疑問文: 疑問を作成（例: "Do you like apples?"）',

    // Negation sentence wrapper
    NEGATION_MODAL_LABEL: 'NOT (助動詞)',
    NEGATION_MODAL_TOOLTIP: '助動詞の否定（例: "しなくてもよい"）',

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
    GROUP_INTERROGATIVE: '── 疑問詞 ──',

    // Time group labels
    GROUP_PAST: '── 過去 ──',
    GROUP_PRESENT: '── 現在 ──',
    GROUP_FUTURE: '── 未来 ──',

    // Preposition group labels
    GROUP_LOCATION: '── 場所 ──',
    GROUP_DIRECTION: '── 方向 ──',
    GROUP_RELATION: '── 関係 ──',

    // Visualization Panel - Tense/Aspect
    VIZ_TENSE_ASPECT_TITLE: '時制・アスペクト',
    VIZ_TENSE_PAST: '過去',
    VIZ_TENSE_PRESENT: '現在',
    VIZ_TENSE_FUTURE: '未来',
    VIZ_LABEL_PAST: '過去',
    VIZ_LABEL_PRESENT: '現在',
    VIZ_LABEL_FUTURE: '未来',
    VIZ_ASPECT_SIMPLE: '単純',
    VIZ_ASPECT_PROGRESSIVE: '進行',
    VIZ_ASPECT_PERFECT: '完了',
    VIZ_ASPECT_PERF_PROG: '完了進行',

    // Visualization Panel - Prepositions
    VIZ_PREP_TITLE: '前置詞',
    VIZ_PREP_LOCATION: '場所',
    VIZ_PREP_DIRECTION: '方向',
    VIZ_PREP_RELATION: '関係',

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
    TIME_ADVERB_LABEL: '時間',
    TIME_ADVERB_TOOLTIP: '時間: 動作がいつ起こるか',

    // Prepositions
    PP_LABEL: '前置詞句',
    PP_OBJECT_LABEL: '目的語:',
    PP_VERB_TOOLTIP: '前置詞句（動詞修飾）: 動詞に前置詞句を追加',
    PP_NOUN_TOOLTIP: '前置詞句（名詞修飾）: 名詞を前置詞句で修飾',

    // Coordination (lowercase - linguistic)
    COORD_AND_LABEL: 'and',
    COORD_OR_LABEL: 'or',
    COORD_NOUN_AND_TOOLTIP: '等位接続（名詞）: andで2つの名詞句を接続',
    COORD_NOUN_OR_TOOLTIP: '等位接続（名詞）: orで2つの名詞句を接続',
    COORD_VERB_AND_TOOLTIP: '等位接続（動詞）: andで2つの動詞句を接続',
    COORD_VERB_OR_TOOLTIP: '等位接続（動詞）: orで2つの動詞句を接続',

    // Logic Extension (uppercase - propositional logic)
    FACT_LABEL: '事実',
    FACT_TOOLTIP: '論理的事実を宣言。sentence/modalとは排他的',
    LOGIC_AND_LABEL: 'AND',
    LOGIC_AND_TOOLTIP: '論理積（AND）: 両方の命題が真',
    LOGIC_OR_LABEL: 'OR',
    LOGIC_OR_TOOLTIP: '論理和（OR）: 少なくとも一方が真',
    LOGIC_NOT_LABEL: 'NOT',
    LOGIC_NOT_TOOLTIP: '論理否定（NOT）: 命題が偽',
    LOGIC_IF_LABEL: 'IF',
    LOGIC_THEN_LABEL: 'THEN',
    LOGIC_IF_TOOLTIP: '条件（IF...THEN）: 条件が真なら結果が従う',
    LOGIC_BECAUSE_LABEL: 'BECAUSE',
    LOGIC_EFFECT_LABEL: 'EFFECT',
    LOGIC_BECAUSE_TOOLTIP: '因果（BECAUSE...EFFECT）: 原因が結果をもたらす',
    SECTION_CONDITIONAL: '── 条件 ──',
    TOOLBOX_LOGIC: '論理',

    // Choice question
    CHOICE_QUESTION_LABEL: '?which',
    CHOICE_QUESTION_OR: 'それとも',
    CHOICE_QUESTION_TOOLTIP: '選択疑問: どちらかを尋ねる（例: 紅茶かコーヒーか？）',

    // Wh-placeholder
    WH_PLACEHOLDER_TOOLTIP: '疑問詞: who（人）または what（もの）',
    WH_ADVERB_TOOLTIP: '疑問副詞: where（場所）、when（時間）、how（方法）',

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
    TOOLBOX_QUESTION: '疑問文',
    TOOLBOX_SENTENCE_MODIFIER: '文修飾',
    TOOLBOX_VERBS: '動詞',
    TOOLBOX_VERB_MODIFIERS: '動詞修飾',
    TOOLBOX_NOUNS: '名詞',
    TOOLBOX_NOUN_MODIFIERS: '名詞修飾',

    // Toolbox section labels
    SECTION_TIME: '── 時間 ──',
    SECTION_ASPECT: '── 相 ──',
    SECTION_TENSE_ASPECT: '── 時制/相 ──',
    SECTION_QUESTION: '── 疑問文 ──',
    SECTION_IMPERATIVE: '── 命令文 ──',
    SECTION_MODAL_NEGATION: '── 助動詞否定 ──',
    SECTION_MODAL: '── 助動詞 ──',
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
    SECTION_WH_NOUNS: '── 疑問代名詞 ──',
    SECTION_WH_ADVERBS: '── 疑問副詞 ──',
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: 'IDE for Natural Language',

    // Tabs
    TAB_BLOCKS: 'ブロック',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_AST: 'AST',
    TAB_COMING_SOON: '準備中',
    TAB_GRAMMAR: '文法',
    TAB_TIMELINE: 'タイムライン',

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

    // Copy button
    COPY: 'コピー',
    COPIED: 'コピー完了',
    COPY_FOR_AI: 'AIにコピー',
  },
  grammar: {
    // Transform types
    TYPE_AGREEMENT: '一致',
    TYPE_TENSE: '時制',
    TYPE_ASPECT: '相',
    TYPE_CASE: '格',
    TYPE_ARTICLE: '冠詞',
    TYPE_MODAL: '法',
    TYPE_NEGATION: '否定',
    TYPE_DO_SUPPORT: 'do挿入',
    TYPE_INVERSION: '倒置',
    TYPE_WH_MOVEMENT: '疑問詞移動',

    // Agreement rules
    AGREEMENT_3SG: '三単現の -s',
    AGREEMENT_3SG_DESC: '主語が三人称単数',
    AGREEMENT_PLURAL: '複数形',
    AGREEMENT_PLURAL_DESC: '主語が複数',

    // Tense rules
    TENSE_PAST: '過去形 -ed',
    TENSE_PAST_DESC: '過去時制',
    TENSE_FUTURE: 'will + 原形',
    TENSE_FUTURE_DESC: '未来時制',

    // Aspect rules
    ASPECT_PROGRESSIVE: 'be + -ing',
    ASPECT_PROGRESSIVE_DESC: '進行相',
    ASPECT_PERFECT: 'have + 過去分詞',
    ASPECT_PERFECT_DESC: '完了相',
    ASPECT_PERF_PROG: 'have + been + -ing',
    ASPECT_PERF_PROG_DESC: '完了進行相',

    // Case rules
    CASE_OBJECTIVE: '目的格',
    CASE_OBJECTIVE_DESC: '目的語の位置',
    CASE_WHO_WHOM: 'who → whom',
    CASE_WHO_WHOM_DESC: '目的語の位置',

    // Article rules
    ARTICLE_A_AN: 'a → an',
    ARTICLE_A_AN_DESC: '母音の前',
    ARTICLE_SILENT_H: '黙字の h',

    // Number rules
    NUMBER_PLURAL: '複数化',
    NUMBER_PLURAL_DESC: '数：複数',

    // Polarity rules
    POLARITY_NEGATIVE: '極性',
    POLARITY_NEGATIVE_DESC: '否定文脈',

    // Modal rules
    MODAL_PAST: '過去形',
    MODAL_PAST_DESC: '法助動詞の過去形',

    // Syntax rules
    DO_SUPPORT_QUESTION: 'do挿入',
    DO_SUPPORT_QUESTION_DESC: '疑問文形成にdoが必要',
    INVERSION_QUESTION: '倒置',
    INVERSION_QUESTION_DESC: '主語と助動詞の倒置',
    WH_MOVEMENT_FRONT: '疑問詞前置',
    WH_MOVEMENT_FRONT_DESC: '疑問詞が文頭に移動',

    // Imperative rules
    IMPERATIVE_SUBJECT_OMISSION: '主語省略',
    IMPERATIVE_SUBJECT_OMISSION_DESC: '命令文では主語 you を省略',

    // Empty state
    EMPTY_NO_TRANSFORMATIONS: '変形なし',
  },
};
