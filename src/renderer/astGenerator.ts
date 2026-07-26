import * as Blockly from 'blockly';
import {
  SentenceNode,
  ClauseNode,
  VerbPhraseNode,
  NounPhraseNode,
  FilledArgumentSlot,
  AdverbNode,
  PronounHead,
  PrepositionalPhraseNode,
  CoordinatedNounPhraseNode,
  CoordinationConjunct,
  Conjunction,
  ModalType,
  PropositionalOperator,
} from '../types/schema';
import { verbCores, pronounCores } from '../data/dictionary-core';
import { getExtVerbs } from '../data/dictionary-ext';
import { TIME_CHIP_DATA, DETERMINER_DATA } from '../blocks';

// ============================================
// ヘルパー関数（dictionary-core.ts ベース + 拡張辞書）
// ============================================
const findVerbCore = (lemma: string) => {
  // まずベース辞書を検索
  const baseVerb = verbCores.find(v => v.lemma === lemma);
  if (baseVerb) return baseVerb;
  // なければ拡張辞書を検索
  return getExtVerbs().find(v => v.lemma === lemma);
};
const findPronounCore = (lemma: string) => pronounCores.find(p => p.lemma === lemma);

// ============================================
// BlocklyワークスペースからAST生成
// ============================================

// モダリティ情報を保持するインターフェース
interface ModalInfo {
  modal?: ModalType;
  modalPolarity: 'affirmative' | 'negative';
}

// 複数のSENTENCEブロックから複数のASTを生成
export function generateMultipleAST(workspace: Blockly.Workspace): SentenceNode[] {
  const sentences: SentenceNode[] = [];
  const processedTimeFrames = new Set<string>();

  // question_wrapperブロックを処理
  const questionBlocks = workspace.getBlocksByType('question_wrapper', false);
  for (const questionBlock of questionBlocks) {
    const innerBlock = questionBlock.getInputTargetBlock('SENTENCE');
    if (!innerBlock) continue;

    // negation_sentence_wrapper > modal_wrapper > time_frame のチェーン
    const { timeFrameBlock, modalInfo } = findTimeFrameFromSentenceChain(innerBlock);
    if (timeFrameBlock) {
      const ast = parseTimeFrameBlock(timeFrameBlock, modalInfo.modal, 'interrogative', modalInfo.modalPolarity);
      if (ast) {
        sentences.push(ast);
        processedTimeFrames.add(timeFrameBlock.id);
      }
    }
  }

  // imperative_wrapperブロックを処理
  const imperativeBlocks = workspace.getBlocksByType('imperative_wrapper', false);
  for (const imperativeBlock of imperativeBlocks) {
    const innerBlock = imperativeBlock.getInputTargetBlock('SENTENCE');
    if (!innerBlock) continue;

    // negation_sentence_wrapper > modal_wrapper > time_frame のチェーン
    const { timeFrameBlock, modalInfo } = findTimeFrameFromSentenceChain(innerBlock);
    if (timeFrameBlock) {
      const ast = parseTimeFrameBlock(timeFrameBlock, modalInfo.modal, 'imperative', modalInfo.modalPolarity);
      if (ast) {
        sentences.push(ast);
        processedTimeFrames.add(timeFrameBlock.id);
      }
    }
  }

  // fact_wrapperブロックを処理（Logic Extension: 事実の宣言）
  const factBlocks = workspace.getBlocksByType('fact_wrapper', false);
  for (const factBlock of factBlocks) {
    const innerBlock = factBlock.getInputTargetBlock('PROPOSITION');
    if (!innerBlock) continue;

    // fact は modal を持たない（仕様: fact と modal は排他）
    // time_frame を探すか、直接 verb chain を処理
    const { timeFrameBlock } = findTimeFrameFromSentenceChain(innerBlock);
    if (timeFrameBlock) {
      const ast = parseTimeFrameBlock(timeFrameBlock, undefined, 'fact', 'affirmative');
      if (ast) {
        sentences.push(ast);
        processedTimeFrames.add(timeFrameBlock.id);
      }
    } else {
      // time_frame がない場合は直接 verb chain を処理（timeless fact）
      const verbChain = parseVerbChain(innerBlock);
      if (verbChain) {
        const verbPhrase = toVerbPhraseNode(verbChain, false);
        const clause: ClauseNode = {
          type: 'clause',
          verbPhrase,
          tense: 'present',  // timeless fact のデフォルト
          aspect: 'simple',
          polarity: verbChain.polarity,
        };
        sentences.push({
          type: 'sentence',
          clause,
          sentenceType: 'fact',
        });
      }
    }
  }

  // negation_sentence_wrapperブロックを処理（question/imperativeに接続されていないもの）
  const negationSentenceBlocks = workspace.getBlocksByType('negation_sentence_wrapper', false);
  for (const negationBlock of negationSentenceBlocks) {
    // 親がquestion_wrapperまたはimperative_wrapperの場合はスキップ（既に処理済み）
    const parentBlock = negationBlock.getParent();
    if (parentBlock && (parentBlock.type === 'imperative_wrapper' || parentBlock.type === 'question_wrapper')) {
      continue;
    }

    const modalBlock = negationBlock.getInputTargetBlock('MODAL');
    if (modalBlock && modalBlock.type === 'modal_wrapper') {
      const modalValue = modalBlock.getFieldValue('MODAL_VALUE') as ModalType;
      const timeFrameBlock = modalBlock.getInputTargetBlock('SENTENCE');
      if (timeFrameBlock && timeFrameBlock.type === 'time_frame') {
        const ast = parseTimeFrameBlock(timeFrameBlock, modalValue, 'declarative', 'negative');
        if (ast) {
          sentences.push(ast);
          processedTimeFrames.add(timeFrameBlock.id);
        }
      }
    }
  }

  // modal_wrapperブロックを処理（negation_sentence_wrapperに接続されていないもの）
  const modalBlocks = workspace.getBlocksByType('modal_wrapper', false);
  for (const modalBlock of modalBlocks) {
    // 親がnegation_sentence_wrapper、imperative_wrapper、question_wrapperの場合はスキップ
    const parentBlock = modalBlock.getParent();
    if (parentBlock && (
      parentBlock.type === 'negation_sentence_wrapper' ||
      parentBlock.type === 'imperative_wrapper' ||
      parentBlock.type === 'question_wrapper'
    )) {
      continue;
    }

    const modalValue = modalBlock.getFieldValue('MODAL_VALUE') as ModalType;
    const timeFrameBlock = modalBlock.getInputTargetBlock('SENTENCE');
    if (timeFrameBlock && timeFrameBlock.type === 'time_frame') {
      const ast = parseTimeFrameBlock(timeFrameBlock, modalValue, 'declarative', 'affirmative');
      if (ast) {
        sentences.push(ast);
        processedTimeFrames.add(timeFrameBlock.id);
      }
    }
  }

  // ラッパーに接続されていないtime_frameブロックを処理
  const timeFrameBlocks = workspace.getBlocksByType('time_frame', false);
  for (const block of timeFrameBlocks) {
    // 既に処理済みの場合はスキップ
    if (processedTimeFrames.has(block.id)) {
      continue;
    }
    // 親がwrapperの場合はスキップ（重複防止）
    const parentBlock = block.getParent();
    if (parentBlock && (
      parentBlock.type === 'modal_wrapper' ||
      parentBlock.type === 'imperative_wrapper' ||
      parentBlock.type === 'negation_sentence_wrapper' ||
      parentBlock.type === 'question_wrapper'
    )) {
      continue;
    }
    const ast = parseTimeFrameBlock(block, undefined, 'declarative', 'affirmative');
    if (ast) {
      sentences.push(ast);
    }
  }

  return sentences;
}

// SENTENCEチェーンからtime_frameとモダリティ情報を取得
// チェーン: negation_sentence_wrapper? > modal_wrapper? > time_frame
function findTimeFrameFromSentenceChain(block: Blockly.Block): { timeFrameBlock: Blockly.Block | null; modalInfo: ModalInfo } {
  let currentBlock: Blockly.Block | null = block;
  let modalPolarity: 'affirmative' | 'negative' = 'affirmative';
  let modal: ModalType | undefined = undefined;

  // negation_sentence_wrapper のチェック
  if (currentBlock.type === 'negation_sentence_wrapper') {
    modalPolarity = 'negative';
    currentBlock = currentBlock.getInputTargetBlock('MODAL');
  }

  // modal_wrapper のチェック
  if (currentBlock && currentBlock.type === 'modal_wrapper') {
    modal = currentBlock.getFieldValue('MODAL_VALUE') as ModalType;
    currentBlock = currentBlock.getInputTargetBlock('SENTENCE');
  }

  // time_frame のチェック
  if (currentBlock && currentBlock.type === 'time_frame') {
    return {
      timeFrameBlock: currentBlock,
      modalInfo: { modal, modalPolarity },
    };
  }

  return {
    timeFrameBlock: null,
    modalInfo: { modal, modalPolarity },
  };
}

// 動詞ラッパーチェーンの解析結果
interface VerbChainResult {
  verbPhrase: VerbPhraseNode;
  polarity: 'affirmative' | 'negative';
  frequencyAdverbs: AdverbNode[];
  mannerAdverbs: AdverbNode[];
  locativeAdverbs: AdverbNode[];
  timeAdverbs: AdverbNode[];
  prepositionalPhrases: PrepositionalPhraseNode[];
  coordination?: {
    conjunction: Conjunction;
    rightVerbPhrase: VerbPhraseNode;
  };
  // 命題レベルの論理演算（Logic Extension）
  logicOp?: {
    operator: PropositionalOperator;
    leftOperand?: VerbPhraseNode;   // ネストされた論理式の場合
    rightOperand?: VerbPhraseNode;
  };
}

/**
 * 等位接続チェーンの末尾に接続を追加する。
 *
 * `coordinatedWith` は連結リストなので、既存の接続を上書きせず末尾へ繋ぐ必要がある。
 * 上書きすると `or(and(A, B), C)` のような入れ子で内側の B が失われる。
 *
 *   or(and(A, B), C) → A ─and→ B ─or→ C
 *
 * AST は接続を1本の鎖でしか表現できないため、グループ化（優先順位）の情報は落ちるが、
 * 少なくとも項が消えることはなくなる。レンダラー側も英語 (`appendCoordinatedVP`) /
 * 日本語 (`collectVPChain`) ともに鎖を辿る実装になっている。
 */
function appendCoordination(
  vp: VerbPhraseNode,
  coordination: { conjunction: Conjunction; verbPhrase: VerbPhraseNode }
): VerbPhraseNode {
  if (!vp.coordinatedWith) {
    return { ...vp, coordinatedWith: coordination };
  }
  return {
    ...vp,
    coordinatedWith: {
      conjunction: vp.coordinatedWith.conjunction,
      verbPhrase: appendCoordination(vp.coordinatedWith.verbPhrase, coordination),
    },
  };
}

/**
 * VerbChainResult を VerbPhraseNode に畳み込む。
 *
 * ラッパーブロックが集めた副詞・前置詞句を動詞句へマージし、
 * 等位接続をチェーンの末尾へ繋ぐ。
 *
 * @param withPolarity VP 個別の polarity を設定するか。
 *   等位接続や論理演算のオペランドでは各 VP が個別に極性を持つため true。
 *   節のトップレベルでは極性は ClauseNode 側が持つため false。
 */
function toVerbPhraseNode(chain: VerbChainResult, withPolarity: boolean): VerbPhraseNode {
  const base: VerbPhraseNode = {
    ...chain.verbPhrase,
    adverbs: [
      ...chain.mannerAdverbs,
      ...chain.frequencyAdverbs,
      ...chain.locativeAdverbs,
      ...(chain.timeAdverbs || []),
      ...chain.verbPhrase.adverbs,
    ],
    prepositionalPhrases: [
      ...chain.prepositionalPhrases,
      ...chain.verbPhrase.prepositionalPhrases,
    ],
    logicOp: chain.logicOp,
  };

  if (withPolarity) {
    base.polarity = chain.polarity === 'negative' ? 'negative' : undefined;
  }

  // chain.verbPhrase 由来の内側の等位接続を保持したまま、外側の接続を末尾に足す
  return chain.coordination
    ? appendCoordination(base, {
        conjunction: chain.coordination.conjunction,
        verbPhrase: chain.coordination.rightVerbPhrase,
      })
    : base;
}

function parseTimeFrameBlock(
  block: Blockly.Block,
  modal?: ModalType,
  sentenceType: 'declarative' | 'imperative' | 'interrogative' | 'fact' = 'declarative',
  modalPolarity: 'affirmative' | 'negative' = 'affirmative'
): SentenceNode | null {
  // TimeChipを取得してTense/Aspect/出力単語を決定
  const timeChipBlock = block.getInputTargetBlock('TIME_CHIP');
  const { tense, aspect, timeAdverbial } = parseTimeChip(timeChipBlock);

  // 動詞句を取得（ラッパー含む）
  const actionBlock = block.getInputTargetBlock('ACTION');
  if (!actionBlock) {
    return null;
  }

  const verbChain = parseVerbChain(actionBlock);
  if (!verbChain) {
    return null;
  }

  // ラッパーから収集した副詞・前置詞句を畳み込み、等位接続と論理演算を反映する
  // （極性は下の ClauseNode 側が持つため、ここでは設定しない）
  const verbPhrase = toVerbPhraseNode(verbChain, false);

  const clause: ClauseNode = {
    type: 'clause',
    verbPhrase,
    tense,
    aspect,
    polarity: verbChain.polarity,
    modal,  // モダリティを追加
    modalPolarity: modal ? modalPolarity : undefined,  // モダリティ否定を追加（modalがある場合のみ）
  };

  // Wh疑問詞が含まれている場合は自動的に疑問文として扱う
  const detectedSentenceType = detectInterrogativeFromWh(verbPhrase, sentenceType);

  return {
    type: 'sentence',
    clause,
    sentenceType: detectedSentenceType,
    timeAdverbial,
  };
}

// Wh疑問詞・疑問副詞を検出して自動的に疑問文に変換
function detectInterrogativeFromWh(
  verbPhrase: VerbPhraseNode,
  currentType: 'declarative' | 'imperative' | 'interrogative' | 'fact'
): 'declarative' | 'imperative' | 'interrogative' | 'fact' {
  // 既に疑問文の場合はそのまま
  if (currentType === 'interrogative') {
    return 'interrogative';
  }

  // 命令文は変換しない（意味的に矛盾）
  if (currentType === 'imperative') {
    return 'imperative';
  }

  // fact は変換しない（事実宣言は疑問にならない）
  if (currentType === 'fact') {
    return 'fact';
  }

  // Wh疑問副詞をチェック（?where, ?when, ?how）
  for (const adverb of verbPhrase.adverbs) {
    if (adverb.lemma.startsWith('?')) {
      return 'interrogative';
    }
  }

  // Wh疑問代名詞をチェック（?who, ?what）
  for (const arg of verbPhrase.arguments) {
    if (arg.filler && hasInterrogativePronoun(arg.filler)) {
      return 'interrogative';
    }
  }

  return currentType;
}

// フィラーにWh疑問代名詞が含まれているかチェック
function hasInterrogativePronoun(filler: FilledArgumentSlot['filler']): boolean {
  if (!filler) return false;

  if (filler.type === 'nounPhrase') {
    const np = filler as NounPhraseNode;
    if (np.head.type === 'pronoun') {
      const head = np.head as PronounHead;
      return head.pronounType === 'interrogative';
    }
  } else if (filler.type === 'coordinatedNounPhrase') {
    const coordNP = filler as CoordinatedNounPhraseNode;
    // 選択疑問も疑問文
    if (coordNP.isChoiceQuestion) {
      return true;
    }
    // 内部の要素をチェック
    for (const conjunct of coordNP.conjuncts) {
      if (hasInterrogativePronoun(conjunct)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================
// 動詞ラッパーチェーンの解析
//
// ブロックは「ラッパーが動詞を包む」入れ子構造になっている。
//   negation_wrapper( frequency_wrapper( verb_action ) )
// parseVerbChain はこれを内側へ辿りながら VerbChainResult を組み立てる。
//
// 分岐はブロック種別ごとのテーブルで引く。同じ形をした分岐（副詞ラッパー5種、
// 二項の命題論理4種、等位接続2種）は仕様データにまとめてある。
// ============================================

/**
 * VerbChainResult を VerbPhraseNode に変換する。
 * 等位接続や論理演算のオペランドで使用。各 VP が個別に極性を持つため withPolarity = true。
 */
const toVerbPhraseWithLogic = (result: VerbChainResult): VerbPhraseNode =>
  toVerbPhraseNode(result, true);

/** 副詞・前置詞句を何も持たない VerbChainResult */
function emptyChain(verbPhrase: VerbPhraseNode): VerbChainResult {
  return {
    verbPhrase,
    polarity: 'affirmative',
    frequencyAdverbs: [],
    mannerAdverbs: [],
    locativeAdverbs: [],
    timeAdverbs: [],
    prepositionalPhrases: [],
  };
}

/** 指定した入力に繋がっているブロックを再帰的に解析する */
function parseInnerChain(block: Blockly.Block, inputName: string): VerbChainResult | null {
  const inner = block.getInputTargetBlock(inputName);
  return inner ? parseVerbChain(inner) : null;
}

// --- 副詞ラッパー -----------------------------------------------------------

type AdverbTarget = 'mannerAdverbs' | 'frequencyAdverbs' | 'locativeAdverbs' | 'timeAdverbs';

interface AdverbWrapperSpec {
  /** 副詞の値が入っているフィールド名 */
  field: string;
  /** フィールド値から副詞の種類と格納先を決める（Wh副詞は値によって変わる） */
  resolve: (value: string) => { advType: AdverbNode['advType']; target: AdverbTarget };
  /** ドロップダウンのラベル行（`__` 始まり）を選んだとき、副詞を足さず素通しするか */
  skipLabelRows: boolean;
}

/** ?where / ?when / ?how を対応する副詞の種類に振り分ける */
function resolveWhAdverb(value: string): { advType: AdverbNode['advType']; target: AdverbTarget } {
  switch (value) {
    case '?where':
      return { advType: 'place', target: 'locativeAdverbs' };
    case '?when':
      return { advType: 'time', target: 'timeAdverbs' };
    default:
      // ?how およびそれ以外は様態として扱う
      return { advType: 'manner', target: 'mannerAdverbs' };
  }
}

const ADVERB_WRAPPERS: Record<string, AdverbWrapperSpec> = {
  frequency_wrapper: {
    field: 'FREQ_VALUE',
    resolve: () => ({ advType: 'frequency', target: 'frequencyAdverbs' }),
    skipLabelRows: false,
  },
  manner_wrapper: {
    field: 'MANNER_VALUE',
    resolve: () => ({ advType: 'manner', target: 'mannerAdverbs' }),
    skipLabelRows: true,
  },
  locative_wrapper: {
    field: 'LOCATIVE_VALUE',
    resolve: () => ({ advType: 'place', target: 'locativeAdverbs' }),
    skipLabelRows: true,
  },
  time_adverb_wrapper: {
    field: 'TIME_ADVERB_VALUE',
    resolve: () => ({ advType: 'time', target: 'timeAdverbs' }),
    skipLabelRows: true,
  },
  wh_adverb_block: {
    field: 'WH_ADVERB_VALUE',
    resolve: resolveWhAdverb,
    skipLabelRows: false,
  },
};

/** 収集済みの副詞リストの先頭に1つ足した VerbChainResult を返す */
function withAdverb(
  result: VerbChainResult,
  target: AdverbTarget,
  adverb: AdverbNode
): VerbChainResult {
  const existing = result[target] ?? [];
  switch (target) {
    case 'mannerAdverbs':
      return { ...result, mannerAdverbs: [adverb, ...existing] };
    case 'frequencyAdverbs':
      return { ...result, frequencyAdverbs: [adverb, ...existing] };
    case 'locativeAdverbs':
      return { ...result, locativeAdverbs: [adverb, ...existing] };
    case 'timeAdverbs':
      return { ...result, timeAdverbs: [adverb, ...existing] };
  }
}

function parseAdverbWrapper(
  block: Blockly.Block,
  spec: AdverbWrapperSpec
): VerbChainResult | null {
  const value = block.getFieldValue(spec.field) as string;

  // ラベル行が選ばれている場合は副詞として扱わず、内側をそのまま返す
  if (spec.skipLabelRows && value?.startsWith('__')) {
    return parseInnerChain(block, 'VERB');
  }

  const inner = parseInnerChain(block, 'VERB');
  if (!inner) {
    return null;
  }

  const { advType, target } = spec.resolve(value);
  return withAdverb(inner, target, { type: 'adverb', lemma: value, advType });
}

// --- 前置詞ラッパー ---------------------------------------------------------

function parsePrepositionWrapper(block: Blockly.Block): VerbChainResult | null {
  const inner = parseInnerChain(block, 'VERB');
  if (!inner) {
    return null;
  }

  const prepValue = block.getFieldValue('PREP_VALUE');
  const objectBlock = block.getInputTargetBlock('OBJECT');

  // 欠損時は ___ マーカーを使用（Grammar Console対応時に警告表示予定）
  const objectNP = objectBlock
    ? parseNounPhraseBlock(objectBlock)
    : {
        type: 'nounPhrase' as const,
        adjectives: [],
        head: { type: 'noun' as const, lemma: '___', number: 'singular' as const },
      };

  return {
    ...inner,
    prepositionalPhrases: [
      ...inner.prepositionalPhrases,
      { type: 'prepositionalPhrase', preposition: prepValue, object: objectNP },
    ],
  };
}

// --- 命題論理（Logic Extension） --------------------------------------------
// 等位接続 and/or とは異なり、大文字 AND/OR/NOT/IF/BECAUSE で出力する

interface BinaryLogicSpec {
  operator: PropositionalOperator;
  leftInput: string;
  rightInput: string;
}

const BINARY_LOGIC: Record<string, BinaryLogicSpec> = {
  logic_and_block: { operator: 'AND', leftInput: 'LEFT', rightInput: 'RIGHT' },
  logic_or_block: { operator: 'OR', leftInput: 'LEFT', rightInput: 'RIGHT' },
  logic_if_block: { operator: 'IF', leftInput: 'CONDITION', rightInput: 'CONSEQUENCE' },
  logic_because_block: { operator: 'BECAUSE', leftInput: 'CAUSE', rightInput: 'EFFECT' },
};

function parseBinaryLogic(block: Blockly.Block, spec: BinaryLogicSpec): VerbChainResult | null {
  const left = parseInnerChain(block, spec.leftInput);
  if (!left) {
    return null;
  }

  const right = parseInnerChain(block, spec.rightInput);
  const rightOperand = right ? toVerbPhraseWithLogic(right) : undefined;

  // 左側が複合式（logicOp を持つ）なら leftOperand として保持する。
  // 単純な命題ならスプレッドで引き継がれるため leftOperand は置かない。
  const logicOp = left.logicOp
    ? { operator: spec.operator, leftOperand: toVerbPhraseWithLogic(left), rightOperand }
    : { operator: spec.operator, rightOperand };

  return { ...left, logicOp };
}

function parseNotLogic(block: Blockly.Block): VerbChainResult | null {
  const inner = parseInnerChain(block, 'PROPOSITION');
  if (!inner) {
    return null;
  }

  if (!inner.logicOp) {
    return { ...inner, logicOp: { operator: 'NOT' } };
  }

  // 内側が複合式の場合は完全な VerbPhraseNode として leftOperand に格納する。
  //
  // ⚠ ここは二項演算子（parseBinaryLogic）と違い toVerbPhraseWithLogic を使っていない。
  //    polarity を載せず、内側の等位接続も末尾に繋がない点が異なる。
  //    統一すべきに見えるが振る舞いが変わるため、Phase 2（機械的な分割）では現状を保つ。
  //    TODO.md「NOT のオペランド構築が二項演算子と揃っていない」を参照。
  const innerVP: VerbPhraseNode = {
    ...inner.verbPhrase,
    adverbs: [
      ...inner.mannerAdverbs,
      ...inner.frequencyAdverbs,
      ...inner.locativeAdverbs,
      ...(inner.timeAdverbs || []),
      ...inner.verbPhrase.adverbs,
    ],
    prepositionalPhrases: [
      ...inner.prepositionalPhrases,
      ...inner.verbPhrase.prepositionalPhrases,
    ],
    logicOp: inner.logicOp,
  };

  return { ...inner, logicOp: { operator: 'NOT', leftOperand: innerVP } };
}

// --- 等位接続（動詞） -------------------------------------------------------

const VERB_COORDINATION: Record<string, Conjunction> = {
  coordination_verb_and: 'and',
  coordination_verb_or: 'or',
};

function parseVerbCoordination(
  block: Blockly.Block,
  conjunction: Conjunction
): VerbChainResult | null {
  const left = parseInnerChain(block, 'LEFT');
  if (!left) {
    return null;
  }

  const right = parseInnerChain(block, 'RIGHT');

  // 欠損時は ___ マーカーの動詞句を置く
  const defaultVP: VerbPhraseNode = {
    type: 'verbPhrase',
    verb: { lemma: '___' },
    arguments: [],
    adverbs: [],
    prepositionalPhrases: [],
  };

  // 左側は内側の等位接続を含む完全な VerbPhraseNode に変換する。
  // 副詞・前置詞句も leftVP へ畳み込まれるので、返す Result 側は空にする。
  // polarity は各 VP が個別に持つためここでは hoist しない。
  return {
    verbPhrase: toVerbPhraseWithLogic(left),
    polarity: 'affirmative',
    frequencyAdverbs: [],
    mannerAdverbs: [],
    locativeAdverbs: [],
    timeAdverbs: [],
    prepositionalPhrases: [],
    coordination: {
      conjunction,
      rightVerbPhrase: right ? toVerbPhraseWithLogic(right) : defaultVP,
    },
  };
}

// --- ディスパッチャ ---------------------------------------------------------

function parseVerbChain(block: Blockly.Block): VerbChainResult | null {
  const blockType = block.type;

  if (blockType === 'negation_wrapper') {
    const inner = parseInnerChain(block, 'VERB');
    return inner ? { ...inner, polarity: 'negative' } : null;
  }

  const adverbSpec = ADVERB_WRAPPERS[blockType];
  if (adverbSpec) {
    return parseAdverbWrapper(block, adverbSpec);
  }

  if (blockType === 'preposition_verb') {
    return parsePrepositionWrapper(block);
  }

  const logicSpec = BINARY_LOGIC[blockType];
  if (logicSpec) {
    return parseBinaryLogic(block, logicSpec);
  }

  if (blockType === 'logic_not_block') {
    return parseNotLogic(block);
  }

  const conjunction = VERB_COORDINATION[blockType];
  if (conjunction) {
    return parseVerbCoordination(block, conjunction);
  }

  // 実際の動詞ブロック（verb, verb_motion, verb_action, etc.）
  if (blockType === 'verb' || blockType.startsWith('verb_')) {
    const verbPhrase = parseVerbBlock(block);
    return verbPhrase ? emptyChain(verbPhrase) : null;
  }

  return null;
}

// TimeChipの値から出力テキストへのマッピング
const TIME_CHIP_OUTPUT: Record<string, string | null> = {
  // Concrete - 時点指定（出力あり）
  '__placeholder__': null,
  'yesterday': 'yesterday',
  'today': 'today',
  'tomorrow': 'tomorrow',
  'every_day': 'every day',
  'last_sunday': 'last Sunday',
  'right_now': 'right now',
  'at_the_moment': 'at the moment',
  'next_week': 'next week',
  // Aspectual - 状態指定（出力あり）
  'now': 'now',
  'just_now': 'just now',
  'completion': 'already',  // already/yet はここではalready、否定/疑問で切り替え
  'still': 'still',
  'recently': 'recently',
  // Abstract - 抽象指定（出力なし）
  'past': null,
  'future': null,
  'current': null,
  'progressive': null,
  'perfect': null,
  'perfectProgressive': null,
};

function parseTimeChip(block: Blockly.Block | null): {
  tense: 'past' | 'present' | 'future';
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';
  timeAdverbial?: string;
} {
  // デフォルト値
  const defaults = { tense: 'present' as const, aspect: 'simple' as const, timeAdverbial: undefined };

  if (!block) {
    return defaults;
  }

  const blockType = block.type;

  // 統合ブロック（2つのプルダウン）の処理
  if (blockType === 'time_chip_unified') {
    const tenseValue = block.getFieldValue('TENSE_VALUE') as 'past' | 'present' | 'future';
    const aspectValue = block.getFieldValue('ASPECT_VALUE') as 'simple' | 'progressive' | 'perfect' | 'perfectProgressive';
    return {
      tense: tenseValue || 'present',
      aspect: aspectValue || 'simple',
      timeAdverbial: undefined,
    };
  }

  let value: string | null = null;
  let options: typeof TIME_CHIP_DATA.concrete | null = null;

  if (blockType === 'time_chip_concrete') {
    value = block.getFieldValue('TIME_VALUE');
    options = TIME_CHIP_DATA.concrete;
  } else if (blockType === 'time_chip_aspectual') {
    value = block.getFieldValue('ASPECT_VALUE');
    options = TIME_CHIP_DATA.aspectual;
  } else if (blockType === 'time_chip_abstract') {
    value = block.getFieldValue('MODIFIER_VALUE');
    options = TIME_CHIP_DATA.abstract;
  }

  if (!value || !options || value === '__placeholder__') {
    return defaults;
  }

  const option = options.find(o => o.value === value);
  if (!option) {
    return defaults;
  }

  const timeAdverbial = TIME_CHIP_OUTPUT[value] ?? undefined;

  return {
    tense: option.tense === 'inherit' ? 'present' : option.tense,
    aspect: option.aspect === 'inherit' ? 'simple' : option.aspect,
    timeAdverbial,
  };
}

function parseVerbBlock(block: Blockly.Block): VerbPhraseNode | null {
  const verbLemma = block.getFieldValue('VERB');
  const verbEntry = findVerbCore(verbLemma);

  if (!verbEntry) {
    return null;
  }

  // 引数スロットを解析
  const args: FilledArgumentSlot[] = [];
  verbEntry.valency.forEach((slot, index) => {
    const inputName = `ARG_${index}`;
    const argBlock = block.getInputTargetBlock(inputName);

    args.push({
      role: slot.role,
      filler: argBlock ? parseNounPhraseBlock(argBlock) : null,
    });
  });

  // 副詞・前置詞句は Verb Modifiers で処理されるため、ここでは空配列
  return {
    type: 'verbPhrase',
    verb: { lemma: verbLemma },
    arguments: args,
    adverbs: [],
    prepositionalPhrases: [],
  };
}

function parseNounPhraseBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const blockType = block.type;

  // 等位接続ブロック（名詞用）の処理
  if (blockType === 'coordination_noun_and' || blockType === 'coordination_noun_or') {
    const conjValue: Conjunction = blockType === 'coordination_noun_and' ? 'and' : 'or';
    return parseCoordinationNounBlock(block, conjValue);
  }

  // 選択疑問ブロックの処理
  if (blockType === 'choice_question_block') {
    return parseCoordinationNounBlock(block, 'or', true);
  }

  // 前置詞ラッパー（名詞用）の処理
  if (blockType === 'preposition_noun') {
    return parsePrepositionNounBlock(block);
  }

  // 統合限定詞ブロックの処理
  if (blockType === 'determiner_unified') {
    return parseDeterminerUnifiedBlock(block);
  }

  // 形容詞ラッパーブロックの処理（カテゴリ別: adjective_size, adjective_age, etc.）
  if (blockType.startsWith('adjective_')) {
    return parseAdjectiveWrapperBlock(block);
  }

  // Wh疑問詞プレースホルダーブロックの処理
  if (blockType === 'wh_placeholder_block') {
    const whValue = block.getFieldValue('WH_VALUE') as string;
    const pronoun = findPronounCore(whValue);
    if (pronoun) {
      return {
        type: 'nounPhrase',
        adjectives: [],
        head: {
          type: 'pronoun',
          lemma: pronoun.lemma,
          person: pronoun.person,
          number: pronoun.number,
          pronounType: pronoun.type,
        } as PronounHead,
      };
    }
  }

  // 名詞ブロックの処理（カテゴリ別 + 拡張名詞ブロック）
  const nounBlockTypes = [
    'pronoun_block', 'possessive_pronoun_block', 'human_block', 'animal_block', 'object_block', 'place_block', 'abstract_block',
    // 拡張名詞ブロック（NounCategory: human, animal, object, place, abstract）
    'noun_human_ext', 'noun_animal_ext', 'noun_object_ext', 'noun_place_ext', 'noun_abstract_ext',
  ];
  if (nounBlockTypes.includes(blockType)) {
    return parseNewNounBlock(block, blockType);
  }

  // 不明なブロックタイプの場合はデフォルト値を返す
  return {
    type: 'nounPhrase',
    adjectives: [],
    head: {
      type: 'noun',
      lemma: 'thing',
      number: 'singular',
    },
  };
}

function parseDeterminerUnifiedBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const preValue = block.getFieldValue('PRE');
  const centralValue = block.getFieldValue('CENTRAL');
  const postValue = block.getFieldValue('POST');
  const nounBlock = block.getInputTargetBlock('NOUN');

  // 内部の名詞ブロックを解析
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'thing', number: 'singular' as const },
  };

  // 等位接続の場合はそのまま返す（限定詞は適用しない）
  if (innerResult.type === 'coordinatedNounPhrase') {
    return innerResult;
  }

  const innerNP = innerResult as NounPhraseNode;

  // 値を正規化（__none__ → undefined, __plural__ → plural, __uncountable__ → uncountable）
  const normalizeDet = (val: string | null): string | undefined => {
    if (!val || val === '__none__') return undefined;
    if (val === '__plural__') return 'plural';
    if (val === '__uncountable__') return 'uncountable';
    return val;
  };

  const pre = normalizeDet(preValue);
  const central = normalizeDet(centralValue);
  const post = normalizeDet(postValue);

  // 文法数を決定（動詞活用用）
  // DETERMINER_DATA を参照して number プロパティを取得
  const postOption = DETERMINER_DATA.post.find(o => o.value === postValue);
  const centralOption = DETERMINER_DATA.central.find(o => o.value === centralValue);
  const preOption = DETERMINER_DATA.pre.find(o => o.value === preValue);

  let grammaticalNumber: 'singular' | 'plural' | 'uncountable' = 'singular';
  if (postOption?.number === 'plural') {
    grammaticalNumber = 'plural';
  } else if (postOption?.number === 'uncountable') {
    grammaticalNumber = 'uncountable';
  } else if (postOption?.number === 'singular') {
    grammaticalNumber = 'singular';
  } else if (centralOption?.number === 'plural') {
    grammaticalNumber = 'plural';
  } else if (centralOption?.number === 'singular') {
    grammaticalNumber = 'singular';
  } else if (preOption?.number === 'plural') {
    grammaticalNumber = 'plural';
  }

  // 名詞の数を更新
  const updatedHead = innerNP.head.type === 'noun'
    ? { ...innerNP.head, number: grammaticalNumber }
    : innerNP.head;

  return {
    ...innerNP,
    head: updatedHead,
    preDeterminer: pre,
    determiner: central,
    postDeterminer: post,
  };
}

function parseAdjectiveWrapperBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const adjValue = block.getFieldValue('ADJ_VALUE');
  const nounBlock = block.getInputTargetBlock('NOUN');

  // 内部の名詞ブロックを解析
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'thing', number: 'singular' as const },
  };

  // 等位接続の場合はそのまま返す（形容詞は適用しない）
  if (innerResult.type === 'coordinatedNounPhrase') {
    return innerResult;
  }

  const innerNP = innerResult as NounPhraseNode;

  // 形容詞を先頭に追加（外側の形容詞が先）
  return {
    ...innerNP,
    adjectives: [{ lemma: adjValue }, ...innerNP.adjectives],
  };
}

function parsePrepositionNounBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const prepValue = block.getFieldValue('PREP_VALUE');
  const nounBlock = block.getInputTargetBlock('NOUN');
  const objectBlock = block.getInputTargetBlock('OBJECT');

  // 内部の名詞ブロックを解析（欠損時は ___ マーカー）
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: '___', number: 'singular' as const },
  };

  // 前置詞の目的語を解析（欠損時は ___ マーカー）
  const objectResult = objectBlock ? parseNounPhraseBlock(objectBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: '___', number: 'singular' as const },
  };

  // 等位接続の場合はそのまま返す（前置詞句修飾は適用しない）
  if (innerResult.type === 'coordinatedNounPhrase') {
    return innerResult;
  }

  const innerNP = innerResult as NounPhraseNode;

  // 前置詞句修飾を追加
  return {
    ...innerNP,
    prepModifier: {
      type: 'prepositionalPhrase',
      preposition: prepValue,
      object: objectResult,
    },
  };
}

function parseCoordinationNounBlock(block: Blockly.Block, conjValue: Conjunction, isChoiceQuestion: boolean = false): CoordinatedNounPhraseNode {
  const leftBlock = block.getInputTargetBlock('LEFT');
  const rightBlock = block.getInputTargetBlock('RIGHT');

  // デフォルトの名詞句（欠損時は ___ マーカー）
  const defaultNP: NounPhraseNode = {
    type: 'nounPhrase',
    adjectives: [],
    head: { type: 'noun', lemma: '___', number: 'singular' },
  };

  // 左右の名詞句を解析（再帰的にCoordinatedも可能）
  const leftNP = leftBlock ? parseNounPhraseBlock(leftBlock) : defaultNP;
  const rightNP = rightBlock ? parseNounPhraseBlock(rightBlock) : defaultNP;

  // Coordinated名詞句を処理
  // - 同じ接続詞の場合: フラット化 (A and (B and C) → A and B and C)
  // - 異なる接続詞の場合: 入れ子を保持 (A and (B or C) → そのまま)
  const conjuncts: CoordinationConjunct[] = [];

  // 左側の処理
  if (leftNP.type === 'coordinatedNounPhrase') {
    if (leftNP.conjunction === conjValue) {
      // 同じ接続詞: フラット化
      conjuncts.push(...leftNP.conjuncts);
    } else {
      // 異なる接続詞: 入れ子として保持
      conjuncts.push(leftNP);
    }
  } else {
    conjuncts.push(leftNP);
  }

  // 右側の処理
  if (rightNP.type === 'coordinatedNounPhrase') {
    if (rightNP.conjunction === conjValue) {
      // 同じ接続詞: フラット化
      conjuncts.push(...rightNP.conjuncts);
    } else {
      // 異なる接続詞: 入れ子として保持
      conjuncts.push(rightNP);
    }
  } else {
    conjuncts.push(rightNP);
  }

  const result: CoordinatedNounPhraseNode = {
    type: 'coordinatedNounPhrase',
    conjunction: conjValue,
    conjuncts,
  };

  // 選択疑問の場合はフラグを設定
  if (isChoiceQuestion) {
    result.isChoiceQuestion = true;
  }

  return result;
}

function parseNewNounBlock(block: Blockly.Block, blockType: string): NounPhraseNode {
  // ブロックタイプに応じたフィールド名のマッピング
  const fieldMap: Record<string, string> = {
    'pronoun_block': 'PRONOUN_VALUE',
    'possessive_pronoun_block': 'POSSESSIVE_VALUE',
    'human_block': 'HUMAN_VALUE',
    'animal_block': 'ANIMAL_VALUE',
    'object_block': 'OBJECT_VALUE',
    'place_block': 'PLACE_VALUE',
    'abstract_block': 'ABSTRACT_VALUE',
    // 拡張名詞ブロック（LEMMAフィールドを使用、NounCategory: human, animal, object, place, abstract）
    'noun_human_ext': 'LEMMA',
    'noun_animal_ext': 'LEMMA',
    'noun_object_ext': 'LEMMA',
    'noun_place_ext': 'LEMMA',
    'noun_abstract_ext': 'LEMMA',
  };

  const fieldName = fieldMap[blockType] || 'PLACE_VALUE';
  const value: string = block.getFieldValue(fieldName);

  // プレースホルダーやラベルの場合はデフォルト値を返す
  if (!value || value.startsWith('__')) {
    return {
      type: 'nounPhrase',
      adjectives: [],
      head: {
        type: 'noun',
        lemma: 'something',
        number: 'singular',
      },
    };
  }

  // 代名詞かどうかをチェック
  const pronoun = findPronounCore(value);
  if (pronoun) {
    const head: PronounHead = {
      type: 'pronoun',
      lemma: pronoun.lemma,
      person: pronoun.person,
      number: pronoun.number,
      pronounType: pronoun.type,
      polaritySensitive: pronoun.polaritySensitive,
    };

    return {
      type: 'nounPhrase',
      adjectives: [],
      head,
    };
  }

  // 場所副詞（here, there）の特殊処理
  if (value === 'here' || value === 'there') {
    return {
      type: 'nounPhrase',
      adjectives: [],
      head: {
        type: 'noun',
        lemma: value,
        number: 'singular',
      },
    };
  }

  // 通常の名詞（デフォルトは単数、限定詞ラッパーで上書き可能）
  return {
    type: 'nounPhrase',
    adjectives: [],
    head: {
      type: 'noun',
      lemma: value,
      number: 'singular',
    },
  };
}
