/**
 * ユーザー辞書の保存形式と移行
 *
 * ## 形式の考え方
 *
 * 言語非依存の情報（valency・カテゴリ・可算性）と、言語ごとの語形を分ける。
 * 語形は `forms[言語コード]` に**文字列のマップ**として入れる。
 *
 * ```
 * { lemma: 'prepare',
 *   category: 'action',
 *   valency: [...],
 *   forms: {
 *     en: { past: 'prepared', pp: 'prepared', ing: 'preparing', s: 'prepares' },
 *     ja: { ja: '準備する', verbType: 'suru' },
 *   } }
 * ```
 *
 * キーは言語パックの `userEntryFields` が宣言するものと一致する。
 * こうすると **UI の入力欄・保存形式・言語パックの読み取りが1本の線で繋がり**、
 * 言語を追加しても保存形式の型を書き換えずに済む。
 *
 * 旧形式（v1）は言語ごとのスロットが `translations` に直書きされていたため、
 * 言語を足すたびに4つのエントリ型すべてを編集する必要があった。
 */

import type {
  VerbCategory,
  NounCategory,
  AdjectiveCategory,
  ArgumentSlot,
} from '../types/schema';

/**
 * 保存形式のバージョン
 *
 * ここが「正式版」の 1。それ以前のデータも `version: "1.0"` を名乗っていたが、
 * 日本語レンダラーへの配線も入力 UI も無く実質機能していなかったため、
 * 正式に動く形をあらためて 1 とした。
 *
 * 旧形式は version 文字列では区別できないので、**中身の形**で見分ける
 * （`hasLegacyShape()` を参照）。
 */
export const STORAGE_VERSION = '1';

/** 言語ごとの語形。キーは言語パックの `userEntryFields` に対応する */
export type LanguageFormValues = Record<string, string>;

interface UserWordBase {
  lemma: string;
  /** 言語コード → 語形。未登録の言語はキーごと無い */
  forms: Record<string, LanguageFormValues | undefined>;
  /**
   * 語形を機械的に推測した言語のコード。
   * ユーザーの確認が必要なものを UI で一覧するために使う。
   */
  unverified?: string[];
}

export interface UserVerbEntry extends UserWordBase {
  type: 'action' | 'stative';
  category: VerbCategory;
  valency: ArgumentSlot[];
}

export interface UserNounEntry extends UserWordBase {
  category: NounCategory;
  countable: boolean;
  proper?: boolean;
}

export interface UserAdjectiveEntry extends UserWordBase {
  category: AdjectiveCategory;
}

export interface UserAdverbEntry extends UserWordBase {
  type: 'manner' | 'frequency' | 'degree' | 'time' | 'place';
}

export interface UserDictionaryPackage {
  name: string;
  version: string;
  description?: string;
  words: {
    verbs?: UserVerbEntry[];
    nouns?: UserNounEntry[];
    adjectives?: UserAdjectiveEntry[];
    adverbs?: UserAdverbEntry[];
  };
}

// ============================================
// 移行
// ============================================

/** 日本語の活用タイプを表層形から推測する（確実なのは「〜する」「来る」だけ） */
function guessJapaneseVerbType(surface: string): { verbType: string; certain: boolean } {
  if (surface.endsWith('する')) return { verbType: 'suru', certain: true };
  if (surface.endsWith('来る') || surface === 'くる') return { verbType: 'kuru', certain: true };
  // 走る（五段）と食べる（一段）は語尾が同じなので区別できない。
  // 五段のほうが多いので仮に五段とし、要確認として印を付ける。
  return { verbType: 'godan', certain: false };
}

/** 旧形式の `translations.ja` を現行形式の `forms.ja` に変換する */
function migrateJapaneseForm(
  translation: unknown,
  isVerb: boolean
): { form: LanguageFormValues; verified: boolean } | undefined {
  if (!translation) return undefined;

  // 名詞・形容詞・副詞は文字列（活用しないので足りる）
  if (typeof translation === 'string') {
    if (!isVerb) return { form: { ja: translation }, verified: true };
    // 動詞なのに文字列だけ（手書きパッケージなど）→ 活用タイプを推測する
    const guessed = guessJapaneseVerbType(translation);
    return { form: { ja: translation, verbType: guessed.verbType }, verified: guessed.certain };
  }

  // 動詞は { surface, type }。v1 の時点で活用タイプを保存していたので推測は不要
  if (typeof translation === 'object' && 'surface' in translation) {
    const { surface, type } = translation as { surface: string; type?: string };
    if (type) return { form: { ja: surface, verbType: type }, verified: true };
    const guessed = guessJapaneseVerbType(surface);
    return { form: { ja: surface, verbType: guessed.verbType }, verified: guessed.certain };
  }

  return undefined;
}

/** 旧形式のエントリ共通部分を現行形式に変換する */
function migrateEntry(
  raw: Record<string, unknown>,
  englishForms: LanguageFormValues,
  isVerb: boolean
): UserWordBase {
  const forms: Record<string, LanguageFormValues | undefined> = {};
  const unverified: string[] = [];

  if (Object.keys(englishForms).length > 0) {
    forms.en = englishForms;
  }

  const translations = raw.translations as { ja?: unknown } | undefined;
  const japanese = migrateJapaneseForm(translations?.ja, isVerb);
  if (japanese) {
    forms.ja = japanese.form;
    if (!japanese.verified) unverified.push('ja');
  }

  return {
    lemma: raw.lemma as string,
    forms,
    ...(unverified.length > 0 ? { unverified } : {}),
  };
}

/** 旧形式のパッケージを現行形式に変換する */
function migrateFromLegacy(pkg: Record<string, unknown>): UserDictionaryPackage {
  const words = (pkg.words ?? {}) as Record<string, Record<string, unknown>[] | undefined>;

  const verbs = (words.verbs ?? []).map(raw => {
    const f = (raw.forms ?? {}) as Record<string, string>;
    // base は lemma と同じなので保存しない
    const en: LanguageFormValues = {};
    for (const key of ['past', 'pp', 'ing', 's'] as const) {
      if (f[key]) en[key] = f[key];
    }
    return {
      ...migrateEntry(raw, en, true),
      type: raw.type as 'action' | 'stative',
      category: raw.category as VerbCategory,
      valency: raw.valency as ArgumentSlot[],
    } satisfies UserVerbEntry;
  });

  const nouns = (words.nouns ?? []).map(raw => {
    // v1 は plural が直下にある場合と forms.plural の場合がある
    const plural = (raw.plural as string) ?? ((raw.forms as Record<string, string>)?.plural ?? '');
    return {
      ...migrateEntry(raw, plural ? { plural } : {}, false),
      category: raw.category as NounCategory,
      countable: raw.countable as boolean,
      ...(raw.proper ? { proper: true } : {}),
    } satisfies UserNounEntry;
  });

  const adjectives = (words.adjectives ?? []).map(raw => {
    const en: LanguageFormValues = {};
    if (raw.comparative) en.comparative = raw.comparative as string;
    if (raw.superlative) en.superlative = raw.superlative as string;
    return {
      ...migrateEntry(raw, en, false),
      category: raw.category as AdjectiveCategory,
    } satisfies UserAdjectiveEntry;
  });

  const adverbs = (words.adverbs ?? []).map(
    raw =>
      ({
        ...migrateEntry(raw, {}, false),
        type: raw.type as UserAdverbEntry['type'],
      }) satisfies UserAdverbEntry
  );

  return {
    name: (pkg.name as string) ?? 'user-dictionary',
    version: STORAGE_VERSION,
    ...(pkg.description ? { description: pkg.description as string } : {}),
    words: { verbs, nouns, adjectives, adverbs },
  };
}

/**
 * 旧形式のエントリが混ざっているか
 *
 * 旧形式の目印:
 * - `translations`（言語ごとのスロットを直書きしていた）
 * - `forms.base` が文字列（英語の語形が `forms` 直下にあった）
 * - `plural` / `comparative` / `superlative` がエントリ直下にある
 *
 * 現行形式の `forms` は「言語コード → 語形マップ」なので、値はオブジェクトになる。
 */
function hasLegacyShape(pkg: Record<string, unknown>): boolean {
  const words = (pkg.words ?? {}) as Record<string, Record<string, unknown>[] | undefined>;
  const entries = [
    ...(words.verbs ?? []),
    ...(words.nouns ?? []),
    ...(words.adjectives ?? []),
    ...(words.adverbs ?? []),
  ];

  return entries.some(entry => {
    if ('translations' in entry) return true;
    if ('plural' in entry || 'comparative' in entry || 'superlative' in entry) return true;
    const forms = entry.forms as Record<string, unknown> | undefined;
    return typeof forms?.base === 'string';
  });
}

/**
 * 保存されたパッケージを現行形式に変換する
 *
 * 新旧の判定は version 文字列ではなく**中身の形**で行う。
 * 旧形式も `version: "1.0"` を名乗っていたため、正式版の `"1"` と文字列では
 * 区別できないため。手書きのパッケージでバージョンが誤っていても正しく読める利点もある。
 *
 * 未来のバージョンは中身を捨てて空のパッケージを返す。
 * 読めないデータで壊れるより、辞書が空になるほうが復旧しやすいため
 * （エクスポートした JSON があれば取り込み直せる）。
 */
export function migratePackage(raw: unknown): UserDictionaryPackage {
  const pkg = (raw ?? {}) as Record<string, unknown>;
  const version = String(pkg.version ?? '');

  if (hasLegacyShape(pkg)) {
    return migrateFromLegacy(pkg);
  }

  // 現行形式、または中身が空の旧形式（"1.0" など）
  const major = version.split('.')[0];
  if (version === '' || major === STORAGE_VERSION || major === '0') {
    const words = (pkg.words ?? {}) as UserDictionaryPackage['words'];
    return {
      name: (pkg.name as string) ?? 'user-dictionary',
      version: STORAGE_VERSION,
      ...(pkg.description ? { description: pkg.description as string } : {}),
      words: {
        verbs: words.verbs ?? [],
        nouns: words.nouns ?? [],
        adjectives: words.adjectives ?? [],
        adverbs: words.adverbs ?? [],
      },
    };
  }

  console.warn(`ユーザー辞書: 未知の保存形式バージョン "${version}" のため読み込みをスキップしました`);
  return {
    name: (pkg.name as string) ?? 'user-dictionary',
    version: STORAGE_VERSION,
    words: { verbs: [], nouns: [], adjectives: [], adverbs: [] },
  };
}
