import type { LocaleData } from './types';

export const jaHira: LocaleData = {
  code: 'ja-hira',
  name: 'にほんご',
  blockly: {
    // Sentence blocks
    SENTENCE_LABEL: 'ぶん',
    SENTENCE_TA_LABEL: 'いつ？どんなようす？:',
    SENTENCE_PREDICATE_LABEL: 'なにをする？:',
    SENTENCE_TOOLTIP: 'ぶんをつくる',

    // Modal wrapper
    MODAL_LABEL: 'できる・しなきゃ',
    MODAL_TOOLTIP: '「できる」「してもいい」「しなきゃ」などをつける',
    MODAL_ABILITY: 'できる (can)',
    MODAL_PERMISSION: 'してもいい (may)',
    MODAL_POSSIBILITY: 'かもしれない (might)',
    MODAL_OBLIGATION: 'しなきゃ (must)',
    MODAL_CERTAINTY: 'きっと〜だ (must)',
    MODAL_ADVICE: 'したほうがいい (should)',
    MODAL_VOLITION: 'するつもり (will)',
    MODAL_PREDICTION: '〜だろう (will)',

    // Imperative wrapper
    IMPERATIVE_LABEL: 'めいれい',
    IMPERATIVE_TOOLTIP: '「〜しなさい！」というぶんをつくる',

    // Question wrapper
    QUESTION_LABEL: 'しつもん',
    QUESTION_TOOLTIP: '「〜ですか？」というぶんをつくる',

    // Negation sentence wrapper
    NEGATION_MODAL_LABEL: '〜なくてもいい',
    NEGATION_MODAL_TOOLTIP: '「しなくてもいい」「できないかも」などをつくる',

    // Time chips
    TIME_CHIP_CONCRETE_LABEL: 'いつ？',
    TIME_CHIP_CONCRETE_TOOLTIP: 'いつのこと？（きのう、きょう、あした）',
    TIME_CHIP_ASPECTUAL_LABEL: 'どんなようす？',
    TIME_CHIP_ASPECTUAL_TOOLTIP: 'しているところ、おわったところ',
    TIME_CHIP_ABSTRACT_LABEL: 'いつ？どんなようす？',
    TIME_CHIP_ABSTRACT_TOOLTIP: 'いつのこと？どんなようす？',
    TIME_CHIP_UNIFIED_LABEL: 'じかん/ようす',
    TIME_CHIP_UNIFIED_TOOLTIP: 'じかんとようすをえらぶ',

    // Time options
    TIME_YESTERDAY: 'yesterday',
    TIME_TODAY: 'today',
    TIME_TOMORROW: 'tomorrow',
    TIME_EVERY_DAY: 'every day',
    TIME_LAST_SUNDAY: 'last Sunday',
    TIME_RIGHT_NOW: 'right now',
    TIME_AT_THE_MOMENT: 'at the moment',
    TIME_NEXT_WEEK: 'next week',
    TIME_NOW: 'now',
    TIME_JUST_NOW: 'just now',
    TIME_ALREADY_YET: 'already/yet',
    TIME_STILL: 'still',
    TIME_RECENTLY: 'recently',

    // Tense/Aspect options
    TENSE_PAST: '[まえ]',
    TENSE_PRESENT: '[いま]',
    TENSE_FUTURE: '[これから]',
    ASPECT_SIMPLE: '[ふつう]',
    ASPECT_PROGRESSIVE: '[〜しているところ]',
    ASPECT_PERFECT: '[〜したところ]',
    ASPECT_PERF_PROG: '[〜してきた]',

    // Noun blocks
    PRONOUN_LABEL: 'かわりのことば',
    PRONOUN_TOOLTIP: 'わたし、あなた、これ、だれか など',
    POSSESSIVE_PRONOUN_LABEL: 'だれのもの',
    POSSESSIVE_PRONOUN_TOOLTIP: 'わたしのもの、あなたのもの など',
    HUMAN_LABEL: 'ひと',
    HUMAN_TOOLTIP: 'おとうさん、せんせい、ともだち など',
    ANIMAL_LABEL: 'どうぶつ',
    ANIMAL_TOOLTIP: 'ねこ、いぬ、とり など',
    OBJECT_LABEL: 'もの',
    OBJECT_TOOLTIP: 'りんご、ほん、えんぴつ など',
    PLACE_LABEL: 'ばしょ',
    PLACE_TOOLTIP: 'こうえん、がっこう、いえ など',
    ABSTRACT_LABEL: 'かんがえ・きもち',
    ABSTRACT_TOOLTIP: 'アイデア、すき、おんがく など',

    // Noun group labels
    GROUP_PERSONAL: '── わたし・あなた ──',
    GROUP_DEMONSTRATIVE: '── これ・あれ ──',
    GROUP_INDEFINITE: '── だれか・なにか ──',
    GROUP_COMMON: '── ふつうのなまえ ──',
    GROUP_NAMES: '── ひとのなまえ ──',
    GROUP_INTERROGATIVE: '── しつもんのことば ──',

    // Time group labels
    GROUP_PAST: '── まえ ──',
    GROUP_PRESENT: '── いま ──',
    GROUP_FUTURE: '── あと ──',

    // Preposition group labels
    GROUP_LOCATION: '── いるところ ──',
    GROUP_DIRECTION: '── いく・くる ──',
    GROUP_RELATION: '── つながり ──',

    // Visualization Panel - Tense/Aspect
    VIZ_TENSE_ASPECT_TITLE: 'いつ？どんなようす？',
    VIZ_TENSE_PAST: 'まえ',
    VIZ_TENSE_PRESENT: 'いま',
    VIZ_TENSE_FUTURE: 'あと',
    VIZ_LABEL_PAST: 'かこ',
    VIZ_LABEL_PRESENT: 'げんざい',
    VIZ_LABEL_FUTURE: 'みらい',
    VIZ_ASPECT_SIMPLE: 'ふつう',
    VIZ_ASPECT_PROGRESSIVE: 'しているところ',
    VIZ_ASPECT_PERFECT: 'したところ',
    VIZ_ASPECT_PERF_PROG: 'してきた',

    // Visualization Panel - Prepositions
    VIZ_PREP_TITLE: 'ぜんちし',
    VIZ_PREP_LOCATION: 'いるところ',
    VIZ_PREP_DIRECTION: 'いく・くる',
    VIZ_PREP_RELATION: 'つながり',

    // Determiner
    DETERMINER_LABEL: 'どの？いくつ？',
    DETERMINER_TOOLTIP: 'どの？いくつ？をきめる',
    DET_NONE: '[なし]',
    DET_PLURAL: '[たくさん]',
    DET_UNCOUNTABLE: '[かぞえない]',
    DET_LABEL_ARTICLE: '── a / the ──',
    DET_LABEL_DEMONSTRATIVE: '── これ・あれ ──',
    DET_LABEL_POSSESSIVE: '── わたしの・あなたの ──',
    DET_LABEL_DISTRIBUTIVE: '── ひとつずつ ──',
    DET_LABEL_QUANTITY: '── いくつ？ ──',

    // Verb modifiers
    NEGATION_LABEL: '〜ない',
    NEGATION_TOOLTIP: '「〜しない」にする',
    FREQUENCY_LABEL: 'どのくらい？',
    FREQUENCY_TOOLTIP: 'いつも？ときどき？',
    MANNER_LABEL: 'どうやって？',
    MANNER_TOOLTIP: 'はやく、ゆっくり、じょうずに など',
    LOCATIVE_LABEL: 'どこで？',
    LOCATIVE_TOOLTIP: 'ここ、そこ、どこかで など',
    TIME_ADVERB_LABEL: 'いつ？',
    TIME_ADVERB_TOOLTIP: 'いつ？（きょう、きのう、いつ？など）',

    // Prepositions
    PP_LABEL: 'どこ？だれと？',
    PP_OBJECT_LABEL: 'なに？:',
    PP_VERB_TOOLTIP: 'どこで？だれと？なにで？をつける',
    PP_NOUN_TOOLTIP: 'どこの？なにの？をつける',

    // Coordination (lowercase - linguistic)
    COORD_AND_LABEL: 'と',
    COORD_OR_LABEL: 'か',
    COORD_NOUN_AND_TOOLTIP: 'なまえを「と」でつなぐ',
    COORD_NOUN_OR_TOOLTIP: 'なまえを「か」でつなぐ',
    COORD_VERB_AND_TOOLTIP: 'うごきを「と」でつなぐ',
    COORD_VERB_OR_TOOLTIP: 'うごきを「か」でつなぐ',

    // Logic Extension (uppercase - propositional logic)
    FACT_LABEL: 'ほんと',
    FACT_TOOLTIP: '「〜はほんとうだよ」といういみ',
    LOGIC_AND_LABEL: 'かつ',
    LOGIC_AND_TOOLTIP: 'どっちもほんと',
    LOGIC_OR_LABEL: 'または',
    LOGIC_OR_TOOLTIP: 'どちらかはほんと',
    LOGIC_NOT_LABEL: 'ちがう',
    LOGIC_NOT_TOOLTIP: 'ほんとじゃない',
    LOGIC_IF_LABEL: 'もし',
    LOGIC_THEN_LABEL: 'なら',
    LOGIC_IF_TOOLTIP: 'もし〜なら（じょうけん）',
    LOGIC_BECAUSE_LABEL: 'だから',
    LOGIC_EFFECT_LABEL: 'けっか',
    LOGIC_BECAUSE_TOOLTIP: '〜だから〜になる（いんが）',
    SECTION_CONDITIONAL: '── もし〜なら ──',
    TOOLBOX_LOGIC: 'ほんと？うそ？',

    // Choice question
    CHOICE_QUESTION_LABEL: 'どっち？',
    CHOICE_QUESTION_OR: 'それとも',
    CHOICE_QUESTION_TOOLTIP: 'どっちがいい？（おちゃかこーひーか？）',

    // Wh-placeholder
    WH_PLACEHOLDER_TOOLTIP: 'だれ？なに？（しつもんのことば）',
    WH_ADVERB_TOOLTIP: 'どこ？いつ？どうやって？（しつもんのことば）',

    // Verb categories
    VERB_MOTION: 'うごく',
    VERB_ACTION: 'する',
    VERB_TRANSFER: 'あげる・もらう',
    VERB_COGNITION: 'おもう・かんがえる',
    VERB_COMMUNICATION: 'はなす・つたえる',
    VERB_STATE: 'ある・いる',

    // Semantic role labels
    ROLE_AGENT: 'だれが',
    ROLE_PATIENT: 'なにを',
    ROLE_THEME: 'なにが',
    ROLE_EXPERIENCER: 'だれが',
    ROLE_STIMULUS: 'なにが',
    ROLE_RECIPIENT: 'だれに',
    ROLE_POSSESSOR: 'だれが',
    ROLE_ATTRIBUTE: 'どんな',
    ROLE_PLACE: 'どこから',
    ROLE_GOAL: 'どこへ',
    ROLE_LOCATION: 'どこに',
    ROLE_SUBJECT: 'なにが',

    // Adjective categories
    ADJ_SIZE: 'おおきい・ちいさい',
    ADJ_AGE: 'あたらしい・ふるい',
    ADJ_COLOR: 'いろ',
    ADJ_PHYSICAL: 'かたち',
    ADJ_QUALITY: 'どんな？',
    ADJ_EMOTION: 'きもち',

    // Toolbox categories
    TOOLBOX_SENTENCE: 'ぶん',
    TOOLBOX_QUESTION: 'しつもん',
    TOOLBOX_SENTENCE_MODIFIER: 'できる・しなきゃ',
    TOOLBOX_VERBS: 'うごきのことば',
    TOOLBOX_VERB_MODIFIERS: 'うごきをかざる',
    TOOLBOX_NOUNS: 'なまえのことば',
    TOOLBOX_NOUN_MODIFIERS: 'なまえをかざる',

    // Toolbox section labels
    SECTION_TIME: '── いつ？ ──',
    SECTION_ASPECT: '── どんなようす？ ──',
    SECTION_TENSE_ASPECT: '── いつ？どんなようす？ ──',
    SECTION_QUESTION: '── しつもん ──',
    SECTION_IMPERATIVE: '── めいれい ──',
    SECTION_MODAL_NEGATION: '── 〜なくてもいい ──',
    SECTION_MODAL: '── できる・しなきゃ ──',
    SECTION_MOTION: '── うごく ──',
    SECTION_ACTION: '── する ──',
    SECTION_TRANSFER: '── あげる・もらう ──',
    SECTION_COGNITION: '── おもう・かんがえる ──',
    SECTION_COMMUNICATION: '── はなす・つたえる ──',
    SECTION_STATE: '── ある・いる ──',
    SECTION_COORDINATION: '── つなげる ──',
    SECTION_PRONOUNS: '── かわりのことば ──',
    SECTION_PEOPLE: '── ひと ──',
    SECTION_ANIMALS: '── どうぶつ ──',
    SECTION_OBJECTS: '── もの ──',
    SECTION_PLACES: '── ばしょ ──',
    SECTION_ABSTRACT: '── かんがえ・きもち ──',
    SECTION_ADJECTIVES: '── どんなことば ──',
    SECTION_PREPOSITION: '── どこ？だれと？ ──',
    SECTION_WH_NOUNS: '── だれ？なに？ ──',
    SECTION_WH_ADVERBS: '── どこ？いつ？どうやって？ ──',
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: 'IDE for Natural Language',

    // Tabs
    TAB_BLOCKS: 'ブロック',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_AST: 'AST',
    TAB_COMING_SOON: 'もうすこしまってね',
    TAB_GRAMMAR: 'ことばのきまり',
    TAB_TIMELINE: 'じかん/ようす',

    // Panels
    PANEL_OUTPUT: 'できたぶん',
    PANEL_LINGUASCRIPT: 'LinguaScript',
    PANEL_GRAMMAR_CONSOLE: 'ぶんぽうのせつめい',
    PANEL_AST: 'AST',

    // Placeholders
    PLACEHOLDER_OUTPUT: 'ブロックでぶんをつくってね...',
    PLACEHOLDER_LINGUASCRIPT: '// ぶんをつくるとここにでるよ',
    PLACEHOLDER_GRAMMAR: 'ぶんぽうのせつめいがここにでるよ...',
    PLACEHOLDER_AST: '// まだできてないよ',

    // Errors
    ERROR_INCOMPLETE: '(まだできてない)',

    // Settings
    SHOW_AST: 'AST',
    LANGUAGE: 'ことば',

    // Copy button
    COPY: 'コピー',
    COPIED: 'コピーしたよ',
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
    TYPE_IMPERATIVE: '命令',

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
