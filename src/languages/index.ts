/**
 * 言語パックのレジストリ
 *
 * 新しい言語を足すときは `languages/<code>/` を作り、`LanguagePack` を実装して
 * ここに登録する。ユーザー辞書の UI（`DictionaryPanel`）はこの一覧を見て
 * 入力欄を組み立てるので、UI 側を書き足す必要はない。
 */

import { english } from './en';
import { japanese } from './ja';

/** 登録済みの言語パック（表示順） */
export const languagePacks = [english, japanese] as const;

export { english, japanese };
/**
 * @public 言語パックの契約。ユーザー辞書（DictionaryPanel）が
 * 入力欄を組み立てるときに参照する（第3段階で使用）。
 */
export type { LanguagePack, LanguageForms, UserEntryField, PartOfSpeech } from './types';
