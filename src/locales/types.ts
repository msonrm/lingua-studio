// Locale types for lingua-studio

export type LocaleCode = 'en' | 'ja' | 'ja-hira';

// Blockly message keys (used with Blockly.Msg)
export interface BlocklyMessages {
  // Sentence blocks
  SENTENCE_LABEL: string;
  SENTENCE_TA_LABEL: string;
  SENTENCE_PREDICATE_LABEL: string;
  SENTENCE_TOOLTIP: string;

  // Modal wrapper
  MODAL_LABEL: string;
  MODAL_TOOLTIP: string;
  MODAL_ABILITY: string;
  MODAL_PERMISSION: string;
  MODAL_POSSIBILITY: string;
  MODAL_OBLIGATION: string;
  MODAL_CERTAINTY: string;
  MODAL_ADVICE: string;
  MODAL_VOLITION: string;
  MODAL_PREDICTION: string;

  // Imperative wrapper
  IMPERATIVE_LABEL: string;
  IMPERATIVE_TOOLTIP: string;

  // Question wrapper
  QUESTION_LABEL: string;
  QUESTION_TOOLTIP: string;

  // Negation sentence wrapper
  NEGATION_MODAL_LABEL: string;
  NEGATION_MODAL_TOOLTIP: string;

  // Time chips
  TIME_CHIP_CONCRETE_LABEL: string;
  TIME_CHIP_CONCRETE_TOOLTIP: string;
  TIME_CHIP_ASPECTUAL_LABEL: string;
  TIME_CHIP_ASPECTUAL_TOOLTIP: string;
  TIME_CHIP_ABSTRACT_LABEL: string;
  TIME_CHIP_ABSTRACT_TOOLTIP: string;
  TIME_CHIP_UNIFIED_LABEL: string;
  TIME_CHIP_UNIFIED_TOOLTIP: string;

  // Time options
  TIME_YESTERDAY: string;
  TIME_TODAY: string;
  TIME_TOMORROW: string;
  TIME_EVERY_DAY: string;
  TIME_LAST_SUNDAY: string;
  TIME_RIGHT_NOW: string;
  TIME_AT_THE_MOMENT: string;
  TIME_NEXT_WEEK: string;
  TIME_NOW: string;
  TIME_JUST_NOW: string;
  TIME_ALREADY_YET: string;
  TIME_STILL: string;
  TIME_RECENTLY: string;

  // Tense/Aspect options
  TENSE_PAST: string;
  TENSE_PRESENT: string;
  TENSE_FUTURE: string;
  ASPECT_SIMPLE: string;
  ASPECT_PROGRESSIVE: string;
  ASPECT_PERFECT: string;
  ASPECT_PERF_PROG: string;

  // Noun blocks
  PRONOUN_LABEL: string;
  PRONOUN_TOOLTIP: string;
  POSSESSIVE_PRONOUN_LABEL: string;
  POSSESSIVE_PRONOUN_TOOLTIP: string;
  HUMAN_LABEL: string;
  HUMAN_TOOLTIP: string;
  ANIMAL_LABEL: string;
  ANIMAL_TOOLTIP: string;
  OBJECT_LABEL: string;
  OBJECT_TOOLTIP: string;
  PLACE_LABEL: string;
  PLACE_TOOLTIP: string;
  ABSTRACT_LABEL: string;
  ABSTRACT_TOOLTIP: string;

  // Noun group labels
  GROUP_PERSONAL: string;
  GROUP_DEMONSTRATIVE: string;
  GROUP_INDEFINITE: string;
  GROUP_COMMON: string;
  GROUP_NAMES: string;
  GROUP_INTERROGATIVE: string;

  // Time group labels
  GROUP_PAST: string;
  GROUP_PRESENT: string;
  GROUP_FUTURE: string;

  // Preposition group labels
  GROUP_LOCATION: string;
  GROUP_DIRECTION: string;
  GROUP_RELATION: string;

  // Visualization Panel - Tense/Aspect
  VIZ_TENSE_ASPECT_TITLE: string;
  VIZ_TENSE_PAST: string;
  VIZ_TENSE_PRESENT: string;
  VIZ_TENSE_FUTURE: string;
  VIZ_LABEL_PAST: string;
  VIZ_LABEL_PRESENT: string;
  VIZ_LABEL_FUTURE: string;
  VIZ_ASPECT_SIMPLE: string;
  VIZ_ASPECT_PROGRESSIVE: string;
  VIZ_ASPECT_PERFECT: string;
  VIZ_ASPECT_PERF_PROG: string;

  // Visualization Panel - Prepositions
  VIZ_PREP_TITLE: string;
  VIZ_PREP_LOCATION: string;
  VIZ_PREP_DIRECTION: string;
  VIZ_PREP_RELATION: string;

  // Determiner
  DETERMINER_LABEL: string;
  DETERMINER_TOOLTIP: string;
  DETERMINER_NONE: string;
  DET_PLURAL: string;
  DET_UNCOUNTABLE: string;

  // Verb modifiers
  NEGATION_LABEL: string;
  NEGATION_TOOLTIP: string;
  FREQUENCY_LABEL: string;
  FREQUENCY_TOOLTIP: string;
  MANNER_LABEL: string;
  MANNER_TOOLTIP: string;
  LOCATIVE_LABEL: string;
  LOCATIVE_TOOLTIP: string;
  TIME_ADVERB_LABEL: string;
  TIME_ADVERB_TOOLTIP: string;

  // Prepositions
  PP_LABEL: string;
  PP_OBJECT_LABEL: string;
  PP_VERB_TOOLTIP: string;
  PP_NOUN_TOOLTIP: string;

  // Coordination (lowercase - linguistic)
  COORD_AND_LABEL: string;
  COORD_OR_LABEL: string;
  COORD_NOUN_AND_TOOLTIP: string;
  COORD_NOUN_OR_TOOLTIP: string;
  COORD_VERB_AND_TOOLTIP: string;
  COORD_VERB_OR_TOOLTIP: string;

  // Logic Extension (uppercase - propositional logic)
  FACT_LABEL: string;
  FACT_TOOLTIP: string;
  LOGIC_AND_LABEL: string;
  LOGIC_AND_TOOLTIP: string;
  LOGIC_OR_LABEL: string;
  LOGIC_OR_TOOLTIP: string;
  LOGIC_NOT_LABEL: string;
  LOGIC_NOT_TOOLTIP: string;
  LOGIC_IF_LABEL: string;
  LOGIC_THEN_LABEL: string;
  LOGIC_IF_TOOLTIP: string;
  LOGIC_BECAUSE_LABEL: string;
  LOGIC_EFFECT_LABEL: string;
  LOGIC_BECAUSE_TOOLTIP: string;
  SECTION_CONDITIONAL: string;
  TOOLBOX_LOGIC: string;

  // Choice question
  CHOICE_QUESTION_LABEL: string;
  CHOICE_QUESTION_OR: string;
  CHOICE_QUESTION_TOOLTIP: string;

  // Wh-placeholder
  WH_PLACEHOLDER_TOOLTIP: string;
  WH_ADVERB_TOOLTIP: string;

  // Verb categories
  VERB_MOTION: string;
  VERB_ACTION: string;
  VERB_TRANSFER: string;
  VERB_COGNITION: string;
  VERB_COMMUNICATION: string;
  VERB_STATE: string;

  // Semantic role labels (for verb argument slots)
  ROLE_AGENT: string;
  ROLE_PATIENT: string;
  ROLE_THEME: string;
  ROLE_EXPERIENCER: string;
  ROLE_STIMULUS: string;
  ROLE_RECIPIENT: string;
  ROLE_POSSESSOR: string;
  ROLE_ATTRIBUTE: string;
  ROLE_PLACE: string;
  ROLE_GOAL: string;
  ROLE_LOCATION: string;
  ROLE_SUBJECT: string;

  // Adjective categories
  ADJ_SIZE: string;
  ADJ_AGE: string;
  ADJ_COLOR: string;
  ADJ_PHYSICAL: string;
  ADJ_QUALITY: string;
  ADJ_EMOTION: string;

  // Toolbox categories
  TOOLBOX_SENTENCE: string;
  TOOLBOX_QUESTION: string;
  TOOLBOX_SENTENCE_MODIFIER: string;
  TOOLBOX_VERBS: string;
  TOOLBOX_VERB_MODIFIERS: string;
  TOOLBOX_NOUNS: string;
  TOOLBOX_NOUN_MODIFIERS: string;

  // Toolbox section labels
  SECTION_TIME: string;
  SECTION_ASPECT: string;
  SECTION_TENSE_ASPECT: string;
  SECTION_QUESTION: string;
  SECTION_IMPERATIVE: string;
  SECTION_MODAL_NEGATION: string;
  SECTION_MODAL: string;
  SECTION_MOTION: string;
  SECTION_ACTION: string;
  SECTION_TRANSFER: string;
  SECTION_COGNITION: string;
  SECTION_COMMUNICATION: string;
  SECTION_STATE: string;
  SECTION_COORDINATION: string;
  SECTION_PRONOUNS: string;
  SECTION_PEOPLE: string;
  SECTION_ANIMALS: string;
  SECTION_OBJECTS: string;
  SECTION_PLACES: string;
  SECTION_ABSTRACT: string;
  SECTION_ADJECTIVES: string;
  SECTION_PREPOSITION: string;
  SECTION_WH_NOUNS: string;
  SECTION_WH_ADVERBS: string;
}

// Grammar log messages (for GrammarPanel)
export interface GrammarMessages {
  // Transform types
  TYPE_AGREEMENT: string;
  TYPE_TENSE: string;
  TYPE_ASPECT: string;
  TYPE_CASE: string;
  TYPE_ARTICLE: string;
  TYPE_MODAL: string;
  TYPE_NEGATION: string;
  TYPE_DO_SUPPORT: string;
  TYPE_INVERSION: string;
  TYPE_WH_MOVEMENT: string;

  // Agreement rules
  AGREEMENT_3SG: string;
  AGREEMENT_3SG_DESC: string;
  AGREEMENT_PLURAL: string;
  AGREEMENT_PLURAL_DESC: string;

  // Tense rules
  TENSE_PAST: string;
  TENSE_PAST_DESC: string;
  TENSE_FUTURE: string;
  TENSE_FUTURE_DESC: string;

  // Aspect rules
  ASPECT_PROGRESSIVE: string;
  ASPECT_PROGRESSIVE_DESC: string;
  ASPECT_PERFECT: string;
  ASPECT_PERFECT_DESC: string;
  ASPECT_PERF_PROG: string;
  ASPECT_PERF_PROG_DESC: string;

  // Case rules
  CASE_OBJECTIVE: string;
  CASE_OBJECTIVE_DESC: string;
  CASE_WHO_WHOM: string;
  CASE_WHO_WHOM_DESC: string;

  // Article rules
  ARTICLE_A_AN: string;
  ARTICLE_A_AN_DESC: string;
  ARTICLE_SILENT_H: string;

  // Number rules
  NUMBER_PLURAL: string;
  NUMBER_PLURAL_DESC: string;

  // Polarity rules
  POLARITY_NEGATIVE: string;
  POLARITY_NEGATIVE_DESC: string;

  // Modal rules
  MODAL_PAST: string;
  MODAL_PAST_DESC: string;

  // Syntax rules
  DO_SUPPORT_QUESTION: string;
  DO_SUPPORT_QUESTION_DESC: string;
  INVERSION_QUESTION: string;
  INVERSION_QUESTION_DESC: string;
  WH_MOVEMENT_FRONT: string;
  WH_MOVEMENT_FRONT_DESC: string;

  // Empty state
  EMPTY_NO_TRANSFORMATIONS: string;
}

// React UI message keys
export interface UIMessages {
  // Header
  APP_TITLE: string;
  APP_SUBTITLE: string;

  // Tabs
  TAB_BLOCKS: string;
  TAB_LINGUASCRIPT: string;
  TAB_AST: string;
  TAB_COMING_SOON: string;

  // Panels
  PANEL_OUTPUT: string;
  PANEL_LINGUASCRIPT: string;
  PANEL_GRAMMAR_CONSOLE: string;
  PANEL_AST: string;

  // Placeholders
  PLACEHOLDER_OUTPUT: string;
  PLACEHOLDER_LINGUASCRIPT: string;
  PLACEHOLDER_GRAMMAR: string;
  PLACEHOLDER_AST: string;

  // Errors
  ERROR_INCOMPLETE: string;

  // Settings
  SHOW_AST: string;
  LANGUAGE: string;

  // Copy button
  COPY: string;
  COPIED: string;
  COPY_FOR_AI: string;
}

export interface LocaleData {
  code: LocaleCode;
  name: string;
  blockly: BlocklyMessages;
  ui: UIMessages;
  grammar: GrammarMessages;
}
