/**
 * 英語の言語パック
 *
 * 語彙（`lexicon.ts`）と形態論（`morphology.ts` / `determiners.ts`）をまとめ、
 * レンダラーへ供給する。
 */

import type { LanguagePack, LanguageForms, UserEntryField, PartOfSpeech } from '../types';
import type { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry } from '../../types/schema';
import { findVerb, findNoun, findAdjective, findAdverb } from './lexicon';

export interface EnglishForms extends LanguageForms {
  verb: VerbEntry;
  noun: NounEntry;
  adjective: AdjectiveEntry;
  adverb: AdverbEntry;
}

/**
 * ユーザー辞書に英語の語を追加するときの入力項目
 *
 * 規則変化は lemma から導出できるため、すべて任意。
 * 空欄なら規則変化（base + ed/ing/s、名詞は + s）が使われる。
 */
const userEntryFields: Record<PartOfSpeech, UserEntryField[]> = {
  verb: [
    { key: 'past', label: 'DICT_FIELD_PAST', kind: 'text', required: false, placeholder: 'prepared' },
    { key: 'pp', label: 'DICT_FIELD_PP', kind: 'text', required: false, placeholder: 'prepared' },
    { key: 'ing', label: 'DICT_FIELD_ING', kind: 'text', required: false, placeholder: 'preparing' },
    { key: 's', label: 'DICT_FIELD_S', kind: 'text', required: false, placeholder: 'prepares' },
  ],
  noun: [
    { key: 'plural', label: 'DICT_FIELD_PLURAL', kind: 'text', required: false, placeholder: 'notebooks' },
  ],
  adjective: [
    { key: 'comparative', label: 'DICT_FIELD_COMPARATIVE', kind: 'text', required: false, placeholder: 'tidier' },
    { key: 'superlative', label: 'DICT_FIELD_SUPERLATIVE', kind: 'text', required: false, placeholder: 'tidiest' },
  ],
  adverb: [],
};

export const english: LanguagePack<EnglishForms> = {
  code: 'en',
  name: 'English',
  lookupVerb: findVerb,
  lookupNoun: findNoun,
  lookupAdjective: findAdjective,
  lookupAdverb: findAdverb,
  userEntryFields,
};

// 語彙・形態論の直接利用（レンダラーは具体的な型を必要とするため）
export * from './lexicon';
