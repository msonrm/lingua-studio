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
  VerbPhraseNode,
  NounPhraseNode,
  NounHead,
  PronounHead,
  AdjectivePhraseNode,
  CoordinatedNounPhraseNode,
  CoordinationConjunct,
  SemanticRole,
  ModalType,
} from '../../types/schema';
import { getParticle, isSubjectRole, translatePronoun, translateNoun, translateAdjective, translateAdverb, translateDeterminer, translatePreDeterminer, translatePostDeterminer, isNegativePolarityAdverb, translateConjunction } from './lexicon';
import { conjugate, toTeForm, toNaideForm, Tense, Aspect, Polarity } from './conjugation';
import { getVerbEntry } from './lexicon';
import { findVerbCore } from '../../data/dictionary-core';

// ============================================
// Main Entry Points
// ============================================

/**
 * ASTを日本語語順でレンダリング
 */
export function renderToJapanese(ast: SentenceNode): string {
  // timeAdverbialは空白形式で格納されているので、アンダースコアに正規化して検索
  const timeAdv = ast.timeAdverbial
    ? translateAdverb(ast.timeAdverbial.toLowerCase().replace(/ /g, '_'))
    : undefined;

  switch (ast.sentenceType) {
    case 'imperative':
      return renderImperative(ast.clause, timeAdv);
    case 'interrogative':
      return renderInterrogative(ast.clause, timeAdv);
    case 'fact':
      // factは対象外（とりあえず平叙文として処理）
      return renderDeclarative(ast.clause, timeAdv);
    default:
      return renderDeclarative(ast.clause, timeAdv);
  }
}

// ============================================
// Sentence Type Renderers
// ============================================

/**
 * 平叙文: SOV語順
 */
function renderDeclarative(clause: ClauseNode, timeAdv?: string): string {
  const parts = buildSOVParts(clause, { timeAdverbial: timeAdv });
  return parts.filter(Boolean).join('') + '。';
}

/**
 * 疑問文: SOV語順 + 「か」
 */
function renderInterrogative(clause: ClauseNode, timeAdv?: string): string {
  const parts = buildSOVParts(clause, { timeAdverbial: timeAdv });
  return parts.filter(Boolean).join('') + 'か？';
}

/**
 * 命令文: OV語順（主語省略）
 */
function renderImperative(clause: ClauseNode, timeAdv?: string): string {
  const parts = buildSOVParts(clause, { omitSubject: true, timeAdverbial: timeAdv });
  return parts.filter(Boolean).join('') + '。';
}

// ============================================
// VP Coordination
// ============================================

/**
 * 動詞句を等位接続込みでレンダリング
 * - and: テ形接続（食べて飲む）
 * - or: 終止形+か接続（食べるか飲む）
 */
function renderVerbWithCoordination(
  vp: VerbPhraseNode,
  tense: Tense,
  aspect: Aspect,
  polarity: Polarity,
  modal?: ModalType,
  modalPolarity?: Polarity,
  attributePrefix?: string
): string {
  // 等位接続がなければ通常の活用
  if (!vp.coordinatedWith) {
    const verb = conjugate(vp.verb.lemma, { tense, aspect, polarity, modal, modalPolarity });
    return attributePrefix ? `${attributePrefix}${verb}` : verb;
  }

  // 等位接続チェーンを収集
  const chain: { vp: VerbPhraseNode; conjunction: 'and' | 'or' }[] = [];
  chain.push({ vp, conjunction: vp.coordinatedWith.conjunction });

  let current = vp.coordinatedWith.verbPhrase;
  while (current.coordinatedWith) {
    chain.push({ vp: current, conjunction: current.coordinatedWith.conjunction });
    current = current.coordinatedWith.verbPhrase;
  }
  // 最後のVPを追加（conjunctionは使わない）
  chain.push({ vp: current, conjunction: 'and' });

  // レンダリング
  const parts: string[] = [];
  for (let i = 0; i < chain.length; i++) {
    const { vp: currentVP, conjunction } = chain[i];
    const isLast = i === chain.length - 1;
    const verbEntry = getVerbEntry(currentVP.verb.lemma);

    // VP個別の polarity を取得
    const vpPolarity = currentVP.polarity === 'negative' ? 'negative' : 'affirmative';

    if (isLast) {
      // 最後のVP: 通常活用（時制・相・極性を適用）
      // 節レベルの polarity と VP個別の polarity を組み合わせる
      const effectivePolarity = (vpPolarity === 'negative' || polarity === 'negative') ? 'negative' : 'affirmative';
      const verb = conjugate(currentVP.verb.lemma, { tense, aspect, polarity: effectivePolarity, modal, modalPolarity });
      parts.push(verb);
    } else {
      // 最後以外のVP
      if (conjunction === 'and') {
        if (vpPolarity === 'negative') {
          // 否定 + and: ないで形（食べないで）
          parts.push(toNaideForm(verbEntry));
        } else {
          // 肯定 + and: テ形（食べて）
          parts.push(toTeForm(verbEntry));
        }
      } else {
        // or: 終止形 + か
        const verb = conjugate(currentVP.verb.lemma, { tense: 'present', aspect: 'simple', polarity: vpPolarity });
        parts.push(verb + 'か');
      }
    }
  }

  return parts.join('');
}

// ============================================
// SOV Builder
// ============================================

interface BuildOptions {
  omitSubject?: boolean;
  timeAdverbial?: string;
}

/**
 * SOV語順のパーツを構築
 * [主語+は] [目的語+を] [間接目的語+に] ... [動詞（活用済み）]
 *
 * be動詞の場合: [主語+は] [attribute+動詞]
 * 例: "I am a dog" → "私は 犬である"
 */
function buildSOVParts(clause: ClauseNode, options: BuildOptions = {}): string[] {
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;
  const args = verbPhrase.arguments;
  const verbLemma = verbPhrase.verb.lemma;

  // 引数を格助詞付きでレンダリング
  const argParts: { role: SemanticRole; text: string; isSubject: boolean; isAttribute: boolean }[] = [];

  // valency から required 情報を取得
  const verbCore = findVerbCore(verbLemma);
  const isRequired = (role: SemanticRole): boolean => {
    if (!verbCore) return true; // 不明な動詞は必須扱い
    const slot = verbCore.valency.find(v => v.role === role);
    return slot?.required ?? false;
  };

  for (const arg of args) {
    // 動的に格助詞を決定
    let particle = getParticle(arg.role, verbLemma);
    if (particle === undefined) continue; // マッピングがない役割はスキップ

    // filler が null の場合
    if (!arg.filler) {
      // 必須スロットのみプレースホルダーを表示
      if (!isRequired(arg.role)) continue;
    }

    const np = arg.filler ? renderFiller(arg.filler) : '___';
    const subjectFlag = isSubjectRole(arg.role, verbLemma);
    const isAttribute = arg.role === 'attribute';

    // 疑問詞が主語の場合は「が」を使用（「誰が」「何が」）
    if (subjectFlag && arg.filler && isInterrogativeFiller(arg.filler)) {
      particle = 'が';
    }

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

  // 否定極性副詞（never, hardly, etc.）がある場合、動詞を否定形にする
  const hasNegativePolarityAdverb = verbPhrase.adverbs.some(adv => isNegativePolarityAdverb(adv.lemma));
  const effectivePolarity: Polarity = hasNegativePolarityAdverb ? 'negative' : polarity as Polarity;

  // 動詞を活用（時制・相・否定・モダリティを適用）
  // 日本語では future は present と同形
  const effectiveTense: Tense = tense === 'future' ? 'present' : tense;
  let verb = conjugate(verbLemma, {
    tense: effectiveTense,
    aspect: aspect as Aspect,
    polarity: effectivePolarity,
    modal,
    modalPolarity: modalPolarity as Polarity | undefined,
  });

  // be動詞の場合、attributeと動詞を結合（「犬である」）
  if (attribute && verbLemma === 'be') {
    verb = `${attribute.text}${verb}`;
  }

  // SOV順で組み立て: 主語 → 時間副詞 → その他の引数 → 副詞 → 動詞
  const result: string[] = [];
  if (subject) result.push(subject.text);
  // 時間副詞（SentenceNode.timeAdverbial）
  if (options.timeAdverbial) {
    result.push(options.timeAdverbial);
  }
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

  // VP等位接続を処理
  const verbStr = renderVerbWithCoordination(
    verbPhrase,
    effectiveTense,
    aspect as Aspect,
    effectivePolarity,
    modal,
    modalPolarity as Polarity | undefined,
    attribute && verbLemma === 'be' ? attribute.text : undefined
  );
  result.push(verbStr);

  return result;
}

// ============================================
// Filler Rendering
// ============================================

/**
 * フィラーが疑問詞かどうかを判定
 * 疑問詞は「?」プレフィックス付きで格納される（?who, ?what など）
 */
function isInterrogativeFiller(
  filler: NounPhraseNode | AdjectivePhraseNode | CoordinatedNounPhraseNode
): boolean {
  if (filler.type === 'nounPhrase') {
    return filler.head.lemma.startsWith('?');
  }
  return false;
}

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
    parts.push(translatePreDeterminer(np.preDeterminer));
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
      parts.push(translatePostDeterminer(np.postDeterminer));
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

  return parts.join('');
}

/**
 * 等位接続名詞句をレンダリング
 * "A and B" → "AとB"
 * "A, B, and C" → "AとBとC"
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

  // 日本語: 接尾辞方式（「AとB」「AとBとC」「AかB」）
  const jaConj = translateConjunction(cnp.conjunction);
  return parts.join(jaConj);
}

// ============================================
// Export
// ============================================

export { renderToJapanese as default };
