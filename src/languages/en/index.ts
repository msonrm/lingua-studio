/**
 * 英語の言語パック
 *
 * 語彙（`lexicon.ts`）と形態論（`morphology.ts` / `determiners.ts`）をまとめ、
 * レンダラーへ供給する。
 */

import type { LanguagePack, LanguageForms, UserEntryField } from '../types';
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
 * 規則変化なら lemma から導出できるため、活用形はすべて任意。
 * 空欄なら `findVerb()` のフォールバックが base + ed/ing/s を生成する。
 */
const userEntryFields: UserEntryField[] = [
  { key: 'past', label: 'DICT_FIELD_PAST', kind: 'text', required: false, placeholder: 'prepared' },
  { key: 'pp', label: 'DICT_FIELD_PP', kind: 'text', required: false, placeholder: 'prepared' },
  { key: 'ing', label: 'DICT_FIELD_ING', kind: 'text', required: false, placeholder: 'preparing' },
  { key: 's', label: 'DICT_FIELD_S', kind: 'text', required: false, placeholder: 'prepares' },
  { key: 'plural', label: 'DICT_FIELD_PLURAL', kind: 'text', required: false, placeholder: 'apples' },
];

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
