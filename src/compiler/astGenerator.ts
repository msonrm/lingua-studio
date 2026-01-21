import * as Blockly from 'blockly';
import {
  SentenceNode,
  ClauseNode,
  VerbPhraseNode,
  NounPhraseNode,
  FilledArgumentSlot,
  AdverbNode,
} from '../types/schema';
import { findVerb } from '../data/dictionary';
import { TIME_CHIP_DATA } from '../blocks/definitions';

// ============================================
// BlocklyワークスペースからAST生成
// ============================================
export function generateAST(workspace: Blockly.Workspace): SentenceNode | null {
  const timeFrameBlocks = workspace.getBlocksByType('time_frame', false);

  if (timeFrameBlocks.length === 0) {
    return null;
  }

  const timeFrameBlock = timeFrameBlocks[0];
  return parseTimeFrameBlock(timeFrameBlock);
}

function parseTimeFrameBlock(block: Blockly.Block): SentenceNode | null {
  // TimeChipを取得してTense/Aspect/出力単語を決定
  const timeChipBlock = block.getInputTargetBlock('TIME_CHIP');
  const { tense, aspect, timeAdverbial } = parseTimeChip(timeChipBlock);

  // 動詞句を取得
  const verbBlock = block.getInputTargetBlock('ACTION');
  if (!verbBlock) {
    return null;
  }

  const verbPhrase = parseVerbBlock(verbBlock);
  if (!verbPhrase) {
    return null;
  }

  const clause: ClauseNode = {
    type: 'clause',
    verbPhrase,
    tense,
    aspect,
    polarity: 'affirmative',
  };

  return {
    type: 'sentence',
    clause,
    sentenceType: 'declarative',
    timeAdverbial,
  };
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

  // 副詞を取得
  const adverbs: AdverbNode[] = [];
  const adverbBlock = block.getInputTargetBlock('ADVERB');
  if (adverbBlock) {
    const adverbLemma = adverbBlock.getFieldValue('ADVERB');
    adverbs.push({
      type: 'adverb',
      lemma: adverbLemma,
      advType: 'manner',
    });
  }

  return {
    type: 'verbPhrase',
    verb: { lemma: verbLemma },
    arguments: args,
    adverbs,
  };
}

function parseNounPhraseBlock(block: Blockly.Block): NounPhraseNode {
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
