import {
  SentenceNode,
  ClauseNode,
  NounPhraseNode,
  NounHead,
  FilledArgumentSlot,
} from '../types/schema';
import { findVerb, findNoun } from '../data/dictionary';

// ============================================
// AST → 英文レンダラー
// ============================================
export function renderToEnglish(ast: SentenceNode): string {
  const clause = renderClause(ast.clause);

  // 文頭を大文字に、末尾にピリオド
  const capitalized = clause.charAt(0).toUpperCase() + clause.slice(1);
  return capitalized + '.';
}

function renderClause(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect } = clause;

  // 主語（agent）を取得
  const agentSlot = verbPhrase.arguments.find(a => a.role === 'agent');
  const subject = agentSlot?.filler ? renderNounPhrase(agentSlot.filler as NounPhraseNode) : '';

  // 動詞を活用
  const verbForm = conjugateVerb(verbPhrase.verb.lemma, tense, aspect, agentSlot?.filler as NounPhraseNode | undefined);

  // 副詞
  const adverbs = verbPhrase.adverbs.map(a => a.lemma).join(' ');

  // その他の引数（目的語など）
  const otherArgs = verbPhrase.arguments
    .filter(a => a.role !== 'agent' && a.filler)
    .map(a => renderArgument(a))
    .join(' ');

  // 語順: Subject + Verb + Adverb または Subject + Adverb + Verb
  // 英語では様態副詞は文末が一般的
  const parts = [subject, verbForm, otherArgs, adverbs].filter(p => p.length > 0);

  return parts.join(' ');
}

function renderNounPhrase(np: NounPhraseNode): string {
  const parts: string[] = [];

  // 限定詞
  if (np.determiner) {
    if (np.determiner.kind === 'definite') {
      parts.push('the');
    } else if (np.determiner.kind === 'indefinite') {
      // a/an の判定は後で
      parts.push('INDEF');
    }
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
  if (result.startsWith('INDEF ')) {
    const rest = result.slice(6);
    const firstChar = rest.charAt(0).toLowerCase();
    const article = ['a', 'e', 'i', 'o', 'u'].includes(firstChar) ? 'an' : 'a';
    result = article + ' ' + rest;
  }

  return result;
}

function renderArgument(slot: FilledArgumentSlot): string {
  if (!slot.filler) return '';

  if (slot.filler.type === 'nounPhrase') {
    return renderNounPhrase(slot.filler as NounPhraseNode);
  }

  return '';
}

function conjugateVerb(
  lemma: string,
  tense: 'past' | 'present' | 'future',
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive',
  subject?: NounPhraseNode
): string {
  const verbEntry = findVerb(lemma);
  if (!verbEntry) return lemma;

  // 主語の人称・数を判定
  const isThirdPersonSingular = subject && isThirdSingular(subject);

  // Simple aspect のみ実装（Phase 1）
  if (aspect === 'simple') {
    switch (tense) {
      case 'past':
        return verbEntry.forms.past;
      case 'present':
        return isThirdPersonSingular ? verbEntry.forms.s : verbEntry.forms.base;
      case 'future':
        return 'will ' + verbEntry.forms.base;
    }
  }

  // Progressive
  if (aspect === 'progressive') {
    const beForm = tense === 'past' ? 'was' : (tense === 'future' ? 'will be' : (isThirdPersonSingular ? 'is' : 'are'));
    return beForm + ' ' + verbEntry.forms.ing;
  }

  // Perfect
  if (aspect === 'perfect') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
    return haveForm + ' ' + verbEntry.forms.pp;
  }

  return lemma;
}

function isThirdSingular(np: NounPhraseNode): boolean {
  if (np.head.type === 'noun') {
    const nounHead = np.head as NounHead;
    return nounHead.number === 'singular';
  }
  return false;
}
