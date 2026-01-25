import type { LocaleData } from './types';

export const jaHira: LocaleData = {
  code: 'ja-hira',
  name: 'にほんご',
  blockly: {
    // Sentence blocks
    SENTENCE_LABEL: 'ぶん',
    SENTENCE_TA_LABEL: 'いつ？:',
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
    TIME_CHIP_UNIFIED_LABEL: 'いつ？/ようす',
    TIME_CHIP_UNIFIED_TOOLTIP: 'いつ？とようすをえらぶ',

    // Time options
    TIME_YESTERDAY: 'きのう',
    TIME_TODAY: 'きょう',
    TIME_TOMORROW: 'あした',
    TIME_EVERY_DAY: 'まいにち',
    TIME_LAST_SUNDAY: 'このまえのにちようび',
    TIME_RIGHT_NOW: 'いますぐ',
    TIME_AT_THE_MOMENT: 'いま',
    TIME_NEXT_WEEK: 'らいしゅう',
    TIME_NOW: 'いま',
    TIME_JUST_NOW: 'たったいま',
    TIME_ALREADY_YET: 'もう/まだ',
    TIME_STILL: 'まだ',
    TIME_RECENTLY: 'さいきん',

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

    // Determiner
    DETERMINER_LABEL: 'どの？いくつ？',
    DETERMINER_TOOLTIP: 'どの？いくつ？をきめる',
    DETERMINER_NONE: '─',
    DET_PLURAL: '[たくさん]',
    DET_UNCOUNTABLE: '[かぞえない]',

    // Verb modifiers
    NEGATION_LABEL: '〜ない',
    NEGATION_TOOLTIP: '「〜しない」にする',
    FREQUENCY_LABEL: 'どのくらい？',
    FREQUENCY_TOOLTIP: 'いつも？ときどき？',
    MANNER_LABEL: 'どうやって？',
    MANNER_TOOLTIP: 'はやく、ゆっくり、じょうずに など',
    LOCATIVE_LABEL: 'どこで？',
    LOCATIVE_TOOLTIP: 'ここ、そこ、どこかで など',

    // Prepositions
    PP_LABEL: 'どこ？だれと？',
    PP_OBJECT_LABEL: 'なに？:',
    PP_VERB_TOOLTIP: 'どこで？だれと？なにで？をつける',
    PP_NOUN_TOOLTIP: 'どこの？なにの？をつける',

    // Coordination
    COORD_AND_LABEL: 'と',
    COORD_OR_LABEL: 'か',
    COORD_NOUN_AND_TOOLTIP: 'なまえを「と」でつなぐ',
    COORD_NOUN_OR_TOOLTIP: 'なまえを「か」でつなぐ',
    COORD_VERB_AND_TOOLTIP: 'うごきを「と」でつなぐ',
    COORD_VERB_OR_TOOLTIP: 'うごきを「か」でつなぐ',

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
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: 'ことばのIDE',

    // Tabs
    TAB_BLOCKS: 'ブロック',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_COMING_SOON: 'もうすこしまってね',

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
  },
};
