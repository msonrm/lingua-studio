/**
 * 言語パックの契約
 *
 * ## 役割分担
 *
 * ```
 * concepts/          言語非依存の概念（valency・可算性・カテゴリ）
 *      ↓
 * languages/<code>/  語彙と形態論。この言語で語をどう綴り、どう活用するか
 *      ↓
 * renderer/<lang>/   語順の組み立て。どの順で並べ、何を省略するか
 * ```
 *
 * 語彙・形態論と語順の組み立てを分けているのは、後者だけが言語ごとに
 * 大きく違う一方、前者は「lemma を引いて語形を得る」という同じ形をしているため。
 *
 * ## 語形の型が言語ごとに違うこと
 *
 * 語形を「言語コード → 文字列」の1つのマップに押し込めない。
 *
 *   英語:     { base, past, pp, ing, thirdSg }
 *   日本語:   { ja, type: 五段 | 一段 | サ変 | カ変 }
 *   フランス語: 活用群 + 性（将来）
 *
 * とくに日本語の活用タイプは表層形から推論できない
 * （走る=五段 / 食べる=一段 のように語尾が同じでも異なる）。
 * そのため `LanguagePack` は語形の型を型パラメータで受け取る。
 */

/**
 * ユーザー辞書に語を追加するとき、この言語が要求する入力項目
 *
 * `DictionaryPanel` はこの定義を見て入力欄を動的に描く。
 * 言語パックを追加しても UI 側を書き足さずに済むようにするための仕組み。
 */
export interface UserEntryField {
  /** 保存時のキー */
  key: string;
  /** 入力欄のラベル（ロケールキー。無ければそのまま表示） */
  label: string;
  kind: 'text' | 'select';
  /** kind === 'select' のときの選択肢 */
  options?: { value: string; label: string }[];
  required: boolean;
  /** 入力例（プレースホルダー） */
  placeholder?: string;
}

/** 語形の集合。言語ごとに中身の型が異なる */
export interface LanguageForms {
  verb: unknown;
  noun: unknown;
  adjective: unknown;
  adverb: unknown;
}

/**
 * 言語パック
 *
 * 語を引く経路（ベース辞書 → ユーザー辞書 → 機械的な導出）はすべて
 * `lookup*` の内側に閉じる。レンダラーは語がどこから来たかを知らなくてよい。
 */
export interface LanguagePack<Forms extends LanguageForms> {
  /** ロケールコード（'en' / 'ja' / …） */
  code: string;
  /** 表示名 */
  name: string;

  lookupVerb(lemma: string): Forms['verb'] | undefined;
  lookupNoun(lemma: string): Forms['noun'] | undefined;
  lookupAdjective(lemma: string): Forms['adjective'] | undefined;
  lookupAdverb(lemma: string): Forms['adverb'] | undefined;

  /**
   * ユーザー辞書に語を追加するときの入力項目
   *
   * 言語パックを後から追加すると、既存のユーザー辞書にはその言語の語形がない。
   * `DictionaryPanel` はここを見て「未登録の語」を一覧し、埋める欄を出す。
   */
  userEntryFields: UserEntryField[];
}
