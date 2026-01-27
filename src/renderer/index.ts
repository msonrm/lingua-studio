/**
 * Renderer System - Main Exports
 *
 * レンダラーシステムのメインエクスポート。
 * - Types: 型定義
 * - DerivationTracker: 変形記録クラス
 * - Rules: 言語別ルール
 */

// Types
export type {
  Tense,
  Aspect,
  Polarity,
  SentenceType,
  SubjectInfo,
  RenderContext,
  TransformationType,
  MorphologyStep,
  SyntaxStep,
  DerivationStep,
  Derivation,
  RenderResultWithDerivation,
  StepStatus,
  StepWithStatus,
  DerivationDiff,
} from './types';

// Tracker
export { DerivationTracker } from './DerivationTracker';

// English Rules
export * as EnglishMorphology from './english/rules/morphology';
export * as EnglishSyntax from './english/rules/syntax';
