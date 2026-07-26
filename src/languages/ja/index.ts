/**
 * 日本語の言語パック
 *
 * 語彙（`lexicon.ts`）と形態論（`morphology.ts`）をまとめ、レンダラーへ供給する。
 */

import type { LanguagePack, LanguageForms, UserEntryField, PartOfSpeech } from '../types';
import {
  getVerbEntry,
  translateNoun,
  translateAdjective,
  translateAdverb,
  type VerbEntry,
  type VerbType,
} from './lexicon';
import { findUserForms } from '../../userDictionary';

export interface JapaneseForms extends LanguageForms {
  /** 辞書形 + 活用タイプ */
  verb: VerbEntry;
  /** 表層形（名詞は活用しないので文字列1つでよい） */
  noun: string;
  /** 連体形。述語・連用修飾での形は `analyzeAdjective()` が導出する */
  adjective: string;
  adverb: string;
}

/**
 * ユーザー辞書に日本語の語を追加するときの入力項目
 *
 * ⚠ 動詞の活用タイプは**表層形から推論できない**ので必須にしている。
 *    走る（五段）と食べる（一段）は語尾が同じ「る」だが活用が違う。
 *    英語のように「空欄なら規則変化から導出」という逃げ道がない。
 */
const translation = (placeholder: string): UserEntryField => ({
  key: 'ja',
  label: 'DICT_FIELD_JA',
  kind: 'text',
  required: true,
  placeholder,
});

const userEntryFields: Record<PartOfSpeech, UserEntryField[]> = {
  verb: [
    translation('準備する'),
    {
      key: 'verbType',
      label: 'DICT_FIELD_JA_VERB_TYPE',
      kind: 'select',
      required: true,
      options: [
        { value: 'godan', label: '五段（走る・書く）' },
        { value: 'ichidan', label: '一段（食べる・見る）' },
        { value: 'suru', label: 'サ変（〜する）' },
        { value: 'kuru', label: 'カ変（来る）' },
      ],
    },
  ],
  // 活用しない品詞は訳語だけでよい。形容詞は連体形で入れてもらう
  noun: [translation('ノート')],
  adjective: [translation('きちんとした')],
  adverb: [translation('きちんと')],
};

/**
 * ベース辞書 → ユーザー辞書 の順で引く
 *
 * `getVerbEntry` は未登録でも既定値（lemma + 五段）を返すので、ここで未登録を判別する。
 */
function lookupVerb(lemma: string): VerbEntry | undefined {
  const base = getVerbEntry(lemma);
  if (base.ja !== lemma) return base;

  const user = findUserForms(lemma, 'ja');
  if (user?.ja) {
    // 活用タイプが無ければ五段とみなす（ユーザー辞書では必須入力にしているので通常は入る）
    return { ja: user.ja, type: (user.verbType as VerbType) ?? 'godan' };
  }
  return undefined;
}

/**
 * ベース辞書 → ユーザー辞書 の順で引く
 *
 * `translate*` は未登録なら lemma をそのまま返すので、ここで未登録を判別する。
 */
const lookupBy = (translate: (lemma: string) => string) => (lemma: string): string | undefined => {
  const form = translate(lemma);
  if (form !== lemma) return form;
  return findUserForms(lemma, 'ja')?.ja;
};

export const japanese: LanguagePack<JapaneseForms> = {
  code: 'ja',
  name: '日本語',
  lookupVerb,
  lookupNoun: lookupBy(translateNoun),
  lookupAdjective: lookupBy(translateAdjective),
  lookupAdverb: lookupBy(translateAdverb),
  userEntryFields,
};

// 語彙・形態論の直接利用（レンダラーは具体的な型を必要とするため）
export * from './lexicon';
