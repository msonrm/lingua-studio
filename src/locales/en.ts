import type { LocaleData } from './types';

export const en: LocaleData = {
  code: 'en',
  name: 'English',
  blockly: {
    // Sentence blocks
    SENTENCE_LABEL: 'SENTENCE',
    SENTENCE_TA_LABEL: 'T/A:',
    SENTENCE_PREDICATE_LABEL: 'predicate:',
    SENTENCE_TOOLTIP: 'The root of a sentence, specifying tense and aspect',

    // Modal wrapper
    MODAL_LABEL: 'MODAL',
    MODAL_TOOLTIP: 'Modal: adds modality (ability, permission, obligation, etc.) to the sentence',
    MODAL_ABILITY: 'Ability (can)',
    MODAL_PERMISSION: 'Permission (may)',
    MODAL_POSSIBILITY: 'Possibility (might)',
    MODAL_OBLIGATION: 'Obligation (must)',
    MODAL_CERTAINTY: 'Certainty (must)',
    MODAL_ADVICE: 'Advice (should)',
    MODAL_VOLITION: 'Volition (will)',
    MODAL_PREDICTION: 'Prediction (will)',

    // Imperative wrapper
    IMPERATIVE_LABEL: 'IMPERATIVE',
    IMPERATIVE_TOOLTIP: "Imperative: creates a command (e.g., 'Eat the apple!')",

    // Question wrapper
    QUESTION_LABEL: 'QUESTION',
    QUESTION_TOOLTIP: "Question: creates a question (e.g., 'Do you like apples?')",

    // Negation sentence wrapper
    NEGATION_MODAL_LABEL: 'NOT (modal)',
    NEGATION_MODAL_TOOLTIP: "Negates the modality (e.g., 'need not', 'don't have to')",

    // Time chips
    TIME_CHIP_CONCRETE_LABEL: 'TIME',
    TIME_CHIP_CONCRETE_TOOLTIP: 'Concrete time specification (when?)',
    TIME_CHIP_ASPECTUAL_LABEL: 'ASPECT',
    TIME_CHIP_ASPECTUAL_TOOLTIP: 'Aspectual marker (progressive, perfect, etc.)',
    TIME_CHIP_ABSTRACT_LABEL: 'TENSE/ASPECT',
    TIME_CHIP_ABSTRACT_TOOLTIP: 'Tense/aspect modifier (affects verb conjugation)',
    TIME_CHIP_UNIFIED_LABEL: 'Tense/Aspect',
    TIME_CHIP_UNIFIED_TOOLTIP: 'Unified Tense/Aspect: select both independently',

    // Time options
    TIME_YESTERDAY: 'Yesterday',
    TIME_TODAY: 'Today',
    TIME_TOMORROW: 'Tomorrow',
    TIME_EVERY_DAY: 'Every day',
    TIME_LAST_SUNDAY: 'Last Sunday',
    TIME_RIGHT_NOW: 'Right now',
    TIME_AT_THE_MOMENT: 'At the moment',
    TIME_NEXT_WEEK: 'Next week',
    TIME_NOW: 'Now',
    TIME_JUST_NOW: 'Just now',
    TIME_ALREADY_YET: 'Already/Yet',
    TIME_STILL: 'Still',
    TIME_RECENTLY: 'Recently',

    // Tense/Aspect options
    TENSE_PAST: '[Past]',
    TENSE_PRESENT: '[Present]',
    TENSE_FUTURE: '[Future]',
    ASPECT_SIMPLE: '[Simple]',
    ASPECT_PROGRESSIVE: '[Progressive]',
    ASPECT_PERFECT: '[Perfect]',
    ASPECT_PERF_PROG: '[Perf. Prog.]',

    // Noun blocks
    PRONOUN_LABEL: 'PRONOUN',
    PRONOUN_TOOLTIP: 'A pronoun (I, you, he, this, someone, etc.) - no determiner needed',
    POSSESSIVE_PRONOUN_LABEL: 'POSSESSIVE',
    POSSESSIVE_PRONOUN_TOOLTIP: 'A possessive pronoun (mine, yours, his, hers, ours, theirs) - refers to a possessed thing',
    HUMAN_LABEL: 'HUMAN',
    HUMAN_TOOLTIP: 'A human (father, teacher, John, etc.)',
    ANIMAL_LABEL: 'ANIMAL',
    ANIMAL_TOOLTIP: 'An animal (cat, dog, bird, etc.)',
    OBJECT_LABEL: 'OBJECT',
    OBJECT_TOOLTIP: 'An object (apple, book, pen, water, etc.)',
    PLACE_LABEL: 'PLACE',
    PLACE_TOOLTIP: 'A place (park, school, Tokyo, etc.)',
    ABSTRACT_LABEL: 'ABSTRACT',
    ABSTRACT_TOOLTIP: 'An abstract concept (idea, love, music, etc.)',

    // Noun group labels
    GROUP_PERSONAL: '── Personal ──',
    GROUP_DEMONSTRATIVE: '── Demonstrative ──',
    GROUP_INDEFINITE: '── Indefinite ──',
    GROUP_COMMON: '── Common ──',
    GROUP_NAMES: '── Names ──',
    GROUP_INTERROGATIVE: '── Interrogative ──',

    // Time group labels
    GROUP_PAST: '── Past ──',
    GROUP_PRESENT: '── Present ──',
    GROUP_FUTURE: '── Future ──',

    // Preposition group labels
    GROUP_LOCATION: '── Location ──',
    GROUP_DIRECTION: '── Direction ──',
    GROUP_RELATION: '── Relation ──',

    // Visualization Panel - Tense/Aspect
    VIZ_TENSE_ASPECT_TITLE: 'Tense & Aspect',
    VIZ_TENSE_PAST: 'Past',
    VIZ_TENSE_PRESENT: 'Now',
    VIZ_TENSE_FUTURE: 'Future',
    VIZ_LABEL_PAST: 'Past',
    VIZ_LABEL_PRESENT: 'Present',
    VIZ_LABEL_FUTURE: 'Future',
    VIZ_ASPECT_SIMPLE: 'Simple',
    VIZ_ASPECT_PROGRESSIVE: 'Progressive',
    VIZ_ASPECT_PERFECT: 'Perfect',
    VIZ_ASPECT_PERF_PROG: 'Perf. Prog.',

    // Visualization Panel - Prepositions
    VIZ_PREP_TITLE: 'Prepositions',
    VIZ_PREP_LOCATION: 'Location',
    VIZ_PREP_DIRECTION: 'Direction',
    VIZ_PREP_RELATION: 'Relation',

    // Determiner
    DETERMINER_LABEL: 'DET',
    DETERMINER_TOOLTIP: 'Determiner: pre + central + post',
    DET_NONE: '[∅]',
    DET_PLURAL: '[plural]',
    DET_UNCOUNTABLE: '[uncountable]',
    DET_LABEL_ARTICLE: '── Article ──',
    DET_LABEL_DEMONSTRATIVE: '── Demonstrative ──',
    DET_LABEL_POSSESSIVE: '── Possessive ──',
    DET_LABEL_DISTRIBUTIVE: '── Distributive ──',
    DET_LABEL_QUANTITY: '── Quantity ──',

    // Verb modifiers
    NEGATION_LABEL: 'NOT',
    NEGATION_TOOLTIP: 'Negation: makes the action negative',
    FREQUENCY_LABEL: 'FREQ',
    FREQUENCY_TOOLTIP: 'Frequency: how often the action occurs',
    MANNER_LABEL: 'MANNER',
    MANNER_TOOLTIP: 'Manner: how the action is performed',
    LOCATIVE_LABEL: 'LOCATION',
    LOCATIVE_TOOLTIP: 'Location: where the action occurs',
    TIME_ADVERB_LABEL: 'TIME',
    TIME_ADVERB_TOOLTIP: 'Time: when the action occurs',

    // Prepositions
    PP_LABEL: 'PP',
    PP_OBJECT_LABEL: 'object:',
    PP_VERB_TOOLTIP: 'Prepositional Phrase (Verb): adds a prepositional phrase to a verb',
    PP_NOUN_TOOLTIP: 'Prepositional Phrase (Noun): modifies a noun with a prepositional phrase',

    // Coordination (lowercase - linguistic)
    COORD_AND_LABEL: 'and',
    COORD_OR_LABEL: 'or',
    COORD_NOUN_AND_TOOLTIP: 'Coordination (Noun): connects two noun phrases with and',
    COORD_NOUN_OR_TOOLTIP: 'Coordination (Noun): connects two noun phrases with or',
    COORD_VERB_AND_TOOLTIP: 'Coordination (Verb): connects two verb phrases with and',
    COORD_VERB_OR_TOOLTIP: 'Coordination (Verb): connects two verb phrases with or',

    // Logic Extension (uppercase - propositional logic)
    FACT_LABEL: 'fact',
    FACT_TOOLTIP: 'Declares a logical fact (assertion). Exclusive with sentence/modal.',
    LOGIC_AND_LABEL: 'AND',
    LOGIC_AND_TOOLTIP: 'Logical conjunction (AND): both propositions must be true',
    LOGIC_OR_LABEL: 'OR',
    LOGIC_OR_TOOLTIP: 'Logical disjunction (OR): at least one proposition must be true',
    LOGIC_NOT_LABEL: 'NOT',
    LOGIC_NOT_TOOLTIP: 'Logical negation (NOT): the proposition is false',
    LOGIC_IF_LABEL: 'IF',
    LOGIC_THEN_LABEL: 'THEN',
    LOGIC_IF_TOOLTIP: 'Conditional (IF...THEN): if the condition is true, the consequence follows',
    LOGIC_BECAUSE_LABEL: 'BECAUSE',
    LOGIC_EFFECT_LABEL: 'EFFECT',
    LOGIC_BECAUSE_TOOLTIP: 'Causation (BECAUSE...EFFECT): the cause leads to the effect',
    SECTION_CONDITIONAL: '── Conditional ──',
    TOOLBOX_LOGIC: 'Logic',

    // Choice question
    CHOICE_QUESTION_LABEL: '?which',
    CHOICE_QUESTION_OR: 'or',
    CHOICE_QUESTION_TOOLTIP: 'Choice Question: asks which option (e.g., "tea or coffee?")',

    // Wh-placeholder
    WH_PLACEHOLDER_TOOLTIP: 'Wh-question word: who (person) or what (thing)',
    WH_ADVERB_TOOLTIP: 'Wh-adverb: where (place), when (time), or how (manner)',

    // Verb categories
    VERB_MOTION: 'MOTION',
    VERB_ACTION: 'ACTION',
    VERB_TRANSFER: 'TRANSFER',
    VERB_COGNITION: 'COGNITION',
    VERB_COMMUNICATION: 'COMMUNICATION',
    VERB_STATE: 'STATE',

    // Semantic role labels
    ROLE_AGENT: 'agent',
    ROLE_PATIENT: 'patient',
    ROLE_THEME: 'theme',
    ROLE_EXPERIENCER: 'experiencer',
    ROLE_STIMULUS: 'stimulus',
    ROLE_RECIPIENT: 'recipient',
    ROLE_POSSESSOR: 'possessor',
    ROLE_ATTRIBUTE: 'attribute',
    ROLE_PLACE: 'place',
    ROLE_GOAL: 'goal',
    ROLE_LOCATION: 'location',
    ROLE_SUBJECT: 'subject',

    // Adjective categories
    ADJ_SIZE: 'SIZE',
    ADJ_AGE: 'AGE',
    ADJ_COLOR: 'COLOR',
    ADJ_PHYSICAL: 'PHYSICAL',
    ADJ_QUALITY: 'QUALITY',
    ADJ_EMOTION: 'EMOTION',

    // Toolbox categories
    TOOLBOX_SENTENCE: 'Sentence',
    TOOLBOX_QUESTION: 'Question',
    TOOLBOX_SENTENCE_MODIFIER: 'Sentence Modifier',
    TOOLBOX_VERBS: 'Verbs',
    TOOLBOX_VERB_MODIFIERS: 'Verb Modifiers',
    TOOLBOX_NOUNS: 'Nouns',
    TOOLBOX_NOUN_MODIFIERS: 'Noun Modifiers',

    // Toolbox section labels
    SECTION_TIME: '── Time ──',
    SECTION_ASPECT: '── Aspect ──',
    SECTION_TENSE_ASPECT: '── Tense/Aspect ──',
    SECTION_QUESTION: '── Question ──',
    SECTION_IMPERATIVE: '── Imperative ──',
    SECTION_MODAL_NEGATION: '── Modal Negation ──',
    SECTION_MODAL: '── Modal ──',
    SECTION_MOTION: '── Motion ──',
    SECTION_ACTION: '── Action ──',
    SECTION_TRANSFER: '── Transfer ──',
    SECTION_COGNITION: '── Cognition ──',
    SECTION_COMMUNICATION: '── Communication ──',
    SECTION_STATE: '── State ──',
    SECTION_COORDINATION: '── Coordination ──',
    SECTION_PRONOUNS: '── Pronouns ──',
    SECTION_PEOPLE: '── People ──',
    SECTION_ANIMALS: '── Animals ──',
    SECTION_OBJECTS: '── Objects ──',
    SECTION_PLACES: '── Places ──',
    SECTION_ABSTRACT: '── Abstract ──',
    SECTION_ADJECTIVES: '── Adjectives ──',
    SECTION_PREPOSITION: '── Preposition ──',
    SECTION_WH_NOUNS: '── Wh-Nouns ──',
    SECTION_WH_ADVERBS: '── Wh-Adverbs ──',
  },
  ui: {
    // Header
    APP_TITLE: 'Lingua Studio',
    APP_SUBTITLE: 'IDE for Natural Language',

    // Tabs
    TAB_BLOCKS: 'Blocks',
    TAB_LINGUASCRIPT: 'LinguaScript',
    TAB_AST: 'AST',
    TAB_COMING_SOON: 'Coming soon',
    TAB_GRAMMAR: 'Grammar',
    TAB_TIMELINE: 'Timeline',

    // Panels
    PANEL_OUTPUT: 'Output',
    PANEL_LINGUASCRIPT: 'LinguaScript',
    PANEL_GRAMMAR_CONSOLE: 'Grammar Console',
    PANEL_AST: 'AST',

    // Placeholders
    PLACEHOLDER_OUTPUT: 'Build a sentence using blocks...',
    PLACEHOLDER_LINGUASCRIPT: '// Build a sentence to see LinguaScript',
    PLACEHOLDER_GRAMMAR: 'Grammar explanations will appear here...',
    PLACEHOLDER_AST: '// No AST generated yet',

    // Errors
    ERROR_INCOMPLETE: '(incomplete)',

    // Settings
    SHOW_AST: 'AST',
    LANGUAGE: 'Language',

    // Copy button
    COPY: 'Copy',
    COPIED: 'Copied!',
    COPY_FOR_AI: 'Copy for AI',
  },
  grammar: {
    // Transform types
    TYPE_AGREEMENT: 'Agreement',
    TYPE_TENSE: 'Tense',
    TYPE_ASPECT: 'Aspect',
    TYPE_CASE: 'Case',
    TYPE_ARTICLE: 'Article',
    TYPE_MODAL: 'Modal',
    TYPE_NEGATION: 'Negation',
    TYPE_DO_SUPPORT: 'Do-support',
    TYPE_INVERSION: 'Inversion',
    TYPE_WH_MOVEMENT: 'Wh-movement',
    TYPE_IMPERATIVE: 'Imperative',

    // Agreement rules
    AGREEMENT_3SG: '+s',
    AGREEMENT_3SG_DESC: 'Subject is 3rd person singular',
    AGREEMENT_PLURAL: 'plural',
    AGREEMENT_PLURAL_DESC: 'Subject is plural',

    // Tense rules
    TENSE_PAST: '-ed',
    TENSE_PAST_DESC: 'Past tense',
    TENSE_FUTURE: 'will + base',
    TENSE_FUTURE_DESC: 'Future tense',

    // Aspect rules
    ASPECT_PROGRESSIVE: 'be + -ing',
    ASPECT_PROGRESSIVE_DESC: 'Progressive aspect',
    ASPECT_PERFECT: 'have + past participle',
    ASPECT_PERFECT_DESC: 'Perfect aspect',
    ASPECT_PERF_PROG: 'have + been + -ing',
    ASPECT_PERF_PROG_DESC: 'Perfect progressive aspect',

    // Case rules
    CASE_OBJECTIVE: 'objective case',
    CASE_OBJECTIVE_DESC: 'Object position',
    CASE_WHO_WHOM: 'who → whom',
    CASE_WHO_WHOM_DESC: 'Object position',

    // Article rules
    ARTICLE_A_AN: 'a → an',
    ARTICLE_A_AN_DESC: 'Before vowel sound',
    ARTICLE_SILENT_H: 'Silent h',

    // Number rules
    NUMBER_PLURAL: 'pluralization',
    NUMBER_PLURAL_DESC: 'Number: plural',

    // Polarity rules
    POLARITY_NEGATIVE: 'polarity',
    POLARITY_NEGATIVE_DESC: 'Negative context',

    // Modal rules
    MODAL_PAST: 'past form',
    MODAL_PAST_DESC: 'Modal in past tense',

    // Syntax rules
    DO_SUPPORT_QUESTION: 'do',
    DO_SUPPORT_QUESTION_DESC: 'Question formation requires do-support',
    INVERSION_QUESTION: 'inversion',
    INVERSION_QUESTION_DESC: 'Subject-auxiliary inversion',
    WH_MOVEMENT_FRONT: 'wh-fronting',
    WH_MOVEMENT_FRONT_DESC: 'Wh-word moves to front',

    // Imperative rules
    IMPERATIVE_SUBJECT_OMISSION: 'subject omission',
    IMPERATIVE_SUBJECT_OMISSION_DESC: 'Imperative omits subject you',

    // Empty state
    EMPTY_NO_TRANSFORMATIONS: 'No transformations',
  },
};
