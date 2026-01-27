/**
 * Grammar Rule System - Type Definitions
 *
 * 文法ルールシステムの型定義。
 * レンダラーから文脈情報を構造化して渡し、
 * 変形（derivation）を記録するための型。
 */

import type { ModalType } from '../types/schema';

// ============================================
// レンダリング文脈（RenderContext）
// ============================================

/**
 * 時制
 */
export type Tense = 'past' | 'present' | 'future';

/**
 * 相（アスペクト）
 */
export type Aspect = 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';

/**
 * 極性（肯定/否定）
 */
export type Polarity = 'affirmative' | 'negative';

/**
 * 文の種類
 */
export type SentenceType = 'declarative' | 'interrogative' | 'imperative' | 'fact';

/**
 * 主語情報
 */
export interface SubjectInfo {
  person: 1 | 2 | 3;
  number: 'singular' | 'plural';
  form: string;  // レンダリング済みの主語文字列
}

/**
 * レンダリング文脈
 *
 * 既存のClauseNodeから抽出される文脈情報を構造化したもの。
 * ルール関数はこの文脈を参照して変形を決定する。
 */
export interface RenderContext {
  // 時制・相
  tense: Tense;
  aspect: Aspect;

  // 極性
  polarity: Polarity;
  modalPolarity: Polarity;

  // モダリティ
  modal?: ModalType;

  // 主語情報
  subject: SubjectInfo;

  // 文の種類
  sentenceType: SentenceType;

  // 疑問文関連
  isQuestion: boolean;
  isSubjectQuestion: boolean;  // 主語疑問文（Who ate?）
  isWhQuestion: boolean;       // Wh疑問文
  whWord?: string;             // Wh語（who, what, where など）

  // 助動詞関連
  hasModal: boolean;
  hasAuxiliary: boolean;       // be/have助動詞

  // 動詞情報
  verbLemma: string;
  isBeVerb: boolean;
  isCopula: boolean;
}

// ============================================
// 変形ステップ（DerivationStep）
// ============================================

/**
 * 変形の種類
 */
export type TransformationType =
  // 形態論（単語レベル）
  | 'agreement'      // 主語-動詞一致 (run → runs)
  | 'tense'          // 時制変化 (eat → ate)
  | 'aspect'         // 相のマーキング (eat → eating/eaten)
  | 'case'           // 代名詞の格変化 (I → me)
  | 'article'        // 冠詞選択 (a → an)
  | 'modal'          // 法助動詞の形 (can → could)
  | 'negation'       // 否定形 (not の挿入)
  // 統語論（構造レベル）
  | 'do-support'     // do挿入
  | 'inversion'      // 主語-助動詞倒置
  | 'wh-movement'    // Wh語の前置
  | 'word-order';    // その他の語順変更

/**
 * 形態論的変形（単語レベル）
 */
export interface MorphologyStep {
  category: 'morphology';
  type: TransformationType;
  rule: string;           // ルール名（人間可読）
  description: string;    // 変形の説明
  before: string;         // 変形前の語
  after: string;          // 変形後の語
  trigger?: string;       // 変形のトリガー（例: "3rd person singular"）
}

/**
 * 統語論的変形（構造レベル）
 */
export interface SyntaxStep {
  category: 'syntax';
  type: TransformationType;
  rule: string;
  description: string;
  operation: 'insert' | 'move' | 'reorder' | 'delete';
  element?: string;       // 操作対象の要素
  position?: string;      // 移動先/挿入位置
  before?: string[];      // 変形前の構造（語の配列）
  after?: string[];       // 変形後の構造
}

/**
 * 変形ステップ（形態論 or 統語論）
 */
export type DerivationStep = MorphologyStep | SyntaxStep;

// ============================================
// 変形結果（Derivation）
// ============================================

/**
 * 完全な変形記録
 */
export interface Derivation {
  input: string;              // 入力（LinguaScript）
  output: string;             // 出力（英文）
  steps: DerivationStep[];    // 変形ステップの配列
}

/**
 * レンダリング結果（変形記録付き）
 */
export interface RenderResultWithDerivation {
  output: string;
  derivation: Derivation;
}

// ============================================
// 変形差分（前回との比較用）
// ============================================

/**
 * ステップの変更状態
 */
export type StepStatus = 'added' | 'removed' | 'changed' | 'unchanged';

/**
 * ステップと状態のペア
 */
export interface StepWithStatus {
  step: DerivationStep;
  status: StepStatus;
  previousStep?: DerivationStep;  // changed の場合、前回のステップ
}

/**
 * 変形差分
 */
export interface DerivationDiff {
  steps: StepWithStatus[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
}
