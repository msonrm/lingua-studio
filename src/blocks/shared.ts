/**
 * ブロック定義で共有する基盤
 * - COLORS: モンテッソーリ配色
 * - msg(): Blockly.Msg からロケール文字列を引く（フォールバック付き）
 * - labelValidator: ドロップダウンのラベル行（`__label_` 始まり）の選択を防ぐ
 */

import * as Blockly from 'blockly';

// ============================================
// ドロップダウンラベル用バリデーター
// ラベル行（__label_で始まる値）の選択を防ぐ
// ============================================
export const labelValidator = (newValue: string): string | null => {
  if (newValue.startsWith('__label_')) {
    return null;  // 選択を拒否
  }
  return newValue;
};

// ============================================
// 色の定義（モンテッソーリベース）
// ============================================
export const COLORS = {
  // Sentence系（中立・ブラウン系）
  timeFrame: '#5D4E37',  // 暖かみのあるブラウン
  timeChip: '#8B7355',   // 明るめのブラウン

  // Verb系（暖色・赤系グラデーション）
  action: '#DC143C',     // クリムゾンレッド（モンテッソーリ）
  negation: '#E53935',   // 明るい赤
  frequency: '#EF5350',  // さらに明るい赤
  manner: '#EF6C57',     // 赤オレンジ
  locative: '#F08C70',   // 明るい赤オレンジ（場所副詞）

  // Verb カテゴリ別（モンテッソーリ: 動詞=赤で統一）
  verbMotion: '#DC143C',        // 移動
  verbAction: '#DC143C',        // 動作
  verbTransfer: '#DC143C',      // 授受
  verbCognition: '#DC143C',     // 認知
  verbCommunication: '#DC143C', // 伝達
  verbState: '#DC143C',         // 状態

  // Noun系（寒色・黒〜青系グラデーション）
  person: '#0d1321',     // ほぼ黒（モンテッソーリ）
  thing: '#0d1321',      // ほぼ黒（モンテッソーリ）
  place: '#0d1321',      // ほぼ黒（モンテッソーリ）
  noun: '#0d1321',       // ほぼ黒（統一）

  // Noun Modifier系（寒色・ネイビー系グラデーション）
  determiner: '#1a365d', // ダークネイビー
  adjective: '#2c5282',  // ネイビー
  quantifier: '#2b4c7e', // ネイビー（中間）
  prepNoun: '#3c6e91',   // 明るめネイビー（名詞用前置詞）

  // Verb Modifier系の前置詞
  prepVerb: '#C0392B',   // 暗めの赤（動詞用前置詞）

  // Coordination（等位接続）- 紫系（論理演算のイメージ）
  coordNoun: '#6B5B95',   // ダスティパープル（名詞用）
  coordVerb: '#9B4D8B',   // マゼンタ寄り紫（動詞用）

  // Sentence Wrapper系（紫系グラデーション - 外側ほど濃い）
  imperative: '#4A148C',  // 濃紫（最外側）
  modal: '#9C27B0',       // 薄紫（内側）

  // Logic系（青緑系 - 論理・科学のイメージ）
  logic: '#00695C',       // ティール（fact, AND, OR, NOT）
  logicOp: '#00897B',     // 明るいティール（ブール演算子）

  // レガシー
  adverb: '#EF6C57',     // 赤オレンジ（様態副詞と同系）
};

// ============================================
// ヘルパー関数: Blockly.Msg から取得（フォールバック付き）
// ============================================
export function msg(key: string, fallback: string): string {
  return Blockly.Msg[key] || fallback;
}