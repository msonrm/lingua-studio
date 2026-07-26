/**
 * Japanese Renderer - Entry Point
 *
 * 外部（components / test）へ公開するのは AST → 日本語文の変換だけ。
 * 語彙 (`lexicon.ts`) と活用 (`conjugation.ts`) は renderer.ts の実装詳細なので、
 * 必要になったモジュールが直接 import する。
 */

export { renderToJapanese } from './renderer';
