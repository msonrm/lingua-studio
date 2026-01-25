import Prism from 'prismjs';

// LinguaScript用のカスタム言語定義
Prism.languages.linguascript = {
  // コメント
  'comment': /\/\/.*/,

  // 疑問詞 (?who, ?what, ?where, ?when, ?how, ?which)
  'interrogative': /\?(?:who|whom|what|where|when|how|why|which)\b/,

  // ラッパー関数 (sentence, question, imperative, modal, not)
  'wrapper': /\b(?:sentence|question|imperative|modal|not)\b(?=\s*\()/,

  // 時制+アスペクト (past+simple, present+progressive, etc.)
  'tense-aspect': /\b(?:past|present|future)\+(?:simple|progressive|perfect|perfectProgressive)\b/,

  // 副詞ラッパー
  'adverb-wrapper': /\b(?:time|frequency|manner|locative|pp|degree)\b(?=\s*\()/,

  // 名詞/代名詞構築
  'noun-builder': /\b(?:noun|pronoun|and|or)\b(?=\s*\()/,

  // 意味役割ラベル (agent:, theme:, etc.)
  'semantic-role': /\b(?:agent|theme|patient|recipient|goal|source|location|experiencer|stimulus|possessor|attribute|place|pre|det|post|adj|head)\s*:/,

  // モダリティ概念 (ability:can, etc.)
  'modality': /\b(?:ability|permission|possibility|obligation|certainty|advice|volition|prediction)\s*:/,

  // メタ値 (plural, uncountable) - クォートなし
  'meta-value': /\b(?:plural|uncountable)\b/,

  // リテラル ('apple, 'I, etc.)
  'literal': /'[a-zA-Z_][a-zA-Z0-9_]*/,

  // 演算子
  'operator': /[+:,]/,

  // 括弧
  'punctuation': /[()[\]]/,
};

export default Prism;
