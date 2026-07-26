/**
 * dictionary-ext.ts - 拡張辞書（ユーザー定義・パッケージ）
 *
 * ベース辞書（dictionary-core.ts, dictionary-en.ts）を汚さずに
 * 単語を追加するための拡張レイヤー
 *
 * 機能:
 * - ユーザー定義単語の追加/削除
 * - localStorage への永続化
 * - JSONパッケージのインポート/エクスポート
 */

import {
  VerbCore, NounCore, AdjectiveCore, AdverbCore,
  VerbForms, NounForms, AdjectiveForms,
} from '../types/schema';
import {
  STORAGE_VERSION,
  migratePackage,
  type UserDictionaryPackage,
  type UserVerbEntry,
  type UserNounEntry,
  type UserAdjectiveEntry,
  type UserAdverbEntry,
  type LanguageFormValues,
} from './format';

/** 旧名の別名（既存の import を壊さないため） */
export type DictionaryPackage = UserDictionaryPackage;
export type ExtVerbEntry = UserVerbEntry;
export type ExtNounEntry = UserNounEntry;
export type ExtAdjectiveEntry = UserAdjectiveEntry;
export type ExtAdverbEntry = UserAdverbEntry;

// ============================================
// ストレージキー
// ============================================

const STORAGE_KEY = 'lingua-studio-dictionary-ext';

// ============================================
// 拡張辞書データ（メモリ上）
// ============================================

let extVerbs: UserVerbEntry[] = [];
let extNouns: UserNounEntry[] = [];
let extAdjectives: UserAdjectiveEntry[] = [];
let extAdverbs: UserAdverbEntry[] = [];

// 変更通知用のリスナー
type ChangeListener = () => void;
const listeners: ChangeListener[] = [];

export function addChangeListener(listener: ChangeListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

function notifyChange(): void {
  listeners.forEach(l => l());
}

// ============================================
// ストレージ操作
// ============================================

function loadFromStorage(): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      // 旧形式で保存されていても読めるよう、必ず移行を通す
      const parsed = migratePackage(JSON.parse(data));
      extVerbs = parsed.words.verbs || [];
      extNouns = parsed.words.nouns || [];
      extAdjectives = parsed.words.adjectives || [];
      extAdverbs = parsed.words.adverbs || [];
      notifyChange();
    }
  } catch (e) {
    console.warn('Failed to load dictionary extension from storage:', e);
  }
}

function saveToStorage(): void {
  try {
    const data: UserDictionaryPackage = {
      name: 'user-dictionary',
      version: STORAGE_VERSION,
      words: {
        verbs: extVerbs,
        nouns: extNouns,
        adjectives: extAdjectives,
        adverbs: extAdverbs,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save dictionary extension to storage:', e);
  }
}

// ============================================
// パッケージ操作
// ============================================

export function importPackage(pkg: DictionaryPackage): { added: number; skipped: number } {
  let added = 0;
  let skipped = 0;

  // 動詞
  for (const verb of pkg.words.verbs || []) {
    if (!extVerbs.some(v => v.lemma === verb.lemma)) {
      extVerbs.push(verb);
      added++;
    } else {
      skipped++;
    }
  }

  // 名詞
  for (const noun of pkg.words.nouns || []) {
    if (!extNouns.some(n => n.lemma === noun.lemma)) {
      extNouns.push(noun);
      added++;
    } else {
      skipped++;
    }
  }

  // 形容詞
  for (const adj of pkg.words.adjectives || []) {
    if (!extAdjectives.some(a => a.lemma === adj.lemma)) {
      extAdjectives.push(adj);
      added++;
    } else {
      skipped++;
    }
  }

  // 副詞
  for (const adv of pkg.words.adverbs || []) {
    if (!extAdverbs.some(a => a.lemma === adv.lemma)) {
      extAdverbs.push(adv);
      added++;
    } else {
      skipped++;
    }
  }

  saveToStorage();
  notifyChange();
  return { added, skipped };
}

export function exportPackage(name: string = 'my-dictionary'): DictionaryPackage {
  return {
    name,
    version: '1.0',
    words: {
      verbs: [...extVerbs],
      nouns: [...extNouns],
      adjectives: [...extAdjectives],
      adverbs: [...extAdverbs],
    },
  };
}

// ============================================
// 単語の追加/削除
// ============================================

export function addVerb(verb: ExtVerbEntry): boolean {
  if (extVerbs.some(v => v.lemma === verb.lemma)) return false;
  extVerbs.push(verb);
  saveToStorage();
  notifyChange();
  return true;
}

export function removeVerb(lemma: string): boolean {
  const index = extVerbs.findIndex(v => v.lemma === lemma);
  if (index < 0) return false;
  extVerbs.splice(index, 1);
  saveToStorage();
  notifyChange();
  return true;
}

export function addNoun(noun: ExtNounEntry): boolean {
  if (extNouns.some(n => n.lemma === noun.lemma)) return false;
  extNouns.push(noun);
  saveToStorage();
  notifyChange();
  return true;
}

export function removeNoun(lemma: string): boolean {
  const index = extNouns.findIndex(n => n.lemma === lemma);
  if (index < 0) return false;
  extNouns.splice(index, 1);
  saveToStorage();
  notifyChange();
  return true;
}

export function addAdjective(adj: ExtAdjectiveEntry): boolean {
  if (extAdjectives.some(a => a.lemma === adj.lemma)) return false;
  extAdjectives.push(adj);
  saveToStorage();
  notifyChange();
  return true;
}

export function removeAdjective(lemma: string): boolean {
  const index = extAdjectives.findIndex(a => a.lemma === lemma);
  if (index < 0) return false;
  extAdjectives.splice(index, 1);
  saveToStorage();
  notifyChange();
  return true;
}

export function addAdverb(adv: ExtAdverbEntry): boolean {
  if (extAdverbs.some(a => a.lemma === adv.lemma)) return false;
  extAdverbs.push(adv);
  saveToStorage();
  notifyChange();
  return true;
}

export function removeAdverb(lemma: string): boolean {
  const index = extAdverbs.findIndex(a => a.lemma === lemma);
  if (index < 0) return false;
  extAdverbs.splice(index, 1);
  saveToStorage();
  notifyChange();
  return true;
}

// ============================================
// 検索関数（Core形式で返す）
// ============================================

export function findExtVerbCore(lemma: string): VerbCore | undefined {
  const verb = extVerbs.find(v => v.lemma === lemma);
  if (!verb) return undefined;
  return {
    lemma: verb.lemma,
    type: verb.type,
    category: verb.category,
    valency: verb.valency,
  };
}

export function findExtVerbForms(lemma: string): VerbForms | undefined {
  const verb = extVerbs.find(v => v.lemma === lemma);
  if (!verb) return undefined;
  const en = verb.forms.en ?? {};
  // 空欄は規則変化から補う（英語は lemma から導出できる）
  return {
    lemma: verb.lemma,
    forms: {
      base: verb.lemma,
      past: en.past || `${verb.lemma}ed`,
      pp: en.pp || `${verb.lemma}ed`,
      ing: en.ing || `${verb.lemma}ing`,
      s: en.s || `${verb.lemma}s`,
    },
  };
}

/** 指定した言語の語形を引く（言語パックが自分のスライスを読むための入口） */
export function findUserForms(
  lemma: string,
  language: string
): LanguageFormValues | undefined {
  const entry =
    extVerbs.find(v => v.lemma === lemma) ??
    extNouns.find(n => n.lemma === lemma) ??
    extAdjectives.find(a => a.lemma === lemma) ??
    extAdverbs.find(a => a.lemma === lemma);
  return entry?.forms[language];
}

export function findExtNounCore(lemma: string): NounCore | undefined {
  const noun = extNouns.find(n => n.lemma === lemma);
  if (!noun) return undefined;
  return {
    lemma: noun.lemma,
    category: noun.category,
    countable: noun.countable,
    proper: noun.proper,
  };
}

export function findExtNounForms(lemma: string): NounForms | undefined {
  const noun = extNouns.find(n => n.lemma === lemma);
  if (!noun) return undefined;
  return {
    lemma: noun.lemma,
    plural: noun.forms.en?.plural || `${noun.lemma}s`,
  };
}

export function findExtAdjectiveCore(lemma: string): AdjectiveCore | undefined {
  const adj = extAdjectives.find(a => a.lemma === lemma);
  if (!adj) return undefined;
  return {
    lemma: adj.lemma,
    category: adj.category,
  };
}

export function findExtAdjectiveForms(lemma: string): AdjectiveForms | undefined {
  const adj = extAdjectives.find(a => a.lemma === lemma);
  if (!adj) return undefined;
  const en = adj.forms.en ?? {};
  return {
    lemma: adj.lemma,
    ...(en.comparative ? { comparative: en.comparative } : {}),
    ...(en.superlative ? { superlative: en.superlative } : {}),
  };
}

export function findExtAdverbCore(lemma: string): AdverbCore | undefined {
  const adv = extAdverbs.find(a => a.lemma === lemma);
  if (!adv) return undefined;
  return {
    lemma: adv.lemma,
    type: adv.type,
  };
}

// ============================================
// 一覧取得
// ============================================

export function getExtVerbs(): ExtVerbEntry[] {
  return [...extVerbs];
}

export function getExtNouns(): ExtNounEntry[] {
  return [...extNouns];
}

export function getExtAdjectives(): ExtAdjectiveEntry[] {
  return [...extAdjectives];
}

export function getExtAdverbs(): ExtAdverbEntry[] {
  return [...extAdverbs];
}

export function getExtWordCount(): number {
  return extVerbs.length + extNouns.length + extAdjectives.length + extAdverbs.length;
}

// ============================================
// 全クリア
// ============================================

/** @public 辞書 API の対称性のために保持（削除すると辞書データが到達不能になる） */
export function clearAll(): void {
  extVerbs = [];
  extNouns = [];
  extAdjectives = [];
  extAdverbs = [];
  saveToStorage();
  notifyChange();
}

// ============================================
// 初期化（アプリ起動時に呼び出す）
// ============================================

export function initDictionaryExt(): void {
  loadFromStorage();
}
