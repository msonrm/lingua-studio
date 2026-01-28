/**
 * Japanese Syntax Renderer (統語論のみバージョン)
 *
 * AST → 日本語語順（SOV）+ 格助詞
 * 単語は英語のまま、語順と格マーキングのみ日本語化
 * 代名詞は日本語に変換
 *
 * 例: "I eat the apple" → "私は the appleを eat。"
 */

import {
  SentenceNode,
  ClauseNode,
  NounPhraseNode,
  NounHead,
  PronounHead,
  AdjectivePhraseNode,
  CoordinatedNounPhraseNode,
  CoordinationConjunct,
  SemanticRole,
} from '../../types/schema';
import { getParticle, isSubjectRole, translatePronoun, translateNoun } from './particles';

// ============================================
// Main Entry Points
// ============================================

/**
 * ASTを日本語語順でレンダリング
 */
export function renderToJapanese(ast: SentenceNode): string {
  switch (ast.sentenceType) {
    case 'imperative':
      return renderImperative(ast.clause);
    case 'interrogative':
      return renderInterrogative(ast.clause);
    case 'fact':
      // factは対象外（とりあえず平叙文として処理）
      return renderDeclarative(ast.clause);
    default:
      return renderDeclarative(ast.clause);
  }
}

// ============================================
// Sentence Type Renderers
// ============================================

/**
 * 平叙文: SOV語順
 * "私は the appleを eat。"
 */
function renderDeclarative(clause: ClauseNode): string {
  const parts = buildSOVParts(clause);
  return parts.filter(Boolean).join(' ') + '。';
}

/**
 * 疑問文: SOV語順 + 「か」
 * "私は 何を eatか？"
 */
function renderInterrogative(clause: ClauseNode): string {
  const parts = buildSOVParts(clause);
  return parts.filter(Boolean).join(' ') + 'か？';
}

/**
 * 命令文: OV語順（主語省略）
 * "the appleを eat。"
 */
function renderImperative(clause: ClauseNode): string {
  const parts = buildSOVParts(clause, { omitSubject: true });
  return parts.filter(Boolean).join(' ') + '。';
}

// ============================================
// SOV Builder
// ============================================

interface BuildOptions {
  omitSubject?: boolean;
}

/**
 * SOV語順のパーツを構築
 * [主語+は] [目的語+を] [間接目的語+に] ... [動詞]
 */
function buildSOVParts(clause: ClauseNode, options: BuildOptions = {}): string[] {
  const { verbPhrase } = clause;
  const args = verbPhrase.arguments;
  const verbLemma = verbPhrase.verb.lemma;

  // 引数を格助詞付きでレンダリング
  const argParts: { role: SemanticRole; text: string; isSubject: boolean }[] = [];

  for (const arg of args) {
    if (!arg.filler) continue;

    // 動的に格助詞を決定
    const particle = getParticle(arg.role, verbLemma);
    if (!particle) continue; // マッピングがない役割はスキップ

    const np = renderFiller(arg.filler);
    const subjectFlag = isSubjectRole(arg.role, verbLemma);

    // 主語省略オプション
    if (options.omitSubject && subjectFlag) continue;

    argParts.push({
      role: arg.role,
      text: `${np}${particle}`,
      isSubject: subjectFlag,
    });
  }

  // 主語を先頭に、その他を続ける
  const subject = argParts.find(p => p.isSubject);
  const others = argParts.filter(p => !p.isSubject);

  // 動詞（原形のまま）
  const verb = verbLemma;

  // SOV順で組み立て
  const result: string[] = [];
  if (subject) result.push(subject.text);
  for (const other of others) {
    result.push(other.text);
  }
  result.push(verb);

  return result;
}

// ============================================
// Filler Rendering
// ============================================

/**
 * フィラー（名詞句/形容詞句/等位接続）をレンダリング
 */
function renderFiller(
  filler: NounPhraseNode | AdjectivePhraseNode | CoordinatedNounPhraseNode
): string {
  switch (filler.type) {
    case 'nounPhrase':
      return renderNounPhrase(filler);
    case 'adjectivePhrase':
      return filler.head.lemma;
    case 'coordinatedNounPhrase':
      return renderCoordinatedNounPhrase(filler);
    default:
      return '___';
  }
}

/**
 * 名詞句をレンダリング
 * - 代名詞は日本語に変換
 * - 名詞はそのまま（将来的に日本語化）
 */
function renderNounPhrase(np: NounPhraseNode): string {
  const parts: string[] = [];

  // Pre-determiner (all, both, half)
  if (np.preDeterminer) {
    parts.push(np.preDeterminer);
  }

  // Determiner (the, a, my, this, etc.)
  if (np.determiner && np.determiner !== 'none') {
    // アンダースコアをスペースに変換（plenty_of → plenty of）
    parts.push(np.determiner.replace(/_/g, ' '));
  }

  // Post-determiner (数量詞)
  if (np.postDeterminer && np.postDeterminer !== 'singular' && np.postDeterminer !== 'uncountable') {
    if (np.postDeterminer === 'plural') {
      // 複数形は表示しない（名詞自体で表現）
    } else {
      parts.push(np.postDeterminer);
    }
  }

  // Adjectives
  for (const adj of np.adjectives) {
    parts.push(adj.lemma);
  }

  // Head (noun or pronoun)
  if (np.head.type === 'noun') {
    const noun = np.head as NounHead;
    // 名詞は日本語に変換
    parts.push(translateNoun(noun.lemma));
  } else {
    const pronoun = np.head as PronounHead;
    // 代名詞は日本語に変換
    parts.push(translatePronoun(pronoun.lemma));
  }

  return parts.join(' ');
}

/**
 * 等位接続名詞句をレンダリング
 * "A and B" → "A and B"（そのまま）
 */
function renderCoordinatedNounPhrase(cnp: CoordinatedNounPhraseNode): string {
  const parts = cnp.conjuncts.map((conjunct: CoordinationConjunct) => {
    if (conjunct.type === 'nounPhrase') {
      return renderNounPhrase(conjunct);
    } else {
      // 入れ子の等位接続
      return renderCoordinatedNounPhrase(conjunct);
    }
  });

  return parts.join(` ${cnp.conjunction} `);
}

// ============================================
// Export
// ============================================

export { renderToJapanese as default };
