/**
 * ツールボックス（左側のブロックパレット）の構築
 *
 * 拡張辞書の内容を反映するため、ロケール切り替えや辞書変更のたびに再生成する。
 */

import { getExtVerbs, getExtNouns } from '../data/dictionary-ext';
import type { VerbCategory, NounCategory } from '../types/schema';
import { COLORS, msg } from './shared';

// ============================================
// ツールボックス用ヘルパー関数
// ============================================

// 名詞ツールボックスの内容を動的に生成
function buildNounToolboxContents() {
  const extNouns = getExtNouns();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [];

  // 代名詞セクション（拡張なし）
  contents.push({ kind: 'label', text: msg('SECTION_PRONOUNS', '── Pronouns ──') });
  contents.push({ kind: 'block', type: 'pronoun_block' });
  contents.push({ kind: 'block', type: 'possessive_pronoun_block' });

  // カテゴリ定義（NounCategory: human, animal, object, place, abstract）
  const categories: { category: NounCategory; section: string; fallback: string; baseBlock: string }[] = [
    { category: 'human', section: 'SECTION_PEOPLE', fallback: '── People ──', baseBlock: 'human_block' },
    { category: 'animal', section: 'SECTION_ANIMALS', fallback: '── Animals ──', baseBlock: 'animal_block' },
    { category: 'object', section: 'SECTION_OBJECTS', fallback: '── Objects ──', baseBlock: 'object_block' },
    { category: 'place', section: 'SECTION_PLACES', fallback: '── Places ──', baseBlock: 'place_block' },
    { category: 'abstract', section: 'SECTION_ABSTRACT', fallback: '── Abstract ──', baseBlock: 'abstract_block' },
  ];

  for (const { category, section, fallback, baseBlock } of categories) {
    // セクションラベル
    contents.push({ kind: 'label', text: msg(section, fallback) });
    // ベースブロック（限定詞でラップ）
    contents.push({
      kind: 'block',
      type: 'determiner_unified',
      inputs: {
        NOUN: { block: { type: baseBlock } }
      }
    });

    // 拡張ブロック（同じセクション内に追加、存在する場合のみ）
    const extNounsInCategory = extNouns.filter(n => n.category === category);
    if (extNounsInCategory.length > 0) {
      contents.push({
        kind: 'block',
        type: 'determiner_unified',
        inputs: {
          NOUN: { block: { type: `noun_${category}_ext` } }
        }
      });
    }
  }

  return contents;
}

// 動詞ツールボックスの内容を動的に生成
function buildVerbToolboxContents() {
  const extVerbs = getExtVerbs();
  const contents: { kind: string; text?: string; type?: string }[] = [];

  // カテゴリ定義
  const categories: { category: VerbCategory; section: string; fallback: string }[] = [
    { category: 'action', section: 'SECTION_ACTION', fallback: '── Action ──' },
    { category: 'motion', section: 'SECTION_MOTION', fallback: '── Motion ──' },
    { category: 'state', section: 'SECTION_STATE', fallback: '── State ──' },
    { category: 'communication', section: 'SECTION_COMMUNICATION', fallback: '── Communication ──' },
    { category: 'cognition', section: 'SECTION_COGNITION', fallback: '── Cognition ──' },
    { category: 'transfer', section: 'SECTION_TRANSFER', fallback: '── Transfer ──' },
  ];

  for (const { category, section, fallback } of categories) {
    // セクションラベル
    contents.push({ kind: 'label', text: msg(section, fallback) });
    // ベースブロック
    contents.push({ kind: 'block', type: `verb_${category}` });

    // 拡張ブロック（同じセクション内に追加、存在する場合のみ）
    const extVerbsInCategory = extVerbs.filter(v => v.category === category);
    if (extVerbsInCategory.length > 0) {
      contents.push({ kind: 'block', type: `verb_${category}_ext` });
    }
  }

  return contents;
}

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
        contents: buildVerbToolboxContents()
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
        contents: buildNounToolboxContents()
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

