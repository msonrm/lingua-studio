/**
 * ユーザー辞書
 *
 * - `format.ts`: 保存形式と、旧形式からの移行
 * - `store.ts`:  メモリ上の辞書と localStorage への永続化
 */

export * from './store';
export { STORAGE_VERSION, migratePackage, type LanguageFormValues } from './format';
