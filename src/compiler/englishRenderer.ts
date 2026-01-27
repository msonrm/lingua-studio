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
  CoordinationConjunct,
  Conjunction,
  VerbPhraseNode,
  ModalType,
} from '../types/schema';
import { findVerb, findNoun, findPronoun } from '../data/dictionary';
import { RenderResult } from '../types/grammarLog';
import { DerivationTracker } from '../grammar/DerivationTracker';

// Derivation tracker (module-level, reset on each render)
let tracker = new DerivationTracker();

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
  const verbForm = conjugateVerbWithAdverbs(
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
  const { auxiliary, mainVerb } = conjugateVerbForQuestion(
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
    'inversion', 'reorder', 'subject-auxiliary inversion',
    'Question formation',
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
    'wh-movement', 'move', 'fronted to sentence start',
    `Wh-word "${whInfo.whWord}" in ${whInfo.role}`,
    { element: whInfo.whWord, position: 'sentence start' }
  );

  if (whInfo.isSubject) {
    // 主語Wh疑問文: Who ate the apple? (do-supportなし)
    // 語順: Wh + Verb(活用) + Objects + ...

    // 動詞を3人称単数として活用（疑問詞は3人称単数扱い）
    const verbForm = conjugateVerbWithAdverbs(
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
    const { auxiliary, mainVerb } = conjugateVerbForQuestion(
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
  const { auxiliary, mainVerb } = conjugateVerbForQuestion(
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
  const verbForm = conjugateVerbWithAdverbs(
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

function renderCoordinatedNounPhrase(
  coordNP: CoordinatedNounPhraseNode,
  isSubject: boolean,
  polarity: 'affirmative' | 'negative'
): string {
  if (coordNP.conjuncts.length === 0) return '';
  if (coordNP.conjuncts.length === 1) {
    return renderConjunct(coordNP.conjuncts[0], isSubject, polarity, coordNP.conjunction);
  }

  // 各要素をレンダリング（入れ子の場合は相関接続詞付き）
  const renderedParts = coordNP.conjuncts.map(conjunct =>
    renderConjunct(conjunct, isSubject, polarity, coordNP.conjunction)
  );

  // 2つの場合: "A and B" または "A, and either B or C"
  if (renderedParts.length === 2) {
    // 入れ子に異なる接続詞がある場合、外側の接続詞の前にカンマを入れる
    const hasNestedDifferent = coordNP.conjuncts.some(
      c => c.type === 'coordinatedNounPhrase' && c.conjunction !== coordNP.conjunction
    );
    const separator = hasNestedDifferent ? `, ${coordNP.conjunction} ` : ` ${coordNP.conjunction} `;
    return `${renderedParts[0]}${separator}${renderedParts[1]}`;
  }

  // 3つ以上: "A, B, and C" (Oxford comma)
  const lastItem = renderedParts.pop()!;
  return `${renderedParts.join(', ')}, ${coordNP.conjunction} ${lastItem}`;
}

// 等位接続の要素をレンダリング（入れ子の場合は相関接続詞を使用）
function renderConjunct(
  conjunct: CoordinationConjunct,
  isSubject: boolean,
  polarity: 'affirmative' | 'negative',
  parentConjunction: Conjunction
): string {
  if (conjunct.type === 'nounPhrase') {
    return renderNounPhrase(conjunct, isSubject, polarity);
  }

  // 入れ子のCoordinatedNounPhraseNode
  const nested = conjunct;

  // 同じ接続詞の場合は通常レンダリング（フラット化はAST側で済み）
  if (nested.conjunction === parentConjunction) {
    return renderCoordinatedNounPhrase(nested, isSubject, polarity);
  }

  // 異なる接続詞の場合は相関接続詞を使用
  // and → "both A and B"
  // or → "either A or B"
  const correlative = nested.conjunction === 'and' ? 'both' : 'either';
  const innerRendered = renderCoordinatedNounPhrase(nested, isSubject, polarity);
  return `${correlative} ${innerRendered}`;
}

function renderNounPhrase(np: NounPhraseNode, isSubject: boolean = true, polarity: 'affirmative' | 'negative' = 'affirmative'): string {
  // 代名詞の処理
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    let result = renderPronoun(pronounHead, isSubject, polarity);
    // 不定代名詞 + 形容詞: "something good", "someone important"
    // 形容詞は後置される
    if (pronounHead.pronounType === 'indefinite' && np.adjectives.length > 0) {
      const adjs = np.adjectives.map(adj => adj.lemma).join(' ');
      result += ' ' + adjs;
    }
    // 前置詞句修飾（代名詞用）: "someone in the room"
    if (np.prepModifier) {
      result += ' ' + renderPrepositionalPhrase(np.prepModifier, polarity);
    }
    return result;
  }

  const parts: string[] = [];

  // 前置限定詞（all, both, half）
  if (np.preDeterminer) {
    parts.push(np.preDeterminer);
  }

  // 中央限定詞（the, this, my, a/an, no）
  if (np.determiner && np.determiner.lexeme) {
    if (np.determiner.lexeme === 'a') {
      // a/an の判定は後で行う
      parts.push('INDEF');
    } else {
      parts.push(np.determiner.lexeme);
    }
  }

  // 後置限定詞（one, two, many, few）
  if (np.postDeterminer) {
    parts.push(np.postDeterminer);
  }

  // 形容詞
  np.adjectives.forEach(adj => {
    parts.push(adj.lemma);
  });

  // 名詞
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    const nounEntry = findNoun(nounHead.lemma);

    if (nounHead.number === 'plural' && nounEntry) {
      parts.push(nounEntry.plural);
    } else {
      parts.push(nounHead.lemma);
    }
  }

  // a/an の処理
  let result = parts.join(' ');
  if (result.includes('INDEF ')) {
    const idx = result.indexOf('INDEF ');
    const before = result.slice(0, idx);
    const after = result.slice(idx + 6);
    const firstChar = after.charAt(0).toLowerCase();
    const article = ['a', 'e', 'i', 'o', 'u'].includes(firstChar) ? 'an' : 'a';
    if (article === 'an') {
      tracker.recordMorphology(
        'article', 'a', 'an', 'a → an',
        `Next sound: vowel "${firstChar}"`
      );
    }
    result = before + article + ' ' + after;
  }

  // 前置詞句修飾（名詞用）: "the apple on the desk"
  if (np.prepModifier) {
    result += ' ' + renderPrepositionalPhrase(np.prepModifier, polarity);
  }

  return result;
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

function renderPronoun(head: PronounHead, isSubject: boolean, polarity: 'affirmative' | 'negative'): string {
  const pronoun = findPronoun(head.lemma);

  if (!pronoun) {
    // 疑問詞（?who, ?what）の場合、?を除去して返す
    if (head.lemma.startsWith('?')) {
      const stripped = head.lemma.slice(1);
      // 目的格の場合は whom を使用
      if (!isSubject && stripped === 'who') {
        return 'whom';
      }
      return stripped;
    }
    return head.lemma;
  }

  // 疑問詞の場合
  if (pronoun.type === 'interrogative') {
    const lemma = pronoun.lemma.replace(/^\?/, '');
    if (isSubject) {
      return lemma;
    } else {
      return pronoun.objectForm.replace(/^\?/, '');
    }
  }

  // 不定代名詞の極性による切り替え（someone → anyone / nobody）
  if (pronoun.polaritySensitive) {
    if (polarity === 'negative' && pronoun.negativeForm) {
      // 否定文の場合は nobody/nothing を使用
      return pronoun.negativeForm;
    }
    // 疑問文や否定コンテキストでは anyone/anything を使用（将来対応）
    // 現時点では肯定形をそのまま使用
  }

  // 格変化: 主格 vs 目的格
  if (isSubject) {
    return pronoun.lemma;
  } else {
    if (pronoun.lemma !== pronoun.objectForm) {
      tracker.recordMorphology(
        'case', pronoun.lemma, pronoun.objectForm,
        'objective case', 'Position: object'
      );
    }
    return pronoun.objectForm;
  }
}

// 否定と頻度副詞を含む動詞活用
function conjugateVerbWithAdverbs(
  lemma: string,
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  polarity: 'affirmative' | 'negative',
  frequencyAdverbs: AdverbNode[],
  subject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: 'affirmative' | 'negative'
): string {
  const verbEntry = findVerb(lemma);
  if (!verbEntry) return lemma;

  const isNegative = polarity === 'negative';
  // 主語がない場合は "someone"（3人称単数）として扱う
  const isThirdPersonSingular = subject ? isThirdSingular(subject) : true;
  const personNumber = subject ? getPersonNumber(subject) : { person: 3 as const, number: 'singular' as const };
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');

  // モダリティがある場合の処理
  if (modal) {
    return conjugateWithModal(lemma, tense, aspect, polarity, frequencyAdverbs, modal, verbEntry, modalPolarity);
  }

  // 不規則動詞（be動詞など）の活用形を取得
  const getIrregularForm = (t: 'past' | 'present'): string | undefined => {
    if (verbEntry.forms.irregular) {
      const key = getIrregularFormKey(t, personNumber);
      return verbEntry.forms.irregular[key];
    }
    return undefined;
  };

  // be動詞の助動詞形を取得（進行形などで使用）
  const getBeAuxiliary = (t: 'past' | 'present' | 'future'): string => {
    if (t === 'future') return 'will be';
    // be動詞の不規則活用を使用
    const beVerb = findVerb('be');
    if (beVerb?.forms.irregular) {
      const key = getIrregularFormKey(t, personNumber);
      const form = beVerb.forms.irregular[key];
      if (form) return form;
    }
    // フォールバック
    return t === 'past' ? 'was' : (isThirdPersonSingular ? 'is' : 'are');
  };

  // Simple aspect - 否定は do-support が必要（be動詞は例外）
  if (aspect === 'simple') {
    // be動詞の特別処理
    if (lemma === 'be') {
      const beForm = tense === 'future'
        ? 'will be'
        : getIrregularForm(tense as 'past' | 'present') || verbEntry.forms.base;

      if (isNegative) {
        // be + not: am not, is not, are not, was not, were not, will not be
        if (tense === 'future') {
          return freqStr ? `will ${freqStr} not be` : 'will not be';
        }
        return freqStr ? `${beForm} ${freqStr} not` : `${beForm} not`;
      } else {
        return freqStr ? `${beForm} ${freqStr}` : beForm;
      }
    }

    if (isNegative) {
      // 否定: do/does/did + not + [freq] + base
      let doForm: string;
      switch (tense) {
        case 'past':
          doForm = 'did';
          tracker.recordSyntax(
            'do-support', 'insert', 'did + not + base',
            'Negation + past',
            { element: 'did not', after: ['did', 'not', verbEntry.forms.base] }
          );
          break;
        case 'present':
          doForm = isThirdPersonSingular ? 'does' : 'do';
          tracker.recordSyntax(
            'do-support', 'insert', `${doForm} + not + base`,
            'Negation + present',
            { element: `${doForm} not`, after: [doForm, 'not', verbEntry.forms.base] }
          );
          break;
        case 'future':
          // will not [freq] base
          tracker.recordMorphology(
            'negation', lemma, `will not ${verbEntry.forms.base}`,
            'will + not + base', 'Negation + future'
          );
          return freqStr
            ? `will not ${freqStr} ${verbEntry.forms.base}`
            : `will not ${verbEntry.forms.base}`;
      }
      return freqStr
        ? `${doForm} not ${freqStr} ${verbEntry.forms.base}`
        : `${doForm} not ${verbEntry.forms.base}`;
    } else {
      // 肯定: [freq] + verb (頻度副詞は動詞の前)
      switch (tense) {
        case 'past': {
          const pastForm = getIrregularForm('past') || verbEntry.forms.past;
          if (pastForm !== lemma) {
            tracker.recordMorphology(
              'tense', lemma, pastForm, '-ed', 'Tense: past'
            );
          }
          return freqStr ? `${freqStr} ${pastForm}` : pastForm;
        }
        case 'present': {
          const presentForm = getIrregularForm('present') ||
            (isThirdPersonSingular ? verbEntry.forms.s : verbEntry.forms.base);
          if (isThirdPersonSingular && presentForm !== verbEntry.forms.base) {
            tracker.recordMorphology(
              'agreement', verbEntry.forms.base, presentForm,
              '+s', `Subject ${getSubjectDescription(subject)} is 3sg`
            );
          }
          return freqStr ? `${freqStr} ${presentForm}` : presentForm;
        }
        case 'future':
          tracker.recordMorphology(
            'tense', lemma, `will ${verbEntry.forms.base}`,
            'will + base', 'Tense: future'
          );
          return freqStr
            ? `will ${freqStr} ${verbEntry.forms.base}`
            : `will ${verbEntry.forms.base}`;
      }
    }
  }

  // Progressive: aux + [not] + [freq] + verb-ing
  if (aspect === 'progressive') {
    const beForm = getBeAuxiliary(tense);
    tracker.recordMorphology(
      'aspect', lemma, `be ${verbEntry.forms.ing}`,
      'be + -ing', 'Aspect: progressive'
    );
    const notPart = isNegative ? 'not' : '';
    const parts = [beForm, notPart, freqStr, verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect: aux + [not] + [freq] + verb-pp
  if (aspect === 'perfect') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
    tracker.recordMorphology(
      'aspect', lemma, `have ${verbEntry.forms.pp}`,
      'have + past participle', 'Aspect: perfect'
    );
    const notPart = isNegative ? 'not' : '';
    const parts = [haveForm, notPart, freqStr, verbEntry.forms.pp].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect Progressive: aux + [not] + [freq] + been + verb-ing
  if (aspect === 'perfectProgressive') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
    tracker.recordMorphology(
      'aspect', lemma, `have been ${verbEntry.forms.ing}`,
      'have + been + -ing', 'Aspect: perfect progressive'
    );
    const notPart = isNegative ? 'not' : '';
    const parts = [haveForm, notPart, freqStr, 'been', verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  return lemma;
}

// モダル概念から英語の実現形式を取得（時制連動）
function getModalEnglishForm(
  modal: ModalType,
  tense: 'past' | 'present' | 'future'
): { auxiliary?: string; usePeriPhrastic?: 'was going to' | 'had to' } {
  // 現在/未来は同じ形式、過去のみ変化
  if (tense === 'past') {
    switch (modal) {
      case 'ability':    return { auxiliary: 'could' };
      case 'permission': return { auxiliary: 'could' };
      case 'possibility': return { auxiliary: 'might' };
      case 'obligation': return { usePeriPhrastic: 'had to' };  // 迂言形式
      case 'certainty':  return { auxiliary: 'must' };  // must have で過去推量
      case 'advice':     return { auxiliary: 'should' };
      case 'volition':   return { usePeriPhrastic: 'was going to' };  // 迂言形式
      case 'prediction': return { auxiliary: 'would' };
    }
  }
  // 現在/未来
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

// モダル変換のログ出力（共通ヘルパー）
// 平叙文・疑問文の両方から呼び出される
function logModalTransformation(
  modal: ModalType,
  tense: 'past' | 'present' | 'future',
  modalForm: { auxiliary?: string; usePeriPhrastic?: string }
): void {
  if (tense === 'past') {
    const presentForm = getModalEnglishForm(modal, 'present');
    const presentAux = presentForm.auxiliary || '';
    const pastAux = modalForm.auxiliary || modalForm.usePeriPhrastic || '';
    if (presentAux && pastAux && presentAux !== pastAux) {
      tracker.recordMorphology(
        'modal', presentAux, pastAux,
        'past form', `Modal: ${modal} + past tense`
      );
    }
  }
}

// モダリティ付きの動詞活用（時制連動）
// modal + (not) + (aspect markers) + verb
function conjugateWithModal(
  _lemma: string,  // 将来の拡張用（不規則動詞の処理など）
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  polarity: 'affirmative' | 'negative',
  frequencyAdverbs: AdverbNode[],
  modal: ModalType,
  verbEntry: { forms: { base: string; pp: string; ing: string } },
  modalPolarity?: 'affirmative' | 'negative'
): string {
  const isVerbNegative = polarity === 'negative';
  const isModalNegative = modalPolarity === 'negative';
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');

  // モダリティ否定（NOT modal）の特殊処理
  // 義務の否定 → don't have to / didn't have to
  if (isModalNegative && modal === 'obligation') {
    return conjugateNegatedObligation(tense, aspect, isVerbNegative, freqStr, verbEntry);
  }

  // 否定パート: モダリティ否定が優先、なければ動詞否定
  const notPart = isModalNegative ? 'not' : (isVerbNegative ? 'not' : '');

  const modalForm = getModalEnglishForm(modal, tense);

  // モダル変換をログ（共通ヘルパー使用）
  logModalTransformation(modal, tense, modalForm);

  // 迂言形式（was going to, had to）の場合
  if (modalForm.usePeriPhrastic) {
    const peri = modalForm.usePeriPhrastic;
    if (aspect === 'simple') {
      const parts = [peri, notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
      return parts.join(' ');
    }
    if (aspect === 'progressive') {
      const parts = [peri, notPart, freqStr, 'be', verbEntry.forms.ing].filter(p => p.length > 0);
      return parts.join(' ');
    }
    if (aspect === 'perfect') {
      const parts = [peri, notPart, freqStr, 'have', verbEntry.forms.pp].filter(p => p.length > 0);
      return parts.join(' ');
    }
    if (aspect === 'perfectProgressive') {
      const parts = [peri, notPart, freqStr, 'have', 'been', verbEntry.forms.ing].filter(p => p.length > 0);
      return parts.join(' ');
    }
  }

  const aux = modalForm.auxiliary || '';

  // Simple: modal (+ not) + (freq) + base
  if (aspect === 'simple') {
    const parts = [aux, notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Progressive: modal (+ not) + (freq) + be + ing
  if (aspect === 'progressive') {
    const parts = [aux, notPart, freqStr, 'be', verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect: modal (+ not) + (freq) + have + pp
  if (aspect === 'perfect') {
    const parts = [aux, notPart, freqStr, 'have', verbEntry.forms.pp].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect Progressive: modal (+ not) + (freq) + have been + ing
  if (aspect === 'perfectProgressive') {
    const parts = [aux, notPart, freqStr, 'have', 'been', verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  return aux ? `${aux} ${verbEntry.forms.base}` : verbEntry.forms.base;
}

// 助動詞を否定形にする（疑問文用）
function negateModalAuxiliary(aux: string): string {
  const negationMap: Record<string, string> = {
    'can': "can't",
    'could': "couldn't",
    'will': "won't",
    'would': "wouldn't",
    'shall': "shan't",
    'should': "shouldn't",
    'may': "may not",  // mayn't は古語
    'might': "might not",
    'must': "mustn't",
  };
  return negationMap[aux] || `${aux} not`;
}

// 疑問文用の動詞活用（助動詞と本動詞を分離）
function conjugateVerbForQuestion(
  lemma: string,
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  polarity: 'affirmative' | 'negative',
  frequencyAdverbs: AdverbNode[],
  subject?: NounPhraseNode | CoordinatedNounPhraseNode,
  modal?: ModalType,
  modalPolarity?: 'affirmative' | 'negative'
): { auxiliary: string; mainVerb: string } {
  const verbEntry = findVerb(lemma);
  if (!verbEntry) return { auxiliary: 'does', mainVerb: lemma };

  const isNegative = polarity === 'negative';
  const isThirdPersonSingular = subject ? isThirdSingular(subject) : true;
  const personNumber = subject ? getPersonNumber(subject) : { person: 3 as const, number: 'singular' as const };
  const freqStr = frequencyAdverbs.map(a => a.lemma).join(' ');

  // モダリティがある場合
  if (modal) {
    const modalForm = getModalEnglishForm(modal, tense);
    const isModalNegative = modalPolarity === 'negative';

    // モダル変換をログ（共通ヘルパー使用）
    logModalTransformation(modal, tense, modalForm);

    // 義務の否定（特殊処理）
    if (isModalNegative && modal === 'obligation') {
      const haveToAux = tense === 'past' ? "didn't have to" : "don't have to";
      const notPart = isNegative ? 'not' : '';
      if (aspect === 'simple') {
        const mainParts = [notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
        return { auxiliary: haveToAux, mainVerb: mainParts.join(' ') };
      }
    }

    // 迂言形式（was going to, had to）
    if (modalForm.usePeriPhrastic) {
      const peri = modalForm.usePeriPhrastic;
      // 倒置: Was he going to eat? / Did he have to eat?
      if (peri === 'was going to') {
        const notPart = isNegative ? 'not' : '';
        if (aspect === 'simple') {
          const mainParts = ['going to', notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
          return { auxiliary: 'was', mainVerb: mainParts.join(' ') };
        }
      } else if (peri === 'had to') {
        const notPart = isNegative ? 'not' : '';
        if (aspect === 'simple') {
          const mainParts = ['have to', notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
          return { auxiliary: 'did', mainVerb: mainParts.join(' ') };
        }
      }
    }

    // 通常のモダリティ
    const aux = modalForm.auxiliary || '';
    const notPart = isNegative ? 'not' : '';

    // モダリティ否定の場合は助動詞を否定形にする
    const negatedAux = isModalNegative ? negateModalAuxiliary(aux) : aux;

    if (aspect === 'simple') {
      const mainParts = [notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
      return { auxiliary: negatedAux, mainVerb: mainParts.join(' ') };
    }
    if (aspect === 'progressive') {
      const mainParts = [notPart, freqStr, 'be', verbEntry.forms.ing].filter(p => p.length > 0);
      return { auxiliary: negatedAux, mainVerb: mainParts.join(' ') };
    }
    if (aspect === 'perfect') {
      const mainParts = [notPart, freqStr, 'have', verbEntry.forms.pp].filter(p => p.length > 0);
      return { auxiliary: negatedAux, mainVerb: mainParts.join(' ') };
    }
    if (aspect === 'perfectProgressive') {
      const mainParts = [notPart, freqStr, 'have', 'been', verbEntry.forms.ing].filter(p => p.length > 0);
      return { auxiliary: negatedAux, mainVerb: mainParts.join(' ') };
    }
  }

  // be動詞の助動詞形を取得（進行形などで使用）
  const getBeAuxiliary = (t: 'past' | 'present' | 'future'): string => {
    if (t === 'future') return 'will';
    const beVerb = findVerb('be');
    if (beVerb?.forms.irregular) {
      const key = getIrregularFormKey(t, personNumber);
      const form = beVerb.forms.irregular[key];
      if (form) return form;
    }
    return t === 'past' ? 'was' : (isThirdPersonSingular ? 'is' : 'are');
  };

  // Simple aspect
  if (aspect === 'simple') {
    // be動詞の特別処理
    if (lemma === 'be') {
      const beAux = getBeAuxiliary(tense);
      if (tense === 'future') {
        const notPart = isNegative ? 'not' : '';
        const mainParts = [notPart, freqStr, 'be'].filter(p => p.length > 0);
        return { auxiliary: 'will', mainVerb: mainParts.join(' ') };
      }
      const notPart = isNegative ? 'not' : '';
      const mainParts = [notPart, freqStr].filter(p => p.length > 0);
      return { auxiliary: beAux, mainVerb: mainParts.join(' ') };
    }

    // Do-support
    let doForm: string;
    switch (tense) {
      case 'past':
        doForm = 'did';
        break;
      case 'present':
        doForm = isThirdPersonSingular ? 'does' : 'do';
        break;
      case 'future':
        const notPart = isNegative ? 'not' : '';
        const mainParts = [notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
        return { auxiliary: 'will', mainVerb: mainParts.join(' ') };
    }
    const notPart = isNegative ? 'not' : '';
    const mainParts = [notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
    return { auxiliary: doForm, mainVerb: mainParts.join(' ') };
  }

  // Progressive: Aux (is/are/was/were/will be) + [not] + [freq] + verb-ing
  if (aspect === 'progressive') {
    const beAux = getBeAuxiliary(tense);
    const notPart = isNegative ? 'not' : '';
    if (tense === 'future') {
      const mainParts = [notPart, freqStr, 'be', verbEntry.forms.ing].filter(p => p.length > 0);
      return { auxiliary: 'will', mainVerb: mainParts.join(' ') };
    }
    const mainParts = [notPart, freqStr, verbEntry.forms.ing].filter(p => p.length > 0);
    return { auxiliary: beAux, mainVerb: mainParts.join(' ') };
  }

  // Perfect: Aux (have/has/had/will have) + [not] + [freq] + verb-pp
  if (aspect === 'perfect') {
    let haveAux: string;
    if (tense === 'past') {
      haveAux = 'had';
    } else if (tense === 'future') {
      const notPart = isNegative ? 'not' : '';
      const mainParts = [notPart, freqStr, 'have', verbEntry.forms.pp].filter(p => p.length > 0);
      return { auxiliary: 'will', mainVerb: mainParts.join(' ') };
    } else {
      haveAux = isThirdPersonSingular ? 'has' : 'have';
    }
    const notPart = isNegative ? 'not' : '';
    const mainParts = [notPart, freqStr, verbEntry.forms.pp].filter(p => p.length > 0);
    return { auxiliary: haveAux, mainVerb: mainParts.join(' ') };
  }

  // Perfect Progressive: Aux (have/has/had/will have) + [not] + [freq] + been + verb-ing
  if (aspect === 'perfectProgressive') {
    let haveAux: string;
    if (tense === 'past') {
      haveAux = 'had';
    } else if (tense === 'future') {
      const notPart = isNegative ? 'not' : '';
      const mainParts = [notPart, freqStr, 'have', 'been', verbEntry.forms.ing].filter(p => p.length > 0);
      return { auxiliary: 'will', mainVerb: mainParts.join(' ') };
    } else {
      haveAux = isThirdPersonSingular ? 'has' : 'have';
    }
    const notPart = isNegative ? 'not' : '';
    const mainParts = [notPart, freqStr, 'been', verbEntry.forms.ing].filter(p => p.length > 0);
    return { auxiliary: haveAux, mainVerb: mainParts.join(' ') };
  }

  return { auxiliary: 'does', mainVerb: lemma };
}

// 義務の否定: don't have to / didn't have to（義務なし＝しなくてよい）
function conjugateNegatedObligation(
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  isVerbNegative: boolean,
  freqStr: string,
  verbEntry: { forms: { base: string; pp: string; ing: string } }
): string {
  // 動詞否定も同時にある場合は二重否定となるが、ここではモダリティ否定を優先
  const notPart = isVerbNegative ? 'not' : '';

  // 時制に応じた "don't have to" / "didn't have to"
  const haveToForm = tense === 'past' ? "didn't have to" : "don't have to";

  if (aspect === 'simple') {
    const parts = [haveToForm, notPart, freqStr, verbEntry.forms.base].filter(p => p.length > 0);
    return parts.join(' ');
  }
  if (aspect === 'progressive') {
    const parts = [haveToForm, notPart, freqStr, 'be', verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }
  if (aspect === 'perfect') {
    const parts = [haveToForm, notPart, freqStr, 'have', verbEntry.forms.pp].filter(p => p.length > 0);
    return parts.join(' ');
  }
  if (aspect === 'perfectProgressive') {
    const parts = [haveToForm, notPart, freqStr, 'have', 'been', verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  return `${haveToForm} ${verbEntry.forms.base}`;
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

// 主語の簡易説明を取得（ログ用）
function getSubjectDescription(subject?: NounPhraseNode | CoordinatedNounPhraseNode): string {
  if (!subject) return 'subject (default)';

  if (subject.type === 'coordinatedNounPhrase') {
    return `"${subject.conjuncts.length} items with ${subject.conjunction}"`;
  }

  const np = subject as NounPhraseNode;
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    return `"${pronounHead.lemma}"`;
  }
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    return `"${nounHead.lemma}"`;
  }
  return 'subject';
}

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

// 不規則動詞の活用形キーを取得
function getIrregularFormKey(
  tense: 'past' | 'present',
  personNumber: PersonNumber
): string {
  const { person, number } = personNumber;
  if (number === 'plural') {
    return `${tense}_pl`;
  }
  return `${tense}_${person}sg`;
}
