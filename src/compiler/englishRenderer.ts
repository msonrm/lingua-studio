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
  ModalType,
} from '../types/schema';
import { findVerb, findNoun, findPronoun } from '../data/dictionary';
import { RenderResult } from '../types/grammarLog';
import { DerivationTracker } from '../grammar/DerivationTracker';
import {
  conjugateVerb,
  ConjugationContext,
  ConjugationResult,
  Tense,
  Aspect,
  Polarity,
  ModalType as ConjugationModalType,
} from '../grammar/conjugation';
import {
  renderNounPhraseUnified,
  renderCoordinatedNounPhraseUnified,
  NounPhraseContext,
  NounPhraseDependencies,
} from '../grammar/nounPhrase';

// Derivation tracker (module-level, reset on each render)
let tracker = new DerivationTracker();

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
  modalPolarity?: Polarity
): ConjugationResult {
  const ctx: ConjugationContext = {
    tense,
    aspect,
    polarity,
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
  modalPolarity?: Polarity
): string {
  const result = conjugateVerbUnified(
    lemma, tense, aspect, polarity, frequencyAdverbs, subject, modal, modalPolarity
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
    if (isNegative) {
      return `${result.auxiliary} not ${result.mainVerb}`.trim();
    }
  }

  // be動詞の特殊処理
  if (lemma === 'be' && aspect === 'simple' && !modal) {
    if (isNegative) {
      return `${result.auxiliary} not ${result.mainVerb}`.trim();
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
  modalPolarity?: Polarity
): { auxiliary: string; mainVerb: string } {
  const result = conjugateVerbUnified(
    lemma, tense, aspect, polarity, frequencyAdverbs, subject, modal, modalPolarity
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
  const { verbPhrase } = clause;
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
  const { verbPhrase } = clause;

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
export function renderToEnglish(ast: SentenceNode): string {
  return renderToEnglishWithLogs(ast).output;
}

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
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;

  // 動詞エントリを取得
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  // これにより、動詞ごとに固定の主語ロールが決まる
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

  // 主語をレンダリング（値があれば表示、なければ ___）
  const subject = subjectSlot?.filler
    ? renderFiller(subjectSlot.filler, true, polarity)
    : '___';

  // 副詞を種類別に分類
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place');
  const timeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'time');

  // 動詞を活用（否定含む、頻度副詞を挿入位置で返す）
  // 主語が NounPhraseNode か CoordinatedNounPhraseNode の場合のみ渡す
  const subjectForConjugation = subjectSlot?.filler &&
    (subjectSlot.filler.type === 'nounPhrase' || subjectSlot.filler.type === 'coordinatedNounPhrase')
    ? subjectSlot.filler as NounPhraseNode | CoordinatedNounPhraseNode
    : undefined;
  const verbForm = getDeclarativeVerbForm(
    verbPhrase.verb.lemma,
    tense,
    aspect,
    polarity,
    frequencyAdverbs,
    subjectForConjugation,
    modal,
    modalPolarity
  );

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：
  // 1. 全スロットに ___ を想定
  // 2. フィラーがあれば値を代入
  // 3. オプショナルな欠損は省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,  // オプショナルかつ空なら省略
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');

  // 時間副詞（Wh副詞は?を除去）
  const timeStr = timeAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // 語順: Subject + Verb(+neg+freq) + Objects + PrepPhrases + Manner + Location + Time
  const parts = [subject, verbForm, otherArgs, prepPhrases, mannerStr, locativeStr, timeStr].filter(p => p.length > 0);

  let result = parts.join(' ');

  // 動詞の等位接続を処理
  if (verbPhrase.coordinatedWith) {
    const coordVP = verbPhrase.coordinatedWith.verbPhrase;
    const conjunction = verbPhrase.coordinatedWith.conjunction;
    const coordVerbStr = renderCoordinatedVerbPhrase(coordVP, tense, aspect, polarity, subjectForConjugation, modal, modalPolarity);
    result += ` ${conjunction} ${coordVerbStr}`;
  }

  return result;
}

// 事実宣言の節をレンダリング（Logic Extension）
// 通常の平叙文と同様だが、命題レベルの論理演算をサポート
function renderFactClause(clause: ClauseNode): string {
  const { verbPhrase } = clause;

  // 論理演算がある場合は特別処理
  if (verbPhrase.logicOp) {
    return renderLogicExpression(clause);
  }

  // 論理演算がない場合は通常の平叙文として処理
  return renderClause(clause);
}

// 命題レベルの論理演算をレンダリング
function renderLogicExpression(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect } = clause;
  const logicOp = verbPhrase.logicOp;

  if (!logicOp) {
    return renderClause(clause);
  }

  // leftOperandがある場合はネストされた論理式（例: NOT(AND(P, Q))）
  // そうでなければ現在のverbPhraseを左側の命題として使用
  let leftStr: string;
  if (logicOp.leftOperand) {
    // ネストされた論理式をレンダリング
    const nestedClause: ClauseNode = {
      type: 'clause',
      verbPhrase: logicOp.leftOperand,
      tense,
      aspect,
      polarity: 'affirmative',
    };
    // leftOperandがlogicOpを持つ場合は再帰的にrenderLogicExpressionを呼ぶ
    leftStr = logicOp.leftOperand.logicOp
      ? renderLogicExpression(nestedClause)
      : renderClause(nestedClause);
  } else {
    // 現在のverbPhraseを左側として使用（論理演算を除去）
    const leftClause: ClauseNode = {
      ...clause,
      verbPhrase: {
        ...verbPhrase,
        logicOp: undefined,
      },
    };
    leftStr = renderClause(leftClause);
  }

  if (logicOp.operator === 'NOT') {
    // NOT(OR(P, Q)) → "neither P nor Q" (De Morgan対応)
    if (logicOp.leftOperand?.logicOp?.operator === 'OR') {
      const innerOr = logicOp.leftOperand.logicOp;
      // 内側のORの左側をレンダリング
      const innerLeftClause: ClauseNode = {
        type: 'clause',
        verbPhrase: {
          ...logicOp.leftOperand,
          logicOp: undefined,  // ORを除去
        },
        tense,
        aspect,
        polarity: 'affirmative',
      };
      const innerLeftStr = renderClause(innerLeftClause);

      // 内側のORの右側をレンダリング
      let innerRightStr: string;
      if (innerOr.rightOperand) {
        const innerRightClause: ClauseNode = {
          type: 'clause',
          verbPhrase: innerOr.rightOperand,
          tense,
          aspect,
          polarity: 'affirmative',
        };
        innerRightStr = innerOr.rightOperand.logicOp
          ? renderLogicExpression(innerRightClause)
          : renderClause(innerRightClause);
      } else {
        innerRightStr = '___';
      }

      return `neither ${innerLeftStr} nor ${innerRightStr}`;
    }

    // 通常のNOT: "It is not the case that P"
    return `it is not the case that ${leftStr}`;
  }

  // AND / OR: 右側の命題もレンダリング
  let rightStr: string;
  if (logicOp.rightOperand) {
    const rightClause: ClauseNode = {
      type: 'clause',
      verbPhrase: logicOp.rightOperand,
      tense,
      aspect,
      polarity: 'affirmative',
    };
    // rightOperandがlogicOpを持つ場合は再帰的にrenderLogicExpressionを呼ぶ
    rightStr = logicOp.rightOperand.logicOp
      ? renderLogicExpression(rightClause)
      : renderClause(rightClause);
  } else {
    rightStr = '___';  // 右側欠損
  }

  if (logicOp.operator === 'AND') {
    // AND: "both P and Q" (論理的接続)
    return `both ${leftStr} and ${rightStr}`;
  } else if (logicOp.operator === 'OR') {
    // OR: "either P or Q" (論理的選択)
    return `either ${leftStr} or ${rightStr}`;
  } else if (logicOp.operator === 'IF') {
    // IF: "if P, then Q" (条件・含意)
    return `if ${leftStr}, then ${rightStr}`;
  } else if (logicOp.operator === 'BECAUSE') {
    // BECAUSE: "Q because P" (因果関係 - 結果を先に)
    return `${rightStr} because ${leftStr}`;
  }

  return leftStr;
}

// 疑問文の節をレンダリング（Yes/No疑問文 または Wh疑問文）
function renderInterrogativeClause(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;

  // Wh疑問詞（名詞）を検出
  const whInfo = findInterrogativeInClause(clause);

  // Wh疑問文（名詞）の場合は専用レンダリング
  if (whInfo) {
    return renderWhQuestion(clause, whInfo);
  }

  // Wh疑問副詞を検出
  const whAdverbInfo = findInterrogativeAdverbInClause(clause);

  // Wh副詞疑問文の場合は専用レンダリング
  if (whAdverbInfo) {
    return renderWhAdverbQuestion(clause, whAdverbInfo);
  }

  // Yes/No疑問文の場合

  // 動詞エントリを取得
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

  // 主語をレンダリング（値があれば表示、なければ ___）
  const subject = subjectSlot?.filler
    ? renderFiller(subjectSlot.filler, true, polarity)
    : '___';

  // 副詞を種類別に分類
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place');

  // 主語が NounPhraseNode か CoordinatedNounPhraseNode の場合のみ渡す
  const subjectForConjugation = subjectSlot?.filler &&
    (subjectSlot.filler.type === 'nounPhrase' || subjectSlot.filler.type === 'coordinatedNounPhrase')
    ? subjectSlot.filler as NounPhraseNode | CoordinatedNounPhraseNode
    : undefined;

  // 疑問文用の動詞活用（助動詞と本動詞を分離して返す）
  const { auxiliary, mainVerb } = getInterrogativeVerbForm(
    verbPhrase.verb.lemma,
    tense,
    aspect,
    polarity,
    frequencyAdverbs,
    subjectForConjugation,
    modal,
    modalPolarity
  );

  // 倒置をログ（Yes/No疑問文）
  tracker.recordSyntax(
    'inversion', 'reorder', 'INVERSION_QUESTION', 'INVERSION_QUESTION_DESC',
    { before: [subject, auxiliary], after: [auxiliary, subject] }
  );

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere、Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // 語順: Auxiliary + Subject + MainVerb + Objects + PrepPhrases + Manner + Location
  const parts = [auxiliary, subject, mainVerb, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);

  let result = parts.join(' ');

  // 動詞の等位接続を処理
  if (verbPhrase.coordinatedWith) {
    const coordVP = verbPhrase.coordinatedWith.verbPhrase;
    const conjunction = verbPhrase.coordinatedWith.conjunction;
    const coordVerbStr = renderCoordinatedVerbPhrase(coordVP, tense, aspect, polarity, subjectForConjugation, modal, modalPolarity);
    result += ` ${conjunction} ${coordVerbStr}`;
  }

  return result;
}

// Wh疑問文をレンダリング
function renderWhQuestion(clause: ClauseNode, whInfo: WhWordInfo): string {
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  // 副詞を種類別に分類
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');
  // 場所副詞は最後（Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');
  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // Wh移動をログ
  tracker.recordSyntax(
    'wh-movement', 'move', 'WH_MOVEMENT_FRONT', 'WH_MOVEMENT_FRONT_DESC',
    { element: whInfo.whWord, position: 'sentence start' }
  );

  if (whInfo.isSubject) {
    // 主語Wh疑問文: Who ate the apple? (do-supportなし)
    // 語順: Wh + Verb(活用) + Objects + ...

    // 動詞を3人称単数として活用（疑問詞は3人称単数扱い）
    const verbForm = getDeclarativeVerbForm(
      verbPhrase.verb.lemma,
      tense,
      aspect,
      polarity,
      frequencyAdverbs,
      undefined, // 主語は疑問詞なので3人称単数
      modal,
      modalPolarity
    );

    // 疑問詞（主語）以外の引数
    // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
    const otherArgs = (verbEntry?.valency || [])
      .filter(v => v.role !== subjectRole)
      .map(v => {
        const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
        const preposition = v.preposition;
        const filled = argSlot?.filler;
        const value = filled ? renderFiller(filled, false, polarity) : '___';
        return {
          text: preposition ? `${preposition} ${value}` : value,
          skip: !v.required && !filled,
        };
      })
      .filter(item => !item.skip)
      .map(item => item.text)
      .join(' ');

    const parts = [whInfo.whWord, verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);
    return parts.join(' ');
  } else {
    // 目的語Wh疑問文: What did you eat? (do-support必要)
    // 語順: Wh + Auxiliary + Subject + MainVerb + (他の目的語) + ...

    // 主語スロットを取得
    const subjectSlot = subjectRole
      ? verbPhrase.arguments.find(a => a.role === subjectRole)
      : undefined;

    // 主語をレンダリング（値があれば表示、なければ ___）
    const subject = subjectSlot?.filler
      ? renderFiller(subjectSlot.filler, true, polarity)
      : '___';
    const subjectForConjugation = subjectSlot?.filler &&
      (subjectSlot.filler.type === 'nounPhrase' || subjectSlot.filler.type === 'coordinatedNounPhrase')
      ? subjectSlot.filler as NounPhraseNode | CoordinatedNounPhraseNode
      : undefined;

    // 疑問文用の動詞活用
    const { auxiliary, mainVerb } = getInterrogativeVerbForm(
      verbPhrase.verb.lemma,
      tense,
      aspect,
      polarity,
      frequencyAdverbs,
      subjectForConjugation,
      modal,
      modalPolarity
    );

    // 疑問詞と主語以外の引数
    // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
    const whRole = whInfo.slot.role;
    const otherArgs = (verbEntry?.valency || [])
      .filter(v => v.role !== subjectRole && v.role !== whRole)
      .map(v => {
        const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
        const preposition = v.preposition;
        const filled = argSlot?.filler;
        const value = filled ? renderFiller(filled, false, polarity) : '___';
        return {
          text: preposition ? `${preposition} ${value}` : value,
          skip: !v.required && !filled,
        };
      })
      .filter(item => !item.skip)
      .map(item => item.text)
      .join(' ');

    // whom処理: 目的語位置の?whoは?whomになる
    let whWord = whInfo.whWord;
    if (whWord === 'who') {
      // 目的語位置なので whom を使用（ただし口語では who も許容）
      whWord = 'whom';
    }

    const parts = [whWord, auxiliary, subject, mainVerb, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);
    return parts.join(' ');
  }
}

// Wh副詞疑問文をレンダリング（Where/When/How did you...?）
function renderWhAdverbQuestion(clause: ClauseNode, whAdverbInfo: WhAdverbInfo): string {
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;
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

  // 主語をレンダリング（値があれば表示、なければ ___）
  const subject = subjectSlot?.filler
    ? renderFiller(subjectSlot.filler, true, polarity)
    : '___';
  const subjectForConjugation = subjectSlot?.filler &&
    (subjectSlot.filler.type === 'nounPhrase' || subjectSlot.filler.type === 'coordinatedNounPhrase')
    ? subjectSlot.filler as NounPhraseNode | CoordinatedNounPhraseNode
    : undefined;

  // 副詞を種類別に分類（Wh副詞は除外）
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner' && a !== whAdverbInfo.adverb);
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place' && a !== whAdverbInfo.adverb);
  const timeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'time' && a !== whAdverbInfo.adverb);

  // 疑問文用の動詞活用（助動詞と本動詞を分離）
  const { auxiliary, mainVerb } = getInterrogativeVerbForm(
    verbPhrase.verb.lemma,
    tense,
    aspect,
    polarity,
    frequencyAdverbs,
    subjectForConjugation,
    modal,
    modalPolarity
  );

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');
  // 場所副詞（Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');
  // 時間副詞（Wh副詞は?を除去）
  const timeStr = timeAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // Wh副詞を先頭に、その後は通常の疑問文語順
  // Where + Auxiliary + Subject + MainVerb + Objects + PrepPhrases + Manner + Location + Time
  const parts = [whAdverbInfo.whWord, auxiliary, subject, mainVerb, otherArgs, prepPhrases, mannerStr, locativeStr, timeStr].filter(p => p.length > 0);

  let result = parts.join(' ');

  // 動詞の等位接続を処理
  if (verbPhrase.coordinatedWith) {
    const coordVP = verbPhrase.coordinatedWith.verbPhrase;
    const conjunction = verbPhrase.coordinatedWith.conjunction;
    const coordVerbStr = renderCoordinatedVerbPhrase(coordVP, tense, aspect, polarity, subjectForConjugation, modal, modalPolarity);
    result += ` ${conjunction} ${coordVerbStr}`;
  }

  return result;
}

// 命令文の節をレンダリング（主語省略、動詞原形）
function renderImperativeClause(clause: ClauseNode): string {
  const { verbPhrase, polarity, modal } = clause;
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 副詞を種類別に分類
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place');

  // 動詞形を決定（命令文は原形）
  let verbForm: string;
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');

  if (modal) {
    // modal付き命令文は珍しいが対応
    const modalForm = getModalEnglishForm(modal, 'present');
    const aux = modalForm.auxiliary || modal;
    const baseForm = verbEntry?.forms.base || verbPhrase.verb.lemma;
    if (polarity === 'negative') {
      verbForm = freqStr
        ? `${aux} not ${freqStr} ${baseForm}`
        : `${aux} not ${baseForm}`;
    } else {
      verbForm = freqStr
        ? `${aux} ${freqStr} ${baseForm}`
        : `${aux} ${baseForm}`;
    }
  } else if (polarity === 'negative') {
    // 否定命令: "Don't eat" / "Do not eat"
    const baseForm = verbEntry?.forms.base || verbPhrase.verb.lemma;
    verbForm = freqStr
      ? `do not ${freqStr} ${baseForm}`
      : `do not ${baseForm}`;
  } else {
    // 肯定命令: 原形のみ
    const baseForm = verbEntry?.forms.base || verbPhrase.verb.lemma;
    verbForm = freqStr ? `${freqStr} ${baseForm}` : baseForm;
  }

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  // 命令文では主語は省略される（暗黙の "you"）
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = verbPhrase.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere、Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // 語順: Verb + Objects + PrepPhrases + Manner + Location（主語なし）
  const parts = [verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);
  let result = parts.join(' ');

  // 動詞の等位接続を処理（命令文でも対応）
  if (verbPhrase.coordinatedWith) {
    const coordVP = verbPhrase.coordinatedWith.verbPhrase;
    const conjunction = verbPhrase.coordinatedWith.conjunction;
    // 命令文の等位接続: 同じ形式で継続（原形、主語なし）
    const coordVerbStr = renderImperativeCoordinatedVP(coordVP, polarity, modal);
    result += ` ${conjunction} ${coordVerbStr}`;
  }

  return result;
}

// 命令文の等位接続動詞句をレンダリング
function renderImperativeCoordinatedVP(
  vp: VerbPhraseNode,
  polarity: 'affirmative' | 'negative',
  modal?: string
): string {
  const verbEntry = findVerb(vp.verb.lemma);

  // 副詞を種類別に分類
  const frequencyAdverbs = vp.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = vp.adverbs.filter(a => a.advType === 'place');

  // 動詞形を決定（命令文は原形）
  let verbForm: string;
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');
  const baseForm = verbEntry?.forms.base || vp.verb.lemma;

  // 等位接続の2番目以降は、否定でも do not を繰り返さない（原形のみ）
  // "Don't run and eat" ではなく "Don't run or eat" が自然だが、
  // ここでは単純に原形を使う
  verbForm = freqStr ? `${freqStr} ${baseForm}` : baseForm;

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = vp.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere、Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = vp.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  const parts = [verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);
  let result = parts.join(' ');

  // 再帰的に等位接続を処理
  if (vp.coordinatedWith) {
    const coordVPInner = vp.coordinatedWith.verbPhrase;
    const conjunctionInner = vp.coordinatedWith.conjunction;
    const coordVerbStr = renderImperativeCoordinatedVP(coordVPInner, polarity, modal);
    result += ` ${conjunctionInner} ${coordVerbStr}`;
  }

  return result;
}

// 等位接続された動詞句をレンダリング
// 右側の動詞に独自の主語がある場合は完全な節としてレンダリング
function renderCoordinatedVerbPhrase(
  vp: VerbPhraseNode,
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  polarity: 'affirmative' | 'negative',
  leftSubject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: 'affirmative' | 'negative'
): string {
  const verbEntry = findVerb(vp.verb.lemma);

  // 主語ロールを決定（valency内のSUBJECT_ROLEを優先順で探す）
  let subjectRole: SemanticRole | undefined;
  for (const role of SUBJECT_ROLES) {
    if (verbEntry?.valency.some(v => v.role === role)) {
      subjectRole = role;
      break;
    }
  }

  // 主語スロットを取得
  const ownSubjectSlot = subjectRole
    ? vp.arguments.find(a => a.role === subjectRole)
    : undefined;

  // 右側の動詞に独自の主語があるかどうかを判定
  const hasOwnSubject = ownSubjectSlot?.filler != null;
  // effectiveSubject: NounPhraseNode または CoordinatedNounPhraseNode のみ
  const effectiveSubject = hasOwnSubject
    ? (ownSubjectSlot!.filler!.type === 'nounPhrase' || ownSubjectSlot!.filler!.type === 'coordinatedNounPhrase'
        ? ownSubjectSlot!.filler as NounPhraseNode | CoordinatedNounPhraseNode
        : undefined)
    : leftSubject;

  // 副詞を種類別に分類
  const frequencyAdverbs = vp.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = vp.adverbs.filter(a => a.advType === 'place');

  // 動詞を活用（effectiveSubject で人称・数を決定）
  // 独自の主語がある場合はモーダルを繰り返す、ない場合はモーダルのスコープ内（原形）
  const verbForm = getDeclarativeVerbForm(
    vp.verb.lemma,
    tense,
    aspect,
    polarity,
    frequencyAdverbs,
    effectiveSubject,
    hasOwnSubject ? modal : modal,  // モーダルは常に渡す（原形になる）
    hasOwnSubject ? modalPolarity : undefined  // 独自主語がある場合のみモーダルを表示
  );

  // 主語をレンダリング（独自の主語がある場合のみ）
  const subjectStr = hasOwnSubject && ownSubjectSlot?.filler
    ? renderFiller(ownSubjectSlot.filler, true, polarity)
    : '';

  // その他の引数（目的語など）- 主語ロール以外
  // シンプルなアルゴリズム：全スロット ___ → 値代入 → オプショナル欠損省略
  const otherArgs = (verbEntry?.valency || [])
    .filter(v => v.role !== subjectRole)
    .map(v => {
      const argSlot = vp.arguments.find(a => a.role === v.role);
      const preposition = v.preposition;
      const filled = argSlot?.filler;
      const value = filled ? renderFiller(filled, false, polarity) : '___';
      return {
        text: preposition ? `${preposition} ${value}` : value,
        skip: !v.required && !filled,
      };
    })
    .filter(item => !item.skip)
    .map(item => item.text)
    .join(' ');

  // 様態副詞は文末（Wh副詞は?を除去）
  const mannerStr = mannerAdverbs.map(a => stripWhPrefix(a.lemma)).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere、Wh副詞は?を除去）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(stripWhPrefix(a.lemma), polarity)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = vp.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  const parts = [subjectStr, verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);

  let result = parts.join(' ');

  // 再帰的に等位接続を処理
  if (vp.coordinatedWith) {
    const coordVPInner = vp.coordinatedWith.verbPhrase;
    const conjunctionInner = vp.coordinatedWith.conjunction;
    const coordVerbStr = renderCoordinatedVerbPhrase(coordVPInner, tense, aspect, polarity, effectiveSubject, modal, modalPolarity);
    result += ` ${conjunctionInner} ${coordVerbStr}`;
  }

  return result;
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
    return (filler as AdjectivePhraseNode).head.lemma;
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
    return nounHead.number === 'singular';
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
    return {
      person: 3,
      number: nounHead.number || 'singular',
    };
  }

  return { person: 3, number: 'singular' };
}
