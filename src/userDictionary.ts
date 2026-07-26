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
  VerbCategory, NounCategory, AdjectiveCategory,
  ArgumentSlot,
} from './types/schema';

// ============================================
// パッケージ形式の型定義
// ============================================

export interface DictionaryPackage {
  name: string;
  version: string;
  description?: string;
  words: {
    verbs?: ExtVerbEntry[];
    nouns?: ExtNounEntry[];
    adjectives?: ExtAdjectiveEntry[];
    adverbs?: ExtAdverbEntry[];
  };
}

// 拡張エントリ型（Core + Forms + 将来の多言語対応用）
export interface ExtVerbEntry {
  lemma: string;
  type: "action" | "stative";
  category: VerbCategory;
  valency: ArgumentSlot[];
  forms: {
    base: string;
    past: string;
    pp: string;
    ing: string;
    s: string;
  };
  translations?: {
    ja?: { surface: string; type: "godan" | "ichidan" | "suru" | "kuru" };
  };
}

export interface ExtNounEntry {
  lemma: string;
  category: NounCategory;
  countable: boolean;
  plural: string;
  proper?: boolean;
  translations?: {
    ja?: string;
  };
}

export interface ExtAdjectiveEntry {
  lemma: string;
  category: AdjectiveCategory;
  comparative?: string;
  superlative?: string;
  translations?: {
    ja?: string;
  };
}

export interface ExtAdverbEntry {
  lemma: string;
  type: "manner" | "frequency" | "degree" | "time" | "place";
  translations?: {
    ja?: string;
  };
}

// ============================================
// ストレージキー
// ============================================

const STORAGE_KEY = 'lingua-studio-dictionary-ext';

// ============================================
// 拡張辞書データ（メモリ上）
// ============================================

let extVerbs: ExtVerbEntry[] = [];
let extNouns: ExtNounEntry[] = [];
let extAdjectives: ExtAdjectiveEntry[] = [];
let extAdverbs: ExtAdverbEntry[] = [];

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
      const parsed = JSON.parse(data) as DictionaryPackage;
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
    const data: DictionaryPackage = {
      name: 'user-dictionary',
      version: '1.0',
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
  return {
    lemma: verb.lemma,
    forms: verb.forms,
  };
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
    plural: noun.plural,
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
  return {
    lemma: adj.lemma,
    comparative: adj.comparative,
    superlative: adj.superlative,
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
