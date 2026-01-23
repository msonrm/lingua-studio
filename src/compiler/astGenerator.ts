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
} from '../types/schema';
import { findVerb, findPronoun } from '../data/dictionary';
import { TIME_CHIP_DATA, QUANTIFIER_DATA, DETERMINER_DATA } from '../blocks/definitions';

// ============================================
// BlocklyワークスペースからAST生成
// ============================================
export function generateAST(workspace: Blockly.Workspace): SentenceNode | null {
  const sentences = generateMultipleAST(workspace);
  return sentences.length > 0 ? sentences[0] : null;
}

// 複数のSENTENCEブロックから複数のASTを生成
export function generateMultipleAST(workspace: Blockly.Workspace): SentenceNode[] {
  const timeFrameBlocks = workspace.getBlocksByType('time_frame', false);

  if (timeFrameBlocks.length === 0) {
    return [];
  }

  const sentences: SentenceNode[] = [];
  for (const block of timeFrameBlocks) {
    const ast = parseTimeFrameBlock(block);
    if (ast) {
      sentences.push(ast);
    }
  }

  return sentences;
}

// 動詞ラッパーチェーンの解析結果
interface VerbChainResult {
  verbPhrase: VerbPhraseNode;
  polarity: 'affirmative' | 'negative';
  frequencyAdverbs: AdverbNode[];
  mannerAdverbs: AdverbNode[];
  prepositionalPhrases: PrepositionalPhraseNode[];
  coordination?: {
    conjunction: Conjunction;
    rightVerbPhrase: VerbPhraseNode;
  };
}

function parseTimeFrameBlock(block: Blockly.Block): SentenceNode | null {
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

  // ラッパーから収集した副詞と前置詞句を動詞句に追加
  const verbPhrase: VerbPhraseNode = {
    ...verbChain.verbPhrase,
    adverbs: [
      ...verbChain.mannerAdverbs,
      ...verbChain.frequencyAdverbs,
      ...verbChain.verbPhrase.adverbs,
    ],
    prepositionalPhrases: [
      ...verbChain.prepositionalPhrases,
      ...verbChain.verbPhrase.prepositionalPhrases,
    ],
    // 等位接続の情報を追加
    coordinatedWith: verbChain.coordination ? {
      conjunction: verbChain.coordination.conjunction,
      verbPhrase: verbChain.coordination.rightVerbPhrase,
    } : undefined,
  };

  const clause: ClauseNode = {
    type: 'clause',
    verbPhrase,
    tense,
    aspect,
    polarity: verbChain.polarity,
  };

  return {
    type: 'sentence',
    clause,
    sentenceType: 'declarative',
    timeAdverbial,
  };
}

// 動詞ラッパーチェーンを解析
function parseVerbChain(block: Blockly.Block): VerbChainResult | null {
  const blockType = block.type;

  // 否定ラッパーの処理
  if (blockType === 'negation_wrapper') {
    const innerBlock = block.getInputTargetBlock('VERB');
    if (!innerBlock) {
      return null;
    }
    const innerResult = parseVerbChain(innerBlock);
    if (!innerResult) {
      return null;
    }
    return {
      ...innerResult,
      polarity: 'negative',
    };
  }

  // 頻度副詞ラッパーの処理
  if (blockType === 'frequency_wrapper') {
    const freqValue = block.getFieldValue('FREQ_VALUE');
    const innerBlock = block.getInputTargetBlock('VERB');
    if (!innerBlock) {
      return null;
    }
    const innerResult = parseVerbChain(innerBlock);
    if (!innerResult) {
      return null;
    }
    return {
      ...innerResult,
      frequencyAdverbs: [
        { type: 'adverb', lemma: freqValue, advType: 'frequency' },
        ...innerResult.frequencyAdverbs,
      ],
    };
  }

  // 様態副詞ラッパーの処理
  if (blockType === 'manner_wrapper') {
    const mannerValue = block.getFieldValue('MANNER_VALUE');
    const innerBlock = block.getInputTargetBlock('VERB');
    if (!innerBlock) {
      return null;
    }
    const innerResult = parseVerbChain(innerBlock);
    if (!innerResult) {
      return null;
    }
    return {
      ...innerResult,
      mannerAdverbs: [
        { type: 'adverb', lemma: mannerValue, advType: 'manner' },
        ...innerResult.mannerAdverbs,
      ],
    };
  }

  // 前置詞ラッパー（動詞用）の処理
  if (blockType === 'preposition_verb') {
    const prepValue = block.getFieldValue('PREP_VALUE');
    const innerBlock = block.getInputTargetBlock('VERB');
    const objectBlock = block.getInputTargetBlock('OBJECT');
    if (!innerBlock) {
      return null;
    }
    const innerResult = parseVerbChain(innerBlock);
    if (!innerResult) {
      return null;
    }
    const objectNP = objectBlock ? parseNounPhraseBlock(objectBlock) : {
      type: 'nounPhrase' as const,
      adjectives: [],
      head: { type: 'noun' as const, lemma: 'something', number: 'singular' as const },
      prepositionalPhrases: [],
    };
    return {
      ...innerResult,
      prepositionalPhrases: [
        ...innerResult.prepositionalPhrases,
        { type: 'prepositionalPhrase', preposition: prepValue, object: objectNP },
      ],
    };
  }

  // 等位接続ラッパー（動詞用）の処理
  if (blockType === 'coordination_verb') {
    const conjValue = block.getFieldValue('CONJ_VALUE') as Conjunction;
    const leftBlock = block.getInputTargetBlock('LEFT');
    const rightBlock = block.getInputTargetBlock('RIGHT');
    if (!leftBlock) {
      return null;
    }
    const leftResult = parseVerbChain(leftBlock);
    if (!leftResult) {
      return null;
    }
    // 右側も解析
    const rightResult = rightBlock ? parseVerbChain(rightBlock) : null;
    return {
      ...leftResult,
      coordination: rightResult ? {
        conjunction: conjValue,
        rightVerbPhrase: rightResult.verbPhrase,
      } : undefined,
    };
  }

  // 実際の動詞ブロックの処理（verb, verb_motion, verb_action, etc.）
  if (blockType === 'verb' || blockType.startsWith('verb_')) {
    const verbPhrase = parseVerbBlock(block);
    if (!verbPhrase) {
      return null;
    }
    return {
      verbPhrase,
      polarity: 'affirmative',
      frequencyAdverbs: [],
      mannerAdverbs: [],
      prepositionalPhrases: [],
    };
  }

  return null;
}

// TimeChipの値から出力テキストへのマッピング
const TIME_CHIP_OUTPUT: Record<string, string | null> = {
  // Concrete - 時点指定（出力あり）
  '__placeholder__': null,
  'yesterday': 'yesterday',
  'tomorrow': 'tomorrow',
  'every_day': 'every day',
  'last_sunday': 'last Sunday',
  'right_now': 'right now',
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
  const verbEntry = findVerb(verbLemma);

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
  if (blockType === 'coordination_noun') {
    return parseCoordinationNounBlock(block);
  }

  // 前置詞ラッパー（名詞用）の処理
  if (blockType === 'preposition_noun') {
    return parsePrepositionNounBlock(block);
  }

  // 統合限定詞ブロックの処理
  if (blockType === 'determiner_unified') {
    return parseDeterminerUnifiedBlock(block);
  }

  // 限定詞ラッパーブロックの処理（レガシー）
  if (blockType === 'determiner_block') {
    return parseDeterminerBlock(block);
  }

  // 数量詞ラッパーブロックの処理（レガシー）
  if (blockType === 'quantifier_block') {
    return parseQuantifierBlock(block);
  }

  // 形容詞ラッパーブロックの処理
  if (blockType === 'adjective_wrapper') {
    return parseAdjectiveWrapperBlock(block);
  }

  // 新しい名詞ブロックの処理（カテゴリ別）
  const nounBlockTypes = [
    'pronoun_block', 'human_block', 'animal_block', 'object_block', 'place_block', 'abstract_block',
    // レガシー互換
    'person_block', 'thing_block',
  ];
  if (nounBlockTypes.includes(blockType)) {
    return parseNewNounBlock(block, blockType);
  }

  // レガシーnoun_phraseブロックの処理
  const determiner = block.getFieldValue('DETERMINER');
  const noun = block.getFieldValue('NOUN');
  const number = block.getFieldValue('NUMBER');

  // 形容詞を取得
  const adjectives: { lemma: string }[] = [];

  const adj1Block = block.getInputTargetBlock('ADJ1');
  if (adj1Block) {
    adjectives.push({ lemma: adj1Block.getFieldValue('ADJECTIVE') });
  }

  const adj2Block = block.getInputTargetBlock('ADJ2');
  if (adj2Block) {
    adjectives.push({ lemma: adj2Block.getFieldValue('ADJECTIVE') });
  }

  return {
    type: 'nounPhrase',
    determiner: determiner !== 'none'
      ? { kind: determiner as 'definite' | 'indefinite', lexeme: determiner === 'definite' ? 'the' : 'a' }
      : undefined,
    adjectives,
    head: {
      type: 'noun',
      lemma: noun,
      number: number as 'singular' | 'plural',
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

  // 各データから出力と文法数を取得
  const preOption = DETERMINER_DATA.pre.find(o => o.value === preValue);
  const centralOption = DETERMINER_DATA.central.find(o => o.value === centralValue);
  const postOption = DETERMINER_DATA.post.find(o => o.value === postValue);

  // 文法数を決定（post > central > pre の優先順位）
  let grammaticalNumber: 'singular' | 'plural' = 'singular';
  if (postOption?.number === 'plural' || postOption?.number === 'uncountable') {
    grammaticalNumber = 'plural';
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

  // 限定詞の種類を決定
  let determiner: NounPhraseNode['determiner'] = undefined;
  if (centralOption?.output) {
    if (centralValue === 'the') {
      determiner = { kind: 'definite', lexeme: 'the' };
    } else if (centralValue === 'a') {
      determiner = { kind: 'indefinite', lexeme: 'a' };
    } else {
      determiner = { kind: 'definite', lexeme: centralOption.output };
    }
  }

  return {
    ...innerNP,
    head: updatedHead,
    preDeterminer: preOption?.output ?? undefined,
    determiner,
    postDeterminer: postOption?.output ?? undefined,
  };
}

function parseDeterminerBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const detValue = block.getFieldValue('DET_VALUE');
  const nounBlock = block.getInputTargetBlock('NOUN');

  // 内部の名詞ブロックを解析
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'thing', number: 'singular' as const },
  };

  // 等位接続の場合はそのまま返す
  if (innerResult.type === 'coordinatedNounPhrase') {
    return innerResult;
  }

  const innerNP = innerResult as NounPhraseNode;

  // 限定詞を追加
  return {
    ...innerNP,
    determiner: { kind: 'definite', lexeme: detValue },
  };
}

function parseQuantifierBlock(block: Blockly.Block): NounPhraseNode | CoordinatedNounPhraseNode {
  const qtyValue = block.getFieldValue('QTY_VALUE');
  const nounBlock = block.getInputTargetBlock('NOUN');

  // 数量詞データから数を取得
  const qtyOption = QUANTIFIER_DATA.find(o => o.value === qtyValue);
  const grammaticalNumber = qtyOption?.number === 'plural' ? 'plural' : 'singular';

  // 内部の名詞ブロックを解析
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'thing', number: 'singular' as const },
  };

  // 等位接続の場合はそのまま返す
  if (innerResult.type === 'coordinatedNounPhrase') {
    return innerResult;
  }

  const innerNP = innerResult as NounPhraseNode;

  // 数量詞で数を上書き
  const updatedHead = innerNP.head.type === 'noun'
    ? { ...innerNP.head, number: grammaticalNumber as 'singular' | 'plural' }
    : innerNP.head;

  // 数量詞を追加（出力がnullの場合は値を保存しない）
  return {
    ...innerNP,
    head: updatedHead,
    quantifier: qtyOption?.output ?? undefined,
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

  // 内部の名詞ブロックを解析
  const innerResult = nounBlock ? parseNounPhraseBlock(nounBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'thing', number: 'singular' as const },
  };

  // 前置詞の目的語を解析
  const objectResult = objectBlock ? parseNounPhraseBlock(objectBlock) : {
    type: 'nounPhrase' as const,
    adjectives: [],
    head: { type: 'noun' as const, lemma: 'something', number: 'singular' as const },
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

function parseCoordinationNounBlock(block: Blockly.Block): CoordinatedNounPhraseNode {
  const conjValue = block.getFieldValue('CONJ_VALUE') as Conjunction;
  const leftBlock = block.getInputTargetBlock('LEFT');
  const rightBlock = block.getInputTargetBlock('RIGHT');

  // デフォルトの名詞句
  const defaultNP: NounPhraseNode = {
    type: 'nounPhrase',
    adjectives: [],
    head: { type: 'noun', lemma: 'something', number: 'singular' },
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

  return {
    type: 'coordinatedNounPhrase',
    conjunction: conjValue,
    conjuncts,
  };
}

function parseNewNounBlock(block: Blockly.Block, blockType: string): NounPhraseNode {
  // ブロックタイプに応じたフィールド名のマッピング
  const fieldMap: Record<string, string> = {
    'pronoun_block': 'PRONOUN_VALUE',
    'human_block': 'HUMAN_VALUE',
    'animal_block': 'ANIMAL_VALUE',
    'object_block': 'OBJECT_VALUE',
    'place_block': 'PLACE_VALUE',
    'abstract_block': 'ABSTRACT_VALUE',
    // レガシー互換
    'person_block': 'PERSON_VALUE',
    'thing_block': 'THING_VALUE',
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
  const pronoun = findPronoun(value);
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
