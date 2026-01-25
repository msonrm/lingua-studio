import type { LocaleData } from './types';

export const jaHira: LocaleData = {
  code: 'ja-hira',
  name: 'にほんご',
  blockly: {
    // Sentence blocks
    SENTENCE_LABEL: 'ぶん',
    SENTENCE_TA_LABEL: 'じせい/そう:',
    SENTENCE_PREDICATE_LABEL: 'じゅつご:',
    SENTENCE_TOOLTIP: 'ぶんのルート。じせいとそうをしていする',

    // Modal wrapper
    MODAL_LABEL: 'モダリティ',
    MODAL_TOOLTIP: 'モダリティ: のうりょく・きょか・ぎむなどをぶんについか',
    MODAL_ABILITY: 'のうりょく (can)',
    MODAL_PERMISSION: 'きょか (may)',
    MODAL_POSSIBILITY: 'かのうせい (might)',
    MODAL_OBLIGATION: 'ぎむ (must)',
    MODAL_CERTAINTY: 'かくしん (must)',
    MODAL_ADVICE: 'じょげん (should)',
    MODAL_VOLITION: 'いし (will)',
    MODAL_PREDICTION: 'よそく (will)',

    // Imperative wrapper
    IMPERATIVE_LABEL: 'めいれいぶん',
    IMPERATIVE_TOOLTIP: 'めいれいぶん: めいれいをつくる（れい: "Eat the apple!"）',

    // Negation sentence wrapper
    NEGATION_MODAL_LABEL: 'NOT (モダリティ)',
    NEGATION_MODAL_TOOLTIP: 'モダリティのひてい（れい: "しなくてもよい"）',

    // Time chips
    TIME_CHIP_CONCRETE_LABEL: 'じかん',
    TIME_CHIP_CONCRETE_TOOLTIP: 'ぐたいてきなじかんしてい（いつ？）',
    TIME_CHIP_ASPECTUAL_LABEL: 'そう',
    TIME_CHIP_ASPECTUAL_TOOLTIP: 'そうマーカー（しんこう、かんりょうなど）',
    TIME_CHIP_ABSTRACT_LABEL: 'じせい/そう',
    TIME_CHIP_ABSTRACT_TOOLTIP: 'じせい・そうのしゅうしょく（どうしかつようにえいきょう）',
    TIME_CHIP_UNIFIED_LABEL: 'じせい/そう',
    TIME_CHIP_UNIFIED_TOOLTIP: 'じせいとそうをどくりつしてせんたく',

    // Time options
    TIME_YESTERDAY: 'きのう',
    TIME_TODAY: 'きょう',
    TIME_TOMORROW: 'あした',
    TIME_EVERY_DAY: 'まいにち',
    TIME_LAST_SUNDAY: 'せんしゅうのにちよう',
    TIME_RIGHT_NOW: 'いますぐ',
    TIME_AT_THE_MOMENT: 'げんじてんで',
    TIME_NEXT_WEEK: 'らいしゅう',
    TIME_NOW: 'いま',
    TIME_JUST_NOW: 'たったいま',
    TIME_ALREADY_YET: 'もう/まだ',
    TIME_STILL: 'まだ',
    TIME_RECENTLY: 'さいきん',

    // Tense/Aspect options
    TENSE_PAST: '[かこ]',
    TENSE_PRESENT: '[げんざい]',
    TENSE_FUTURE: '[みらい]',
    ASPECT_SIMPLE: '[たんじゅん]',
    ASPECT_PROGRESSIVE: '[しんこう]',
    ASPECT_PERFECT: '[かんりょう]',
    ASPECT_PERF_PROG: '[かんりょうしんこう]',

    // Noun blocks
    PRONOUN_LABEL: 'だいめいし',
    PRONOUN_TOOLTIP: 'だいめいし（I, you, he, this, someoneなど）- げんていしふよう',
    POSSESSIVE_PRONOUN_LABEL: 'しょゆうだいめいし',
    POSSESSIVE_PRONOUN_TOOLTIP: 'しょゆうだいめいし（mine, yours, his, hers, ours, theirs）- しょゆうぶつをさす',
    HUMAN_LABEL: 'ひと',
    HUMAN_TOOLTIP: 'ひと（father, teacher, Johnなど）',
    ANIMAL_LABEL: 'どうぶつ',
    ANIMAL_TOOLTIP: 'どうぶつ（cat, dog, birdなど）',
    OBJECT_LABEL: 'もの',
    OBJECT_TOOLTIP: 'もの（apple, book, pen, waterなど）',
    PLACE_LABEL: 'ばしょ',
    PLACE_TOOLTIP: 'ばしょ（park, school, Tokyoなど）',
    ABSTRACT_LABEL: 'ちゅうしょうがいねん',
    ABSTRACT_TOOLTIP: 'ちゅうしょうがいねん（idea, love, musicなど）',

    // Noun group labels
    GROUP_PERSONAL: '── にんしょう ──',
    GROUP_DEMONSTRATIVE: '── しじ ──',
    GROUP_INDEFINITE: '── ふてい ──',
    GROUP_COMMON: '── ふつうめいし ──',
    GROUP_NAMES: '── こゆうめいし ──',

    // Determiner
    DETERMINER_LABEL: 'げんていし',
    DETERMINER_TOOLTIP: 'げんていし: ぜんち + ちゅうおう + こうち',
    DETERMINER_NONE: '─',
    DET_PLURAL: '[ふくすう]',
    DET_UNCOUNTABLE: '[ふかさん]',

    // Verb modifiers
    NEGATION_LABEL: 'ひてい',
    NEGATION_TOOLTIP: 'ひてい: どうさをひていする',
    FREQUENCY_LABEL: 'ひんど',
    FREQUENCY_TOOLTIP: 'ひんど: どうさがどれくらいひんぱんにおこるか',
    MANNER_LABEL: 'ようたい',
    MANNER_TOOLTIP: 'ようたい: どうさがどのようにおこなわれるか',

    // Prepositions
    PP_LABEL: 'ぜんちしく',
    PP_OBJECT_LABEL: 'もくてきご:',
    PP_VERB_TOOLTIP: 'ぜんちしく（どうししゅうしょく）: どうしにぜんちしくをついか',
    PP_NOUN_TOOLTIP: 'ぜんちしく（めいししゅうしょく）: めいしをぜんちしくでしゅうしょく',

    // Coordination
    COORD_AND_LABEL: 'AND',
    COORD_OR_LABEL: 'OR',
    COORD_NOUN_AND_TOOLTIP: 'とういせつぞく（めいし）: ANDで2つのめいしくをせつぞく',
    COORD_NOUN_OR_TOOLTIP: 'とういせつぞく（めいし）: ORで2つのめいしくをせつぞく',
    COORD_VERB_AND_TOOLTIP: 'とういせつぞく（どうし）: ANDで2つのどうしくをせつぞく',
    COORD_VERB_OR_TOOLTIP: 'とういせつぞく（どうし）: ORで2つのどうしくをせつぞく',

    // Verb categories
    VERB_MOTION: 'いどう',
    VERB_ACTION: 'どうさ',
    VERB_TRANSFER: 'じゅよ',
    VERB_COGNITION: 'にんち',
    VERB_COMMUNICATION: 'でんたつ',
    VERB_STATE: 'じょうたい',

    // Adjective categories
    ADJ_SIZE: 'おおきさ',
    ADJ_AGE: 'しんきゅう',
    ADJ_COLOR: 'いろ',
    ADJ_PHYSICAL: 'けいじょう',
    ADJ_QUALITY: 'せいしつ',
    ADJ_EMOTION: 'かんじょう',

    // Toolbox categories
    TOOLBOX_SENTENCE: 'ぶん',
    TOOLBOX_SENTENCE_MODIFIER: 'ぶんしゅうしょく',
    TOOLBOX_VERBS: 'どうし',
    TOOLBOX_VERB_MODIFIERS: 'どうししゅうしょく',
    TOOLBOX_NOUNS: 'めいし',
    TOOLBOX_NOUN_MODIFIERS: 'めいししゅうしょく',

    // Toolbox section labels
    SECTION_TIME: '── じかん ──',
    SECTION_ASPECT: '── そう ──',
    SECTION_TENSE_ASPECT: '── じせい/そう ──',
    SECTION_IMPERATIVE: '── めいれいぶん ──',
    SECTION_MODAL_NEGATION: '── モダリティひてい ──',
    SECTION_MODAL: '── モダリティ ──',
    SECTION_MOTION: '── いどう ──',
    SECTION_ACTION: '── どうさ ──',
    SECTION_TRANSFER: '── じゅよ ──',
    SECTION_COGNITION: '── にんち ──',
    SECTION_COMMUNICATION: '── でんたつ ──',
    SECTION_STATE: '── じょうたい ──',
    SECTION_COORDINATION: '── とういせつぞく ──',
    SECTION_PRONOUNS: '── だいめいし ──',
    SECTION_PEOPLE: '── ひと ──',
    SECTION_ANIMALS: '── どうぶつ ──',
    SECTION_OBJECTS: '── もの ──',
    SECTION_PLACES: '── ばしょ ──',
    SECTION_ABSTRACT: '── ちゅうしょうがいねん ──',
    SECTION_ADJECTIVES: '── けいようし ──',
    SECTION_PREPOSITION: '── ぜんちし ──',
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: 'しぜんげんごのためのIDE',

    // Tabs
    TAB_BLOCKS: 'ブロック',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_COMING_SOON: 'じゅんびちゅう',

    // Panels
    PANEL_OUTPUT: 'しゅつりょく',
    PANEL_LINGUASCRIPT: 'LinguaScript',
    PANEL_GRAMMAR_CONSOLE: 'ぶんぽうコンソール',
    PANEL_AST: 'AST',

    // Placeholders
    PLACEHOLDER_OUTPUT: 'ブロックでぶんをくみたててください...',
    PLACEHOLDER_LINGUASCRIPT: '// ぶんをくみたてるとLinguaScriptがひょうじされます',
    PLACEHOLDER_GRAMMAR: 'ぶんぽうのせつめいがここにひょうじされます...',
    PLACEHOLDER_AST: '// ASTはまだせいせいされていません',

    // Errors
    ERROR_INCOMPLETE: '(ふかんぜん)',

    // Settings
    SHOW_AST: 'AST',
    LANGUAGE: 'げんご',
  },
};
