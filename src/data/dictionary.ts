/**
 * dictionary.ts - 統合辞書
 *
 * 役割:
 * - Core（言語非依存）+ Forms（英語）のマージ
 * - ルックアップ関数（findVerb, findNoun 等）
 *
 * 参照元:
 * - blocks/definitions.ts: ドロップダウン選択肢
 * - compiler/englishRenderer.ts: 活用形取得
 * - compiler/astGenerator.ts: 語彙情報取得
 */

import { VerbEntry, NounEntry, AdjectiveEntry, AdverbEntry, PronounEntry, VerbCategory, AdjectiveCategory, NounCategory } from '../types/schema';

// Core（言語非依存）
import { verbCores, nounCores, pronounCores, adjectiveCores, adverbCores } from './dictionary-core';

// English Forms（英語固有）
import { verbFormsEn, nounFormsEn, pronounFormsEn, adjectiveFormsEn } from './dictionary-en';

// ============================================
// マージ関数
// ============================================

/**
 * VerbCore + VerbForms → VerbEntry
 */
function mergeVerbs(): VerbEntry[] {
  return verbCores.map((core) => {
    const forms = verbFormsEn.find((f) => f.lemma === core.lemma);
    if (!forms) {
      // フォールバック: 規則活用を生成
      const base = core.lemma;
      return {
        ...core,
        forms: {
          base,
          past: base + "ed",
          pp: base + "ed",
          ing: base + "ing",
          s: base + "s",
        },
      };
    }
    return {
      ...core,
      forms: forms.forms,
    };
  });
}

/**
 * NounCore + NounForms → NounEntry
 */
function mergeNouns(): NounEntry[] {
  return nounCores.map((core) => {
    const forms = nounFormsEn.find((f) => f.lemma === core.lemma);
    return {
      ...core,
      plural: forms?.plural ?? core.lemma + "s",
    };
  });
}

/**
 * PronounCore + PronounForms → PronounEntry
 */
function mergePronouns(): PronounEntry[] {
  return pronounCores.map((core) => {
    const forms = pronounFormsEn.find((f) => f.lemma === core.lemma);
    return {
      ...core,
      objectForm: forms?.objectForm ?? core.lemma,
      possessive: forms?.possessive,
      negativeForm: forms?.negativeForm,
    };
  });
}

/**
 * AdjectiveCore + AdjectiveForms → AdjectiveEntry
 */
function mergeAdjectives(): AdjectiveEntry[] {
  return adjectiveCores.map((core) => {
    const forms = adjectiveFormsEn.find((f) => f.lemma === core.lemma);
    return {
      ...core,
      comparative: forms?.comparative,
      superlative: forms?.superlative,
    };
  });
}

/**
 * AdverbCore → AdverbEntry（副詞は活用なし）
 */
function mergeAdverbs(): AdverbEntry[] {
  return adverbCores.map((core) => ({
    lemma: core.lemma,
    type: core.type,
    polaritySensitive: core.polaritySensitive,
  }));
}

// ============================================
// エクスポート（後方互換性を維持）
// ============================================

export const verbs: VerbEntry[] = mergeVerbs();
export const nouns: NounEntry[] = mergeNouns();
export const pronouns: PronounEntry[] = mergePronouns();
export const adjectives: AdjectiveEntry[] = mergeAdjectives();
export const adverbs: AdverbEntry[] = mergeAdverbs();

// ============================================
// ヘルパー関数
// ============================================

export const findVerb = (lemma: string): VerbEntry | undefined =>
  verbs.find((v) => v.lemma === lemma);

export const findNoun = (lemma: string): NounEntry | undefined =>
  nouns.find((n) => n.lemma === lemma);

export const findAdjective = (lemma: string): AdjectiveEntry | undefined =>
  adjectives.find((a) => a.lemma === lemma);

export const findAdverb = (lemma: string): AdverbEntry | undefined =>
  adverbs.find((a) => a.lemma === lemma);

export const findPronoun = (lemma: string): PronounEntry | undefined =>
  pronouns.find((p) => p.lemma === lemma);


export const getVerbsByCategory = (category: VerbCategory): VerbEntry[] =>
  verbs.filter((v) => v.category === category);

export const getAdjectivesByCategory = (category: AdjectiveCategory): AdjectiveEntry[] =>
  adjectives.filter((a) => a.category === category);

export const getNounsByCategory = (category: NounCategory): NounEntry[] =>
  nouns.filter((n) => n.category === category);

export const isProperNoun = (lemma: string): boolean => {
  const noun = findNoun(lemma);
  return noun?.proper === true;
};
