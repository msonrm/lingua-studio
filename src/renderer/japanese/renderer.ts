/**
 * Japanese Renderer
 *
 * AST → 日本語文
 * - SOV語順、格助詞付与
 * - 動詞活用（時制・相・否定）
 * - 語彙の日本語化
 *
 * 例: "I ate the apple" → "私は りんごを 食べた。"
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
import { getParticle, isSubjectRole, translatePronoun, translateNoun, translateAdjective, translateAdverb, translateDeterminer } from './lexicon';
import { conjugate, Tense, Aspect, Polarity } from './conjugation';

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
 * [主語+は] [目的語+を] [間接目的語+に] ... [動詞（活用済み）]
 *
 * be動詞の場合: [主語+は] [attribute+動詞]
 * 例: "I am a dog" → "私は 犬である"
 */
function buildSOVParts(clause: ClauseNode, options: BuildOptions = {}): string[] {
  const { verbPhrase, tense, aspect, polarity } = clause;
  const args = verbPhrase.arguments;
  const verbLemma = verbPhrase.verb.lemma;

  // 引数を格助詞付きでレンダリング
  const argParts: { role: SemanticRole; text: string; isSubject: boolean; isAttribute: boolean }[] = [];

  for (const arg of args) {
    if (!arg.filler) continue;

    // 動的に格助詞を決定
    const particle = getParticle(arg.role, verbLemma);
    if (particle === undefined) continue; // マッピングがない役割はスキップ

    const np = renderFiller(arg.filler);
    const subjectFlag = isSubjectRole(arg.role, verbLemma);
    const isAttribute = arg.role === 'attribute';

    // 主語省略オプション
    if (options.omitSubject && subjectFlag) continue;

    argParts.push({
      role: arg.role,
      text: `${np}${particle}`,
      isSubject: subjectFlag,
      isAttribute,
    });
  }

  // 主語を先頭に、その他を続ける
  const subject = argParts.find(p => p.isSubject);
  const attribute = argParts.find(p => p.isAttribute);
  const others = argParts.filter(p => !p.isSubject && !p.isAttribute);

  // 副詞（日本語に変換）
  const adverbs = verbPhrase.adverbs.map(adv => translateAdverb(adv.lemma));

  // 動詞を活用（時制・相・否定を適用）
  // 日本語では future は present と同形
  const effectiveTense: Tense = tense === 'future' ? 'present' : tense;
  let verb = conjugate(verbLemma, {
    tense: effectiveTense,
    aspect: aspect as Aspect,
    polarity: polarity as Polarity,
  });

  // be動詞の場合、attributeと動詞を結合（「犬である」）
  if (attribute && verbLemma === 'be') {
    verb = `${attribute.text}${verb}`;
  }

  // SOV順で組み立て: 主語 → その他の引数 → 副詞 → 動詞
  const result: string[] = [];
  if (subject) result.push(subject.text);
  for (const other of others) {
    result.push(other.text);
  }
  // be動詞以外でattributeがある場合（seem等）
  if (attribute && verbLemma !== 'be') {
    result.push(attribute.text);
  }
  for (const adv of adverbs) {
    result.push(adv);
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
    const translated = translateDeterminer(np.determiner);
    if (translated) {
      parts.push(translated);
    }
    // 空文字の場合（the, a）は追加しない
  }

  // Post-determiner (数量詞)
  if (np.postDeterminer && np.postDeterminer !== 'singular' && np.postDeterminer !== 'uncountable') {
    if (np.postDeterminer === 'plural') {
      // 複数形は表示しない（名詞自体で表現）
    } else {
      parts.push(np.postDeterminer);
    }
  }

  // Adjectives（日本語に変換）
  for (const adj of np.adjectives) {
    parts.push(translateAdjective(adj.lemma));
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
