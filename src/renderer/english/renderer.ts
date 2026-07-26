import {
  SentenceNode,
  ClauseNode,
  NounPhraseNode,
  NounHead,
  PronounHead,
  FilledArgumentSlot,
  AdjectivePhraseNode,
  AdverbNode,
  SemanticRole,
  PrepositionalPhraseNode,
  CoordinatedNounPhraseNode,
  VerbPhraseNode,
  VerbPhraseConjunct,
  CoordinatedVerbPhraseNode,
  isCoordinatedVerbPhrase,
  ModalType,
} from '../../types/schema';
import { findVerb, findNoun, findPronoun } from '../../data/dictionary-en';
import { nounCores } from '../../data/dictionary-core';
import { RenderResult } from '../../types/grammarLog';
import { DerivationTracker } from '../DerivationTracker';
import {
  conjugateVerb,
  ConjugationContext,
  ConjugationResult,
  Tense,
  Aspect,
  Polarity,
  ModalType as ConjugationModalType,
} from './conjugation';
import {
  renderNounPhraseUnified,
  renderCoordinatedNounPhraseUnified,
  NounPhraseContext,
  NounPhraseDependencies,
} from './nounPhrase';
import {
  renderCoordination,
  leaf,
  group,
  type CoordGroup,
  type CoordItem,
} from './coordination';

// Derivation tracker (module-level, reset on each render)
let tracker = new DerivationTracker();

// ============================================
// 統一レンダリングゲート（欠損時は自動的に ___ を返す）
// ============================================

/** 欠損時にプレースホルダーを返す統一レンダリング関数 */
function render<T>(node: T | undefined | null, fn: (n: T) => string): string {
  return node != null ? fn(node) : '___';
}

// ============================================
// Unified Conjugation Wrapper
// ============================================

/** 統一活用関数のラッパー - 依存関係を注入し、変形をトラッカーに記録 */
function conjugateVerbUnified(
  lemma: string,
  tense: Tense,
  aspect: Aspect,
  polarity: Polarity,
  frequencyAdverbs: AdverbNode[],
  subject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: Polarity,
  doubleNegation?: boolean,
  isQuestion?: boolean
): ConjugationResult {
  const ctx: ConjugationContext = {
    tense,
    aspect,
    polarity,
    doubleNegation,
    isQuestion,
    subject,
    modal: modal as ConjugationModalType,
    modalPolarity,
    frequencyAdverbs,
  };

  const deps = {
    findVerb: (l: string) => {
      const entry = findVerb(l);
      if (!entry) return undefined;
      return {
        lemma: entry.lemma,
        forms: {
          base: entry.forms.base,
          past: entry.forms.past,
          pp: entry.forms.pp,
          ing: entry.forms.ing,
          thirdSg: entry.forms.s,  // dictionary uses 's' not 'thirdSg'
          irregular: entry.forms.irregular,
        },
      };
    },
    getPersonNumber: (s: NounPhraseNode | CoordinatedNounPhraseNode | undefined) => {
      if (!s) return { person: 3 as const, number: 'singular' as const };
      return getPersonNumber(s);
    },
    isThirdSingular: (s: NounPhraseNode | CoordinatedNounPhraseNode | undefined) => {
      if (!s) return true;
      return isThirdSingular(s);
    },
  };

  const result = conjugateVerb(lemma, ctx, deps);

  // 変形をトラッカーに記録
  for (const t of result.transforms) {
    tracker.recordMorphology(t.type, t.from, t.to, t.rule, t.description);
  }

  return result;
}

/**
 * 平叙文用の動詞形を取得
 * Simple aspect で否定でない場合は活用形を直接使用
 */
function getDeclarativeVerbForm(
  lemma: string,
  tense: Tense,
  aspect: Aspect,
  polarity: Polarity,
  frequencyAdverbs: AdverbNode[],
  subject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: Polarity,
  doubleNegation?: boolean
): string {
  const result = conjugateVerbUnified(
    lemma, tense, aspect, polarity, frequencyAdverbs, subject, modal, modalPolarity, doubleNegation
  );

  const verbEntry = findVerb(lemma);
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');
  const is3sg = subject ? isThirdSingular(subject) : true;
  const isNegative = polarity === 'negative';

  // Simple aspect の平叙文では do-support を使わない（否定以外）
  if (aspect === 'simple' && !modal && lemma !== 'be') {
    if (tense === 'past' && !isNegative) {
      // "He ate" - 直接過去形
      return freqStr ? `${freqStr} ${verbEntry?.forms.past || lemma}` : (verbEntry?.forms.past || lemma);
    }
    if (tense === 'present' && !isNegative) {
      // "He eats" / "They eat"
      const form = is3sg ? (verbEntry?.forms.s || lemma) : (verbEntry?.forms.base || lemma);
      return freqStr ? `${freqStr} ${form}` : form;
    }
    // 否定文: "He does not eat" / "He did not eat"
    // mainVerb に既に "not" が含まれている
    if (isNegative) {
      // auxiliary が null の場合（辞書にない動詞）は mainVerb のみ返す
      if (!result.auxiliary) {
        return result.mainVerb;
      }
      // do-support をログ（否定形成にはdo-supportが必要）
      tracker.recordSyntax('do-support', 'insert', 'DO_SUPPORT_NEGATIVE', 'DO_SUPPORT_NEGATIVE_DESC', {
        element: 'do',
        after: [`${result.auxiliary} not [V]`],
      });
      return `${result.auxiliary} ${result.mainVerb}`.trim();
    }
  }

  // be動詞の特殊処理
  // mainVerb に既に "not" が含まれている
  if (lemma === 'be' && aspect === 'simple' && !modal) {
    if (isNegative) {
      return `${result.auxiliary} ${result.mainVerb}`.trim();
    }
    return result.auxiliary || 'is';
  }

  // 他のケース: auxiliary + mainVerb
  if (result.auxiliary) {
    return `${result.auxiliary} ${result.mainVerb}`.trim();
  }
  return result.mainVerb;
}

/**
 * 疑問文用の動詞形を取得（助動詞と本動詞を分離）
 */
function getInterrogativeVerbForm(
  lemma: string,
  tense: Tense,
  aspect: Aspect,
  polarity: Polarity,
  frequencyAdverbs: AdverbNode[],
  subject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: Polarity,
  doubleNegation?: boolean
): { auxiliary: string; mainVerb: string } {
  const result = conjugateVerbUnified(
    lemma, tense, aspect, polarity, frequencyAdverbs, subject, modal, modalPolarity, doubleNegation,
    true  // isQuestion: 疑問文ではdo-supportを使用
  );

  // Simple past/present で do-support が必要な場合
  if (aspect === 'simple' && !modal && lemma !== 'be') {
    // do-support をログ
    const doForm = result.auxiliary || 'does';
    tracker.recordSyntax('do-support', 'insert', 'DO_SUPPORT_QUESTION', 'DO_SUPPORT_QUESTION_DESC', {
      element: 'do',
      after: [`${doForm} [S V]`],
    });
  }

  return {
    auxiliary: result.auxiliary || 'does',
    mainVerb: result.mainVerb,
  };
}

// ============================================
// Unified Noun Phrase Wrapper
// ============================================

/** 統一名詞句レンダリングの依存関係 */
function getNounPhraseDeps(): NounPhraseDependencies {
  return {
    findNoun: (lemma: string) => {
      const entry = findNoun(lemma);
      if (!entry) return undefined;
      return {
        lemma: entry.lemma,
        plural: entry.plural,
        countable: entry.countable,
        zeroArticle: entry.zeroArticle,
      };
    },
    findPronoun: (lemma: string) => {
      const entry = findPronoun(lemma);
      if (!entry) return undefined;
      return {
        lemma: entry.lemma,
        objectForm: entry.objectForm,
        possessive: entry.possessive,
        person: entry.person,
        number: entry.number,
        type: entry.type,
        polaritySensitive: entry.polaritySensitive,
        negativeForm: entry.negativeForm,
      };
    },
    renderPrepositionalPhrase: (pp, polarity) => {
      return renderPrepositionalPhrase(pp, polarity);
    },
    renderCoordinatedNounPhrase: (cnp, isSubject, polarity) => {
      return renderCoordinatedNounPhrase(cnp, isSubject, polarity);
    },
  };
}

/** 名詞句をレンダリングし、変形をトラッカーに記録 */
function renderNounPhrase(
  np: NounPhraseNode,
  isSubject: boolean = true,
  polarity: 'affirmative' | 'negative' = 'affirmative'
): string {
  const ctx: NounPhraseContext = { isSubject, polarity };
  const deps = getNounPhraseDeps();
  const result = renderNounPhraseUnified(np, ctx, deps);

  // 変形をトラッカーに記録
  for (const t of result.transforms) {
    tracker.recordMorphology(t.type, t.from, t.to, t.rule, t.description);
  }

  return result.form;
}

/** 等位接続名詞句をレンダリングし、変形をトラッカーに記録 */
function renderCoordinatedNounPhrase(
  cnp: CoordinatedNounPhraseNode,
  isSubject: boolean = true,
  polarity: 'affirmative' | 'negative' = 'affirmative'
): string {
  const ctx: NounPhraseContext = { isSubject, polarity };
  const deps = getNounPhraseDeps();
  const result = renderCoordinatedNounPhraseUnified(cnp, ctx, deps);

  // 変形をトラッカーに記録
  for (const t of result.transforms) {
    tracker.recordMorphology(t.type, t.from, t.to, t.rule, t.description);
  }

  return result.form;
}

// 主語となりうるロール
const SUBJECT_ROLES: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];

// ============================================
// 共通コンテキスト（重複コード削減）
// ============================================

/** 節レンダリング用の共通コンテキスト */
interface ClauseContext {
  verbPhrase: VerbPhraseNode;
  tense: Tense;
  aspect: Aspect;
  polarity: Polarity;
  modal?: ModalType;
  modalPolarity?: Polarity;
  verbEntry: ReturnType<typeof findVerb>;
  subjectRole: SemanticRole | undefined;
  subjectSlot: FilledArgumentSlot | undefined;
  subjectStr: string;
  subjectForConjugation: NounPhraseNode | CoordinatedNounPhraseNode | undefined;
  adverbs: {
    frequency: AdverbNode[];
    manner: AdverbNode[];
    locative: AdverbNode[];
    time: AdverbNode[];
  };
}

/** ClauseNodeから共通コンテキストを準備 */
function prepareClauseContext(clause: ClauseNode, verbPhrase: VerbPhraseNode): ClauseContext {
  const { tense, aspect, polarity, modal, modalPolarity } = clause;
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  // 主語スロットを取得
  const subjectSlot = subjectRole
    ? verbPhrase.arguments.find(a => a.role === subjectRole)
    : undefined;

  // 主語をレンダリング
  const subjectStr = render(subjectSlot?.filler, f => renderFiller(f, true, polarity));

  // 活用用の主語（NounPhraseNode | CoordinatedNounPhraseNode のみ）
  const subjectForConjugation = subjectSlot?.filler &&
    (subjectSlot.filler.type === 'nounPhrase' || subjectSlot.filler.type === 'coordinatedNounPhrase')
    ? subjectSlot.filler as NounPhraseNode | CoordinatedNounPhraseNode
    : undefined;

  // 副詞を種類別に分類
  const adverbs = {
    frequency: verbPhrase.adverbs.filter(a => a.advType === 'frequency'),
    manner: verbPhrase.adverbs.filter(a => a.advType === 'manner'),
    locative: verbPhrase.adverbs.filter(a => a.advType === 'place'),
    time: verbPhrase.adverbs.filter(a => a.advType === 'time'),
  };

  return {
    verbPhrase,
    tense,
    aspect,
    polarity,
    modal,
    modalPolarity,
    verbEntry,
    subjectRole,
    subjectSlot,
    subjectStr,
    subjectForConjugation,
    adverbs,
  };
}

/** 英語の引数出力順序（double object construction対応）
 * recipient（前置詞なし）→ theme の順に並べる
 */
const ENGLISH_ROLE_ORDER: SemanticRole[] = ['recipient', 'theme', 'goal', 'source', 'location', 'instrument', 'attribute'];

/** valencyを英語の語順にソート */
function sortValencyForEnglish(
  valency: Array<{ role: SemanticRole; preposition?: string; required: boolean; label?: string }>,
  excludeRoles: SemanticRole[] = []
) {
  return [...valency]
    .filter(v => !excludeRoles.includes(v.role))
    .sort((a, b) => {
      // 前置詞付きは後ろに
      if (a.preposition && !b.preposition) return 1;
      if (!a.preposition && b.preposition) return -1;
      // 両方前置詞なし、または両方前置詞あり → ENGLISH_ROLE_ORDERで比較
      const aIndex = ENGLISH_ROLE_ORDER.indexOf(a.role);
      const bIndex = ENGLISH_ROLE_ORDER.indexOf(b.role);
      // 配列にない場合は末尾扱い
      const aOrder = aIndex === -1 ? 999 : aIndex;
      const bOrder = bIndex === -1 ? 999 : bIndex;
      return aOrder - bOrder;
    });
}

/** 引数（目的語など）をレンダリング */
function renderOtherArguments(
  ctx: ClauseContext,
  excludeRoles: SemanticRole[] = []
): string {
  const { verbEntry, subjectRole, verbPhrase, polarity } = ctx;
  const allExcluded = subjectRole ? [subjectRole, ...excludeRoles] : excludeRoles;

  return sortValencyForEnglish(verbEntry?.valency || [], allExcluded)
    .map(v => {
      const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const value = render(argSlot?.filler, f => renderFiller(f, false, polarity));
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !argSlot?.filler,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');
}

/** 副詞・前置詞句を文字列化 */
function renderAdverbsAndPrepPhrases(ctx: ClauseContext): {
  mannerStr: string;
  locativeStr: string;
  timeStr: string;
  prepPhrasesStr: string;
} {
  const { adverbs, verbPhrase, polarity } = ctx;

  return {
    mannerStr: adverbs.manner.map(a => stripWhPrefix(a.lemma)).join(' '),
    locativeStr: adverbs.locative.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' '),
    timeStr: adverbs.time.map(a => stripWhPrefix(a.lemma)).join(' '),
    prepPhrasesStr: verbPhrase.prepositionalPhrases
      .map(pp => renderPrepositionalPhrase(pp, polarity))
      .join(' '),
  };
}

/**
 * 等位接続された動詞句をレンダリングする
 *
 * AST は n項ツリーなので、グループ構造をそのまま `renderCoordination` へ渡す。
 * カンマや correlative（both / either）の判断はそちらが構造から決める。
 *
 * 主語の省略だけは表層の並び順で決まるため、ここで葉を出現順に走査して計算する。
 *   例: "I eat and drink"（同じ主語 → 2つ目以降は省略）
 *       "I eat, and my father runs"（主語が違う → 省略しない）
 *
 * @param renderFirst 先頭の葉をレンダリングする関数。時間副詞などを含む
 *   通常の節の経路を使うため、2つ目以降（`renderSingleVerbPhrase`）とは別扱いにする。
 */
function renderCoordinatedVerbPhrase(
  clause: ClauseNode,
  node: CoordinatedVerbPhraseNode,
  renderFirst: (vp: VerbPhraseNode) => string
): string {
  const leaves = collectVerbPhraseLeaves(node);

  // 主語が同じかどうかを判定するキー。主語がない場合は毎回ユニークにして別グループ扱いにする
  let placeholderCount = 0;
  const subjectKey = (vp: VerbPhraseNode): string => {
    const verbEntry = findVerb(vp.verb.lemma);
    for (const role of SUBJECT_ROLES) {
      if (verbEntry?.valency.some((v: { role: SemanticRole }) => v.role === role)) {
        const slot = vp.arguments.find((a: FilledArgumentSlot) => a.role === role);
        if (slot?.filler) return JSON.stringify(slot.filler);
      }
    }
    return `__placeholder_${placeholderCount++}__`;
  };

  // 葉を出現順にレンダリングする（主語の省略は直前の葉との比較で決まる）
  const rendered = new Map<VerbPhraseNode, string>();
  // 主語を省略しなかった2番目以降の葉は独立した節。カンマの判断に使う
  const startsNewClause = new Set<VerbPhraseNode>();
  let previousKey: string | null = null;

  leaves.forEach((vp, index) => {
    const key = subjectKey(vp);
    const omitSubject = index > 0 && key === previousKey;
    previousKey = key;
    if (index > 0 && !omitSubject) {
      startsNewClause.add(vp);
    }

    if (index === 0) {
      rendered.set(vp, renderFirst(vp));
      return;
    }

    // VP個別のpolarityと節レベルのpolarityを組み合わせる
    const vpNegative = vp.polarity === 'negative';
    const clauseNegative = clause.polarity === 'negative';
    rendered.set(
      vp,
      renderSingleVerbPhrase(
        vp,
        clause.tense,
        clause.aspect,
        vpNegative || clauseNegative ? 'negative' : 'affirmative',
        undefined, // 継承なし、各VPは独立してレンダリング
        clause.modal,
        clause.modalPolarity,
        vpNegative && clauseNegative,
        omitSubject
      )
    );
  });

  return renderCoordination(
    toCoordGroup(node, vp => rendered.get(vp) ?? '___', vp => startsNewClause.has(vp)),
    s => s
  );
}

/** 等位接続ツリーの葉（単一の動詞句）を出現順に集める */
function collectVerbPhraseLeaves(node: VerbPhraseConjunct): VerbPhraseNode[] {
  return isCoordinatedVerbPhrase(node)
    ? node.conjuncts.flatMap(collectVerbPhraseLeaves)
    : [node];
}

/** AST の等位接続ツリーを、レンダリング済み文字列のツリーに変換する */
function toCoordGroup(
  node: CoordinatedVerbPhraseNode,
  renderLeaf: (vp: VerbPhraseNode) => string,
  startsNewClause: (vp: VerbPhraseNode) => boolean
): CoordGroup<string> {
  const toItem = (child: VerbPhraseConjunct): CoordItem<string> =>
    isCoordinatedVerbPhrase(child)
      ? group(toCoordGroup(child, renderLeaf, startsNewClause))
      : leaf(renderLeaf(child), startsNewClause(child));

  return { conjunction: node.conjunction, items: node.conjuncts.map(toItem) };
}

// ============================================
// Wh疑問詞検出ヘルパー
// ============================================
interface WhWordInfo {
  whWord: string;           // 疑問詞（who, what など）
  role: SemanticRole;       // 意味役割
  isSubject: boolean;       // 主語位置かどうか
  slot: FilledArgumentSlot; // 元のスロット
}

// Wh副詞情報
interface WhAdverbInfo {
  whWord: string;           // 疑問副詞（where, when, how）
  advType: 'place' | 'time' | 'manner';
  adverb: AdverbNode;       // 元の副詞ノード
}

// NounPhraseNodeから疑問詞を検出
function findInterrogativeInNounPhrase(np: NounPhraseNode): string | null {
  if (np.head.type === 'pronoun') {
    const head = np.head as PronounHead;
    if (head.pronounType === 'interrogative') {
      // ?who → who, ?what → what
      return head.lemma.replace(/^\?/, '');
    }
  }
  return null;
}

// ClauseNodeから疑問詞情報を検出
function findInterrogativeInClause(clause: ClauseNode): WhWordInfo | null {
  const verbPhrase = clause.verbPhrase;
  if (isCoordinatedVerbPhrase(verbPhrase)) return null;
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 動詞のvalencyから実際の主語ロールを決定
  let actualSubjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      actualSubjectRole = role;
      break;
    }
  }

  // 全ての引数を検索してWh語を探す
  for (const slot of verbPhrase.arguments) {
    if (!slot.filler) continue;
    if (slot.filler.type === 'nounPhrase') {
      const whWord = findInterrogativeInNounPhrase(slot.filler as NounPhraseNode);
      if (whWord) {
        // 実際の主語ロールにWh語がある場合のみisSubject: true
        const isSubject = slot.role === actualSubjectRole;
        return { whWord, role: slot.role, isSubject, slot };
      }
    }
  }

  return null;
}

// ClauseNodeから疑問副詞を検出
function findInterrogativeAdverbInClause(clause: ClauseNode): WhAdverbInfo | null {
  const verbPhrase = clause.verbPhrase;
  if (isCoordinatedVerbPhrase(verbPhrase)) return null;

  for (const adverb of verbPhrase.adverbs) {
    if (adverb.lemma.startsWith('?')) {
      const whWord = adverb.lemma.slice(1); // ?where → where
      return {
        whWord,
        advType: adverb.advType as 'place' | 'time' | 'manner',
        adverb,
      };
    }
  }

  return null;
}

// Wh副詞の?プレフィックスを除去（in-situ表示用）
function stripWhPrefix(lemma: string): string {
  return lemma.startsWith('?') ? lemma.slice(1) : lemma;
}

// ============================================
// AST → 英文レンダラー
// ============================================
export function renderToEnglishWithLogs(ast: SentenceNode): RenderResult {
  // Reset tracker for fresh render
  tracker = new DerivationTracker();

  let clause: string;

  switch (ast.sentenceType) {
    case 'imperative':
      clause = renderImperativeClause(ast.clause);
      break;
    case 'interrogative':
      clause = renderInterrogativeClause(ast.clause);
      break;
    case 'fact':
      // 事実宣言: 論理命題として扱う
      clause = renderFactClause(ast.clause);
      break;
    default:
      clause = renderClause(ast.clause);
  }

  // 時間副詞を文末に追加
  const timeAdverbial = ast.timeAdverbial;
  const fullSentence = timeAdverbial ? `${clause} ${timeAdverbial}` : clause;

  // 文頭を大文字に、末尾は文タイプに応じた句読点
  const capitalized = fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1);
  let punctuation: string;
  switch (ast.sentenceType) {
    case 'imperative':
      punctuation = '!';
      break;
    case 'interrogative':
      punctuation = '?';
      break;
    case 'fact':
      punctuation = '.';  // 事実宣言も通常のピリオド
      break;
    default:
      punctuation = '.';
  }

  // 事実宣言の場合は ⊨ マーカーを付与
  if (ast.sentenceType === 'fact') {
    return {
      output: `⊨ ${capitalized}${punctuation}`,
      logs: tracker.toLegacyLogs(),
    };
  }

  return {
    output: capitalized + punctuation,
    logs: tracker.toLegacyLogs(),
  };
}

function renderClause(clause: ClauseNode): string {
  return isCoordinatedVerbPhrase(clause.verbPhrase)
    ? renderCoordinatedVerbPhrase(clause, clause.verbPhrase, vp => renderDeclarativeVp(clause, vp))
    : renderDeclarativeVp(clause, clause.verbPhrase);
}

/** 平叙文を単一の動詞句としてレンダリングする */
function renderDeclarativeVp(clause: ClauseNode, vp: VerbPhraseNode): string {
  const ctx = prepareClauseContext(clause, vp);

  // VP個別のpolarityと節レベルのpolarityを組み合わせる
  const vpNegative = ctx.verbPhrase.polarity === 'negative';
  const clauseNegative = ctx.polarity === 'negative';
  const doubleNegation = vpNegative && clauseNegative;
  const effectivePolarity = (vpNegative || clauseNegative) ? 'negative' : 'affirmative';

  // 動詞を活用
  const verbForm = getDeclarativeVerbForm(
    ctx.verbPhrase.verb.lemma,
    ctx.tense,
    ctx.aspect,
    effectivePolarity,
    ctx.adverbs.frequency,
    ctx.subjectForConjugation,
    ctx.modal,
    ctx.modalPolarity,
    doubleNegation
  );

  // 引数・副詞・前置詞句をレンダリング
  const otherArgs = renderOtherArguments(ctx);
  const { mannerStr, locativeStr, timeStr, prepPhrasesStr } = renderAdverbsAndPrepPhrases(ctx);

  // 語順: Subject + Verb(+neg+freq) + Objects + PrepPhrases + Manner + Location + Time
  const parts = [ctx.subjectStr, verbForm, otherArgs, prepPhrasesStr, mannerStr, locativeStr, timeStr]
    .filter(p => p.length > 0);

  return parts.join(' ');
}

// 事実宣言の節をレンダリング（Logic Extension）
// 通常の平叙文と同様だが、命題レベルの論理演算をサポート
function renderFactClause(clause: ClauseNode): string {
  const { verbPhrase } = clause;

  // 論理演算がある場合は特別処理（logicOp は単一動詞句にのみ付く）
  if (!isCoordinatedVerbPhrase(verbPhrase) && verbPhrase.logicOp) {
    return renderLogicExpression(clause);
  }

  // 論理演算がない場合は通常の平叙文として処理
  return renderClause(clause);
}

// 命題レベルの論理演算をレンダリング
function renderLogicExpression(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect } = clause;
  const logicOp = isCoordinatedVerbPhrase(verbPhrase) ? undefined : verbPhrase.logicOp;

  if (!logicOp) {
    return renderClause(clause);
  }

  // VerbPhraseNodeからClauseNodeを作成するヘルパー
  const makeClause = (vp: VerbPhraseConjunct): ClauseNode => ({
    type: 'clause',
    verbPhrase: vp,
    tense,
    aspect,
    polarity: 'affirmative',
  });

  // オペランドをレンダリングするヘルパー（logicOpがあれば再帰）
  const renderOperand = (node: VerbPhraseConjunct): string => {
    const operandClause = makeClause(node);
    return !isCoordinatedVerbPhrase(node) && node.logicOp
      ? renderLogicExpression(operandClause)
      : renderClause(operandClause);
  };

  /** logicOp を外したノード（オペランド自身を平叙文として描くため） */
  const withoutLogicOp = (node: VerbPhraseConjunct): VerbPhraseConjunct =>
    isCoordinatedVerbPhrase(node) ? node : { ...node, logicOp: undefined };

  // 左側の命題をレンダリング
  // leftOperandがある場合はそれを使用、なければ現在のverbPhrase（logicOp除去）を使用
  const leftStr = renderOperand(logicOp.leftOperand ?? withoutLogicOp(verbPhrase));

  // NOT演算子の特殊処理
  if (logicOp.operator === 'NOT') {
    // NOT(OR(P, Q)) → "neither P nor Q" (De Morgan対応)
    const innerLeft = logicOp.leftOperand;
    const innerOr =
      innerLeft && !isCoordinatedVerbPhrase(innerLeft) && innerLeft.logicOp?.operator === 'OR'
        ? innerLeft.logicOp
        : undefined;
    if (innerLeft && innerOr) {
      const innerLeftStr = renderClause(makeClause(withoutLogicOp(innerLeft)));
      const innerRightStr = render(innerOr.rightOperand, renderOperand);
      return `neither ${innerLeftStr} nor ${innerRightStr}`;
    }
    return `it is not the case that ${leftStr}`;
  }

  // 右側の命題をレンダリング
  const rightStr = render(logicOp.rightOperand, renderOperand);

  // 演算子に応じたフォーマット
  switch (logicOp.operator) {
    case 'AND':
      return `both ${leftStr} and ${rightStr}`;
    case 'OR':
      return `either ${leftStr} or ${rightStr}`;
    case 'IF':
      return `if ${leftStr}, then ${rightStr}`;
    case 'BECAUSE':
      return `${rightStr} because ${leftStr}`;
    default:
      return leftStr;
  }
}

// 疑問文の節をレンダリング（Yes/No疑問文 または Wh疑問文）
function renderInterrogativeClause(clause: ClauseNode): string {
  // Wh疑問詞（名詞）を検出
  const whInfo = findInterrogativeInClause(clause);
  if (whInfo) {
    return renderWhQuestion(clause, whInfo);
  }

  // Wh疑問副詞を検出
  const whAdverbInfo = findInterrogativeAdverbInClause(clause);
  if (whAdverbInfo) {
    return renderWhAdverbQuestion(clause, whAdverbInfo);
  }

  // Yes/No疑問文の場合
  return isCoordinatedVerbPhrase(clause.verbPhrase)
    ? renderCoordinatedVerbPhrase(clause, clause.verbPhrase, vp => renderYesNoQuestionVp(clause, vp))
    : renderYesNoQuestionVp(clause, clause.verbPhrase);
}

/** Yes/No疑問文を単一の動詞句としてレンダリングする */
function renderYesNoQuestionVp(clause: ClauseNode, vp: VerbPhraseNode): string {
  const ctx = prepareClauseContext(clause, vp);

  // VP個別のpolarityと節レベルのpolarityを組み合わせる
  const vpNegative = ctx.verbPhrase.polarity === 'negative';
  const clauseNegative = ctx.polarity === 'negative';
  const doubleNegation = vpNegative && clauseNegative;
  const effectivePolarity = (vpNegative || clauseNegative) ? 'negative' : 'affirmative';

  // 疑問文用の動詞活用（助動詞と本動詞を分離）
  const { auxiliary, mainVerb } = getInterrogativeVerbForm(
    ctx.verbPhrase.verb.lemma,
    ctx.tense,
    ctx.aspect,
    effectivePolarity,
    ctx.adverbs.frequency,
    ctx.subjectForConjugation,
    ctx.modal,
    ctx.modalPolarity,
    doubleNegation
  );

  // 倒置をログ
  tracker.recordSyntax(
    'inversion', 'reorder', 'INVERSION_QUESTION', 'INVERSION_QUESTION_DESC',
    { before: [ctx.subjectStr, auxiliary], after: [auxiliary, ctx.subjectStr] }
  );

  // 引数・副詞・前置詞句をレンダリング
  const otherArgs = renderOtherArguments(ctx);
  const { mannerStr, locativeStr, prepPhrasesStr } = renderAdverbsAndPrepPhrases(ctx);

  // 語順: Auxiliary + Subject + MainVerb + Objects + PrepPhrases + Manner + Location
  const parts = [auxiliary, ctx.subjectStr, mainVerb, otherArgs, prepPhrasesStr, mannerStr, locativeStr]
    .filter(p => p.length > 0);

  return parts.join(' ');
}

// Wh疑問文をレンダリング
function renderWhQuestion(clause: ClauseNode, whInfo: WhWordInfo): string {
  // Wh検出は単一動詞句のときだけ成立する（findInterrogativeInClause 参照）
  const ctx = prepareClauseContext(clause, clause.verbPhrase as VerbPhraseNode);
  const { mannerStr, locativeStr, prepPhrasesStr } = renderAdverbsAndPrepPhrases(ctx);

  // VP個別のpolarityと節レベルのpolarityを組み合わせる
  const vpNegative = ctx.verbPhrase.polarity === 'negative';
  const clauseNegative = ctx.polarity === 'negative';
  const doubleNegation = vpNegative && clauseNegative;
  const effectivePolarity = (vpNegative || clauseNegative) ? 'negative' : 'affirmative';

  // Wh移動をログ
  tracker.recordSyntax(
    'wh-movement', 'move', 'WH_MOVEMENT_FRONT', 'WH_MOVEMENT_FRONT_DESC',
    { element: whInfo.whWord, position: 'sentence start' }
  );

  if (whInfo.isSubject) {
    // 主語Wh疑問文: Who ate the apple? (do-supportなし)
    const verbForm = getDeclarativeVerbForm(
      ctx.verbPhrase.verb.lemma,
      ctx.tense,
      ctx.aspect,
      effectivePolarity,
      ctx.adverbs.frequency,
      undefined, // 疑問詞は3人称単数扱い
      ctx.modal,
      ctx.modalPolarity,
      doubleNegation
    );

    const otherArgs = renderOtherArguments(ctx);
    const parts = [whInfo.whWord, verbForm, otherArgs, prepPhrasesStr, mannerStr, locativeStr]
      .filter(p => p.length > 0);
    return parts.join(' ');
  } else {
    // 目的語Wh疑問文: What did you eat? (do-support必要)
    const { auxiliary, mainVerb } = getInterrogativeVerbForm(
      ctx.verbPhrase.verb.lemma,
      ctx.tense,
      ctx.aspect,
      effectivePolarity,
      ctx.adverbs.frequency,
      ctx.subjectForConjugation,
      ctx.modal,
      ctx.modalPolarity,
      doubleNegation
    );

    // 疑問詞ロールも除外
    const otherArgs = renderOtherArguments(ctx, [whInfo.slot.role]);

    // whom処理: 目的語位置の?whoは?whomになる
    const whWord = whInfo.whWord === 'who' ? 'whom' : whInfo.whWord;

    const parts = [whWord, auxiliary, ctx.subjectStr, mainVerb, otherArgs, prepPhrasesStr, mannerStr, locativeStr]
      .filter(p => p.length > 0);
    return parts.join(' ');
  }
}

// Wh副詞疑問文をレンダリング（Where/When/How did you...?）
function renderWhAdverbQuestion(clause: ClauseNode, whAdverbInfo: WhAdverbInfo): string {
  // Wh検出は単一動詞句のときだけ成立する（findInterrogativeAdverbInClause 参照）
  const ctx = prepareClauseContext(clause, clause.verbPhrase as VerbPhraseNode);

  // VP個別のpolarityと節レベルのpolarityを組み合わせる
  const vpNegative = ctx.verbPhrase.polarity === 'negative';
  const clauseNegative = ctx.polarity === 'negative';
  const doubleNegation = vpNegative && clauseNegative;
  const effectivePolarity = (vpNegative || clauseNegative) ? 'negative' : 'affirmative';

  // Wh副詞を除外した副詞リストで上書き
  const adverbsExcludingWh = {
    ...ctx.adverbs,
    manner: ctx.adverbs.manner.filter(a => a !== whAdverbInfo.adverb),
    locative: ctx.adverbs.locative.filter(a => a !== whAdverbInfo.adverb),
    time: ctx.adverbs.time.filter(a => a !== whAdverbInfo.adverb),
  };

  // 疑問文用の動詞活用
  const { auxiliary, mainVerb } = getInterrogativeVerbForm(
    ctx.verbPhrase.verb.lemma,
    ctx.tense,
    ctx.aspect,
    effectivePolarity,
    ctx.adverbs.frequency,
    ctx.subjectForConjugation,
    ctx.modal,
    ctx.modalPolarity,
    doubleNegation
  );

  // 引数をレンダリング
  const otherArgs = renderOtherArguments(ctx);

  // Wh副詞を除いた副詞・前置詞句を文字列化
  const mannerStr = adverbsExcludingWh.manner.map(a => stripWhPrefix(a.lemma)).join(' ');
  const locativeStr = adverbsExcludingWh.locative.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), ctx.polarity)).join(' ');
  const timeStr = adverbsExcludingWh.time.map(a => stripWhPrefix(a.lemma)).join(' ');
  const prepPhrasesStr = ctx.verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, ctx.polarity))
    .join(' ');

  // 語順: WhAdverb + Auxiliary + Subject + MainVerb + Objects + PrepPhrases + Manner + Location + Time
  const parts = [whAdverbInfo.whWord, auxiliary, ctx.subjectStr, mainVerb, otherArgs, prepPhrasesStr, mannerStr, locativeStr, timeStr]
    .filter(p => p.length > 0);

  return parts.join(' ');
}

// 命令文の節をレンダリング（主語省略、動詞原形）
function renderImperativeClause(clause: ClauseNode): string {
  return isCoordinatedVerbPhrase(clause.verbPhrase)
    ? renderCoordinatedVerbPhrase(clause, clause.verbPhrase, vp => renderImperativeVp(clause, vp))
    : renderImperativeVp(clause, clause.verbPhrase);
}

/** 命令文を単一の動詞句としてレンダリングする */
function renderImperativeVp(clause: ClauseNode, verbPhrase: VerbPhraseNode): string {
  const ctx = prepareClauseContext(clause, verbPhrase);
  const { polarity, modal } = clause;

  // 動詞形を決定（命令文は原形）
  const freqStr = ctx.adverbs.frequency.map(a => a.lemma).join(' ');
  const baseForm = ctx.verbEntry?.forms.base || verbPhrase.verb.lemma;
  let verbForm: string;

  if (modal) {
    // modal付き命令文
    const modalForm = getModalEnglishForm(modal, 'present');
    const aux = modalForm.auxiliary || modal;
    if (polarity === 'negative') {
      verbForm = freqStr ? `${aux} not ${freqStr} ${baseForm}` : `${aux} not ${baseForm}`;
    } else {
      verbForm = freqStr ? `${aux} ${freqStr} ${baseForm}` : `${aux} ${baseForm}`;
    }
  } else if (polarity === 'negative') {
    verbForm = freqStr ? `do not ${freqStr} ${baseForm}` : `do not ${baseForm}`;
  } else {
    verbForm = freqStr ? `${freqStr} ${baseForm}` : baseForm;
  }

  // 命令文の主語省略をログに記録
  tracker.recordSyntax(
    'imperative', 'delete', 'IMPERATIVE_SUBJECT_OMISSION', 'IMPERATIVE_SUBJECT_OMISSION_DESC',
    { element: 'you', before: ['you', verbForm], after: [verbForm] }
  );

  // 引数・副詞・前置詞句をレンダリング
  const otherArgs = renderOtherArguments(ctx);
  const { mannerStr, locativeStr, prepPhrasesStr } = renderAdverbsAndPrepPhrases(ctx);

  // 語順: Verb + Objects + PrepPhrases + Manner + Location（主語なし）
  const parts = [verbForm, otherArgs, prepPhrasesStr, mannerStr, locativeStr].filter(p => p.length > 0);
  return parts.join(' ');
}

/** 単一の動詞句をレンダリング（等位接続を処理しない） */
function renderSingleVerbPhrase(
  vp: VerbPhraseNode,
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  polarity: 'affirmative' | 'negative',
  inheritedSubject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: 'affirmative' | 'negative',
  doubleNegation?: boolean,
  omitSubject?: boolean
): string {
  const verbEntry = findVerb(vp.verb.lemma);

  // 主語ロールを決定
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  const ownSubjectSlot = subjectRole
    ? vp.arguments.find(a => a.role === subjectRole)
    : undefined;

  const hasOwnSubject = ownSubjectSlot?.filler != null;

  // 活用に使う主語を決定
  // - 主語フィラーがあれば、それを使う
  // - 主語フィラーがなく主語ロールがあれば、プレースホルダー表示なので3人称単数扱い（undefined）
  // - 主語ロールがなければ、inheritedSubjectを使う（主語省略のケース）
  const effectiveSubject = hasOwnSubject
    ? (ownSubjectSlot!.filler!.type === 'nounPhrase' || ownSubjectSlot!.filler!.type === 'coordinatedNounPhrase'
        ? ownSubjectSlot!.filler as NounPhraseNode | CoordinatedNounPhraseNode
        : undefined)
    : (subjectRole ? undefined : inheritedSubject);

  // 副詞を分類
  const frequencyAdverbs = vp.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = vp.adverbs.filter(a => a.advType === 'place');

  // 動詞を活用
  const verbForm = getDeclarativeVerbForm(
    vp.verb.lemma,
    tense,
    aspect,
    polarity,
    frequencyAdverbs,
    effectiveSubject,
    hasOwnSubject ? modal : modal,
    hasOwnSubject ? modalPolarity : undefined,
    doubleNegation
  );

  // 主語をレンダリング（値がなければ___）
  // 注: inheritedSubjectは活用用、表示はownSubjectSlotのみ
  // 主語ロールがない動詞では空文字
  // omitSubject: 等位接続で同じ主語の2番目以降のVPでは省略
  const subjectStr = omitSubject
    ? ''
    : (subjectRole
        ? render(ownSubjectSlot?.filler, f => renderFiller(f, true, polarity))
        : '');

  // その他の引数（英語語順にソート）
  const otherArgs = sortValencyForEnglish(verbEntry?.valency || [], subjectRole ? [subjectRole] : [])
    .map(v => {
      const argSlot = vp.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const value = render(argSlot?.filler, f => renderFiller(f, false, polarity));
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !argSlot?.filler,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');
  const prepPhrases = vp.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  const parts = [subjectStr, verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);
  return parts.join(' ');
}

function renderFiller(
  filler: NounPhraseNode | AdjectivePhraseNode | CoordinatedNounPhraseNode,
  isSubject: boolean = false,
  polarity: 'affirmative' | 'negative' = 'affirmative'
): string {
  if (filler.type === 'nounPhrase') {
    return renderNounPhrase(filler as NounPhraseNode, isSubject, polarity);
  } else if (filler.type === 'coordinatedNounPhrase') {
    return renderCoordinatedNounPhrase(filler as CoordinatedNounPhraseNode, isSubject, polarity);
  } else if (filler.type === 'adjectivePhrase') {
    const adjective = filler as AdjectivePhraseNode;
    // 程度副詞（very / quite など）は形容詞の前に置く
    return [adjective.degree?.lemma, adjective.head.lemma].filter(Boolean).join(' ');
  }
  return '';
}

function renderPrepositionalPhrase(pp: PrepositionalPhraseNode, polarity: 'affirmative' | 'negative'): string {
  const objectStr = pp.object.type === 'coordinatedNounPhrase'
    ? renderCoordinatedNounPhrase(pp.object as CoordinatedNounPhraseNode, false, polarity)
    : renderNounPhrase(pp.object as NounPhraseNode, false, polarity);
  return `${pp.preposition} ${objectStr}`;
}

// 場所副詞をレンダリング（極性感応: somewhere ↔ anywhere）
function renderLocativeAdverb(lemma: string, polarity: 'affirmative' | 'negative'): string {
  // 極性感応の場所副詞マッピング
  const polarityMap: Record<string, { affirmative: string; negative: string }> = {
    'somewhere': { affirmative: 'somewhere', negative: 'anywhere' },
    'anywhere': { affirmative: 'somewhere', negative: 'anywhere' },
  };

  const mapping = polarityMap[lemma];
  if (mapping) {
    return polarity === 'negative' ? mapping.negative : mapping.affirmative;
  }

  // 極性感応でない場所副詞はそのまま返す
  return lemma;
}

// モダル概念から英語の実現形式を取得（時制連動）
function getModalEnglishForm(
  modal: ModalType,
  tense: 'past' | 'present' | 'future'
): { auxiliary?: string; usePeriPhrastic?: 'was going to' | 'had to' } {
  if (tense === 'past') {
    switch (modal) {
      case 'ability':    return { auxiliary: 'could' };
      case 'permission': return { auxiliary: 'could' };
      case 'possibility': return { auxiliary: 'might' };
      case 'obligation': return { usePeriPhrastic: 'had to' };
      case 'certainty':  return { auxiliary: 'must' };
      case 'advice':     return { auxiliary: 'should' };
      case 'volition':   return { usePeriPhrastic: 'was going to' };
      case 'prediction': return { auxiliary: 'would' };
    }
  }
  switch (modal) {
    case 'ability':    return { auxiliary: 'can' };
    case 'permission': return { auxiliary: 'may' };
    case 'possibility': return { auxiliary: 'might' };
    case 'obligation': return { auxiliary: 'must' };
    case 'certainty':  return { auxiliary: 'must' };
    case 'advice':     return { auxiliary: 'should' };
    case 'volition':   return { auxiliary: 'will' };
    case 'prediction': return { auxiliary: 'will' };
  }
}

function isThirdSingular(subject: NounPhraseNode | CoordinatedNounPhraseNode): boolean {
  // 等位接続の場合
  if (subject.type === 'coordinatedNounPhrase') {
    // AND: 常に複数扱い → false
    if (subject.conjunction === 'and') {
      return false;
    }
    // OR: 近接一致（最後の要素に合わせる）
    const lastConjunct = subject.conjuncts[subject.conjuncts.length - 1];
    if (lastConjunct.type === 'coordinatedNounPhrase') {
      return isThirdSingular(lastConjunct);
    }
    return isThirdSingularNP(lastConjunct);
  }

  return isThirdSingularNP(subject);
}

function isThirdSingularNP(np: NounPhraseNode): boolean {
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    // singularOnly の名詞（news など）は文法的に常に単数扱い
    const nounCore = nounCores.find(n => n.lemma === nounHead.lemma);
    if (nounCore?.singularOnly) {
      return true;
    }
    // uncountable も単数扱い（"Water is..." not "*Water are..."）
    return nounHead.number === 'singular' || nounHead.number === 'uncountable';
  }

  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    // 3人称単数のみ true
    return pronounHead.person === 3 && pronounHead.number === 'singular';
  }

  return false;
}

// 主語の人称・数を取得（be動詞の活用用）
type PersonNumber = {
  person: 1 | 2 | 3;
  number: 'singular' | 'plural';
};

function getPersonNumber(subject: NounPhraseNode | CoordinatedNounPhraseNode): PersonNumber {
  // 等位接続の場合
  if (subject.type === 'coordinatedNounPhrase') {
    // AND: 常に複数扱い
    if (subject.conjunction === 'and') {
      return { person: 3, number: 'plural' };
    }
    // OR: 近接一致（最後の要素に合わせる）
    const lastConjunct = subject.conjuncts[subject.conjuncts.length - 1];
    if (lastConjunct.type === 'coordinatedNounPhrase') {
      return getPersonNumber(lastConjunct);
    }
    return getPersonNumberNP(lastConjunct);
  }

  return getPersonNumberNP(subject);
}

function getPersonNumberNP(np: NounPhraseNode): PersonNumber {
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    return {
      person: (pronounHead.person || 3) as 1 | 2 | 3,
      number: pronounHead.number || 'singular',
    };
  }

  // 普通名詞は3人称
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    // singularOnly の名詞（news など）は文法的に常に単数扱い
    const nounCore = nounCores.find(n => n.lemma === nounHead.lemma);
    if (nounCore?.singularOnly) {
      return { person: 3, number: 'singular' };
    }
    // uncountable も動詞活用では単数扱い
    const number = nounHead.number === 'uncountable' ? 'singular' : (nounHead.number || 'singular');
    return {
      person: 3,
      number,
    };
  }

  return { person: 3, number: 'singular' };
}
