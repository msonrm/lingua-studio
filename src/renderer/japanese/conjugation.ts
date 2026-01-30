/**
 * conjugation.ts - 日本語動詞活用システム
 *
 * 動詞の活用形を生成する。
 * - 五段動詞（godan）: 書く、読む、走る
 * - 一段動詞（ichidan）: 食べる、見る、起きる
 * - サ変動詞（suru）: する、勉強する
 * - カ変動詞（kuru）: 来る
 */

import { VerbEntry, getVerbEntry } from './lexicon';

// ============================================
// Types
// ============================================

export type Tense = 'present' | 'past';
export type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';
export type Polarity = 'affirmative' | 'negative';

export interface ConjugationContext {
  tense: Tense;
  aspect: Aspect;
  polarity: Polarity;
}

// ============================================
// Main Conjugation Function
// ============================================

/**
 * 動詞を活用する
 * @param lemma 英語lemma
 * @param context 活用コンテキスト（tense, aspect, polarity）
 * @returns 活用された日本語動詞
 */
export function conjugate(lemma: string, context: ConjugationContext): string {
  const entry = getVerbEntry(lemma);
  return conjugateEntry(entry, context);
}

/**
 * VerbEntry を活用する
 */
export function conjugateEntry(entry: VerbEntry, context: ConjugationContext): string {
  const { tense, aspect, polarity } = context;

  // Perfect は日本語では Past と同形
  const effectiveTense = (aspect === 'perfect' || aspect === 'perfectProgressive') ? 'past' : tense;
  const isProgressive = aspect === 'progressive' || aspect === 'perfectProgressive';

  if (isProgressive) {
    // 進行形: テ形 + いる/いた/いない/いなかった
    const teForm = toTeForm(entry);
    if (polarity === 'affirmative') {
      return effectiveTense === 'present' ? `${teForm}いる` : `${teForm}いた`;
    } else {
      return effectiveTense === 'present' ? `${teForm}いない` : `${teForm}いなかった`;
    }
  }

  // Simple aspect
  if (polarity === 'affirmative') {
    return effectiveTense === 'present' ? entry.ja : toTaForm(entry);
  } else {
    return effectiveTense === 'present' ? toNaiForm(entry) : toNakattaForm(entry);
  }
}

// ============================================
// Conjugation Forms
// ============================================

/**
 * タ形（過去形）を生成
 * 食べる → 食べた、書く → 書いた
 */
export function toTaForm(entry: VerbEntry): string {
  const { ja, type } = entry;

  switch (type) {
    case 'ichidan':
      // 一段: 語尾の「る」を「た」に
      return ja.slice(0, -1) + 'た';

    case 'suru':
      // サ変: 「する」→「した」
      if (ja === 'する') return 'した';
      return ja.slice(0, -2) + 'した';

    case 'kuru':
      // カ変: 「来る」→「来た」
      if (ja === '来る') return '来た';
      // 「持って来る」→「持って来た」
      return ja.slice(0, -2) + '来た';

    case 'godan':
    default:
      return conjugateGodanTa(ja);
  }
}

/**
 * テ形を生成
 * 食べる → 食べて、書く → 書いて
 */
export function toTeForm(entry: VerbEntry): string {
  const { ja, type } = entry;

  switch (type) {
    case 'ichidan':
      return ja.slice(0, -1) + 'て';

    case 'suru':
      if (ja === 'する') return 'して';
      return ja.slice(0, -2) + 'して';

    case 'kuru':
      if (ja === '来る') return '来て';
      return ja.slice(0, -2) + '来て';

    case 'godan':
    default:
      return conjugateGodanTe(ja);
  }
}

/**
 * ナイ形（否定形）を生成
 * 食べる → 食べない、書く → 書かない
 */
export function toNaiForm(entry: VerbEntry): string {
  const { ja, type } = entry;

  switch (type) {
    case 'ichidan':
      return ja.slice(0, -1) + 'ない';

    case 'suru':
      if (ja === 'する') return 'しない';
      return ja.slice(0, -2) + 'しない';

    case 'kuru':
      if (ja === '来る') return '来ない';
      return ja.slice(0, -2) + '来ない';

    case 'godan':
    default:
      return conjugateGodanNai(ja);
  }
}

/**
 * ナカッタ形（過去否定形）を生成
 * 食べる → 食べなかった、書く → 書かなかった
 */
export function toNakattaForm(entry: VerbEntry): string {
  // ナイ形から「ない」を「なかった」に置換
  const naiForm = toNaiForm(entry);
  return naiForm.slice(0, -2) + 'なかった';
}

// ============================================
// Godan Verb Conjugation Helpers
// ============================================

/**
 * 五段動詞のタ形
 */
function conjugateGodanTa(ja: string): string {
  const lastChar = ja.slice(-1);
  const stem = ja.slice(0, -1);

  // 特殊ケース: 行く → 行った（イ音便の例外）
  if (ja === '行く') return '行った';

  switch (lastChar) {
    case 'う':
    case 'つ':
    case 'る':
      // 促音便: 買う→買った、待つ→待った、走る→走った
      return stem + 'った';

    case 'く':
      // イ音便: 書く→書いた
      return stem + 'いた';

    case 'ぐ':
      // イ音便（濁音）: 泳ぐ→泳いだ
      return stem + 'いだ';

    case 'す':
      // 書く→書いた ではなく す→した
      return stem + 'した';

    case 'ぬ':
    case 'ぶ':
    case 'む':
      // 撥音便: 死ぬ→死んだ、飛ぶ→飛んだ、読む→読んだ
      return stem + 'んだ';

    default:
      return ja + 'た';
  }
}

/**
 * 五段動詞のテ形
 */
function conjugateGodanTe(ja: string): string {
  const lastChar = ja.slice(-1);
  const stem = ja.slice(0, -1);

  if (ja === '行く') return '行って';

  switch (lastChar) {
    case 'う':
    case 'つ':
    case 'る':
      return stem + 'って';

    case 'く':
      return stem + 'いて';

    case 'ぐ':
      return stem + 'いで';

    case 'す':
      return stem + 'して';

    case 'ぬ':
    case 'ぶ':
    case 'む':
      return stem + 'んで';

    default:
      return ja + 'て';
  }
}

/**
 * 五段動詞のナイ形
 */
function conjugateGodanNai(ja: string): string {
  const lastChar = ja.slice(-1);
  const stem = ja.slice(0, -1);

  // 語尾を「あ段」に変換
  const aColumnMap: Record<string, string> = {
    'う': 'わ',  // 買う → 買わない
    'く': 'か',  // 書く → 書かない
    'ぐ': 'が',  // 泳ぐ → 泳がない
    'す': 'さ',  // 話す → 話さない
    'つ': 'た',  // 待つ → 待たない
    'ぬ': 'な',  // 死ぬ → 死なない
    'ぶ': 'ば',  // 飛ぶ → 飛ばない
    'む': 'ま',  // 読む → 読まない
    'る': 'ら',  // 走る → 走らない
  };

  const aDan = aColumnMap[lastChar];
  if (aDan) {
    return stem + aDan + 'ない';
  }

  return ja + 'ない';
}
