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

// ============================================
// BlocklyワークスペースからAST生成
// ============================================
export function generateAST(workspace: Blockly.Workspace): SentenceNode | null {
  const sentenceBlocks = workspace.getBlocksByType('sentence', false);

  if (sentenceBlocks.length === 0) {
    return null;
  }

  const sentenceBlock = sentenceBlocks[0];
  return parseSentenceBlock(sentenceBlock);
}

function parseSentenceBlock(block: Blockly.Block): SentenceNode | null {
  // 時制を取得
  const tenseBlock = block.getInputTargetBlock('TENSE');
  const tense = tenseBlock?.getFieldValue('TENSE') || 'present';

  // 動詞句を取得
  const verbBlock = block.getInputTargetBlock('VERB_PHRASE');
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
    tense: tense as 'past' | 'present' | 'future',
    aspect: 'simple',
    polarity: 'affirmative',
  };

  return {
    type: 'sentence',
    clause,
    sentenceType: 'declarative',
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
