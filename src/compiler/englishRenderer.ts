import {
  SentenceNode,
  ClauseNode,
  NounPhraseNode,
  NounHead,
  PronounHead,
  FilledArgumentSlot,
  AdjectivePhraseNode,
  SemanticRole,
} from '../types/schema';
import { findVerb, findNoun, findPronoun } from '../data/dictionary';

// 主語となりうるロール
const SUBJECT_ROLES: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];

// ============================================
// AST → 英文レンダラー
// ============================================
export function renderToEnglish(ast: SentenceNode): string {
  const clause = renderClause(ast.clause);

  // 時間副詞を文末に追加
  const timeAdverbial = ast.timeAdverbial;
  const fullSentence = timeAdverbial ? `${clause} ${timeAdverbial}` : clause;

  // 文頭を大文字に、末尾にピリオド
  const capitalized = fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1);
  return capitalized + '.';
}

function renderClause(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect, polarity } = clause;

  // 主語を取得（agent, experiencer, possessor, theme の順で探す）
  let subjectSlot: FilledArgumentSlot | undefined;
  for (const role of SUBJECT_ROLES) {
    subjectSlot = verbPhrase.arguments.find(a => a.role === role);
    if (subjectSlot?.filler) break;
  }

  // 主語をレンダリング（isSubject = true）
  const subject = subjectSlot?.filler ? renderFiller(subjectSlot.filler, true, polarity) : '';

  // 動詞エントリを取得して前置詞情報を参照
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 動詞を活用
  const verbForm = conjugateVerb(
    verbPhrase.verb.lemma,
    tense,
    aspect,
    subjectSlot?.filler as NounPhraseNode | undefined
  );

  // 副詞
  const adverbs = verbPhrase.adverbs.map(a => a.lemma).join(' ');

  // その他の引数（目的語など）- 主語以外（isSubject = false）
  const otherArgs = verbPhrase.arguments
    .filter(a => a !== subjectSlot && a.filler)
    .map(a => {
      // 前置詞を辞書から取得
      const slotDef = verbEntry?.valency.find(v => v.role === a.role);
      const preposition = slotDef?.preposition;
      const rendered = renderFiller(a.filler!, false, polarity);  // 目的語は isSubject = false
      return preposition ? `${preposition} ${rendered}` : rendered;
    })
    .join(' ');

  // 語順: Subject + Verb + Objects + Adverbs
  const parts = [subject, verbForm, otherArgs, adverbs].filter(p => p.length > 0);

  return parts.join(' ');
}

function renderFiller(
  filler: NounPhraseNode | AdjectivePhraseNode,
  isSubject: boolean = false,
  polarity: 'affirmative' | 'negative' = 'affirmative'
): string {
  if (filler.type === 'nounPhrase') {
    return renderNounPhrase(filler as NounPhraseNode, isSubject, polarity);
  } else if (filler.type === 'adjectivePhrase') {
    return (filler as AdjectivePhraseNode).head.lemma;
  }
  return '';
}

function renderNounPhrase(np: NounPhraseNode, isSubject: boolean = true, polarity: 'affirmative' | 'negative' = 'affirmative'): string {
  // 代名詞の処理
  if (np.head.type === 'pronoun') {
    return renderPronoun(np.head as PronounHead, isSubject, polarity);
  }

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

function renderPronoun(head: PronounHead, isSubject: boolean, polarity: 'affirmative' | 'negative'): string {
  const pronoun = findPronoun(head.lemma);

  if (!pronoun) {
    return head.lemma;
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
    return pronoun.objectForm;
  }
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

  // Simple aspect
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

  // Perfect Progressive
  if (aspect === 'perfectProgressive') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
    return haveForm + ' been ' + verbEntry.forms.ing;
  }

  return lemma;
}

function isThirdSingular(np: NounPhraseNode): boolean {
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
