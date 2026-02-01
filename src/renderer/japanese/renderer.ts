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
  PrepositionalPhraseNode,
} from '../../types/schema';
import { getParticle, isSubjectRole, translatePronoun, translateNoun, translateAdjective, translateAdverb, translateDeterminer, translatePreDeterminer, translatePostDeterminer, isNegativePolarityAdverb, translateConjunction, translatePreposition, translatePrepositionAsModifier } from './lexicon';
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

// 主語ロール（優先順）
const SUBJECT_ROLES: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];

/**
 * VP等位接続チェーンの要素情報
 */
interface VPChainItem {
  vp: VerbPhraseNode;
  conjunction: 'and' | 'or';  // この要素の後に続く接続詞（最後の要素では未使用）
  groupId: string;            // 主語グループID
  isFirst: boolean;
  isLast: boolean;
  isSameGroupAsPrev: boolean; // 前の要素と同じグループか
  vpPolarity: Polarity;       // VP個別の極性
}

/**
 * VPから主語フィラーを取得
 */
function getSubjectFiller(vp: VerbPhraseNode): NounPhraseNode | CoordinatedNounPhraseNode | null {
  const verbCore = findVerbCore(vp.verb.lemma);
  for (const role of SUBJECT_ROLES) {
    if (verbCore?.valency.some(v => v.role === role)) {
      const slot = vp.arguments.find(a => a.role === role);
      if (slot?.filler && (slot.filler.type === 'nounPhrase' || slot.filler.type === 'coordinatedNounPhrase')) {
        return slot.filler as NounPhraseNode | CoordinatedNounPhraseNode;
      }
    }
  }
  return null;
}

/**
 * 主語のグループIDを生成（同じ主語なら同じID）
 */
function getSubjectGroupId(vp: VerbPhraseNode): string {
  const filler = getSubjectFiller(vp);
  return filler ? JSON.stringify(filler) : `__no_subject_${vp.verb.lemma}__`;
}

/**
 * 主語フィラーをレンダリング
 */
function renderSubjectFiller(filler: NounPhraseNode | CoordinatedNounPhraseNode): string {
  if (filler.type === 'nounPhrase') {
    return renderNounPhrase(filler);
  } else {
    return renderCoordinatedNounPhrase(filler);
  }
}

/**
 * Phase 1: VP等位接続チェーンを収集
 */
function collectVPChain(vp: VerbPhraseNode): VPChainItem[] {
  const items: VPChainItem[] = [];

  // 最初のVP
  const firstGroupId = getSubjectGroupId(vp);
  items.push({
    vp,
    conjunction: vp.coordinatedWith?.conjunction || 'and',
    groupId: firstGroupId,
    isFirst: true,
    isLast: !vp.coordinatedWith,
    isSameGroupAsPrev: true,  // 最初の要素は常にtrue
    vpPolarity: vp.polarity === 'negative' ? 'negative' : 'affirmative',
  });

  if (!vp.coordinatedWith) {
    return items;
  }

  // チェーンを辿る
  let prevGroupId = firstGroupId;
  let current = vp.coordinatedWith.verbPhrase;

  while (current.coordinatedWith) {
    const groupId = getSubjectGroupId(current);
    items.push({
      vp: current,
      conjunction: current.coordinatedWith.conjunction,
      groupId,
      isFirst: false,
      isLast: false,
      isSameGroupAsPrev: groupId === prevGroupId,
      vpPolarity: current.polarity === 'negative' ? 'negative' : 'affirmative',
    });
    prevGroupId = groupId;
    current = current.coordinatedWith.verbPhrase;
  }

  // 最後のVP
  const lastGroupId = getSubjectGroupId(current);
  items.push({
    vp: current,
    conjunction: 'and',  // 最後なので使われない
    groupId: lastGroupId,
    isFirst: false,
    isLast: true,
    isSameGroupAsPrev: lastGroupId === prevGroupId,
    vpPolarity: current.polarity === 'negative' ? 'negative' : 'affirmative',
  });

  return items;
}

/**
 * Phase 2: チェーン要素をレンダリング
 */
function renderVPChainItem(
  item: VPChainItem,
  clausePolarity: Polarity,
  tense: Tense,
  aspect: Aspect,
  modal?: ModalType,
  modalPolarity?: Polarity
): string {
  const parts: string[] = [];
  const verbEntry = getVerbEntry(item.vp.verb.lemma);

  // 異なる主語の場合、読点 + 主語が を追加
  if (!item.isFirst && !item.isSameGroupAsPrev) {
    const subjectFiller = getSubjectFiller(item.vp);
    if (subjectFiller) {
      parts.push('、' + renderSubjectFiller(subjectFiller) + 'が');
    }
  }

  if (item.isLast) {
    // 最後のVP: 通常活用（時制・相・極性を適用）
    const effectivePolarity = (item.vpPolarity === 'negative' || clausePolarity === 'negative')
      ? 'negative' : 'affirmative';
    const verb = conjugate(item.vp.verb.lemma, { tense, aspect, polarity: effectivePolarity, modal, modalPolarity });
    parts.push(verb);
  } else {
    // 最後以外のVP
    if (clausePolarity === 'negative') {
      // 節レベル否定: 常にないで形（conjunction無視、De Morgan適用）
      parts.push(toNaideForm(verbEntry));
    } else if (item.conjunction === 'and') {
      if (item.vpPolarity === 'negative') {
        parts.push(toNaideForm(verbEntry));
      } else {
        parts.push(toTeForm(verbEntry));
      }
    } else {
      // or: 終止形 + か
      const verb = conjugate(item.vp.verb.lemma, { tense: 'present', aspect: 'simple', polarity: item.vpPolarity });
      parts.push(verb + 'か');
    }
  }

  return parts.join('');
}

/**
 * 動詞句を等位接続込みでレンダリング
 * - and: テ形接続（食べて飲む）
 * - or: 終止形+か接続（食べるか飲む）
 * - 異なる主語の場合: 読点 + 主語が + 動詞
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
  // Phase 1: チェーン収集
  const chain = collectVPChain(vp);

  // 等位接続がなければ通常の活用
  if (chain.length === 1) {
    const verb = conjugate(vp.verb.lemma, { tense, aspect, polarity, modal, modalPolarity });
    return attributePrefix ? `${attributePrefix}${verb}` : verb;
  }

  // Phase 2: レンダリング
  const parts = chain.map(item =>
    renderVPChainItem(item, polarity, tense, aspect, modal, modalPolarity)
  );

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

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases.map(pp => renderPrepositionalPhrase(pp));

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
  // 前置詞句（動詞修飾）
  for (const pp of prepPhrases) {
    result.push(pp);
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

  // 前置詞句修飾（the book on the table → テーブルの上の本）
  if (np.prepModifier) {
    parts.push(renderPrepositionalPhraseAsModifier(np.prepModifier));
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
// Prepositional Phrase Rendering
// ============================================

/**
 * 前置詞句をレンダリング（動詞修飾用）
 * 英語: "in the park" → 日本語: "公園で"
 * 語順: 名詞句 + 後置詞
 */
function renderPrepositionalPhrase(pp: PrepositionalPhraseNode): string {
  const objectStr = pp.object.type === 'coordinatedNounPhrase'
    ? renderCoordinatedNounPhrase(pp.object as CoordinatedNounPhraseNode)
    : renderNounPhrase(pp.object as NounPhraseNode);
  const postposition = translatePreposition(pp.preposition);
  return `${objectStr}${postposition}`;
}

/**
 * 前置詞句を連体修飾形でレンダリング（名詞修飾用）
 * 英語: "the apple on the table" → 日本語: "テーブルの上のりんご"
 * 語順: 名詞句 + 後置詞（連体形） + 被修飾名詞
 */
function renderPrepositionalPhraseAsModifier(pp: PrepositionalPhraseNode): string {
  const objectStr = pp.object.type === 'coordinatedNounPhrase'
    ? renderCoordinatedNounPhrase(pp.object as CoordinatedNounPhraseNode)
    : renderNounPhrase(pp.object as NounPhraseNode);
  const postposition = translatePrepositionAsModifier(pp.preposition);
  return `${objectStr}${postposition}`;
}

// ============================================
// Export
// ============================================

export { renderToJapanese as default };
