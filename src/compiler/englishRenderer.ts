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

// 主語となりうるロール
const SUBJECT_ROLES: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];

// ============================================
// AST → 英文レンダラー
// ============================================
export function renderToEnglish(ast: SentenceNode): string {
  // 命令文の場合は別処理
  const clause = ast.sentenceType === 'imperative'
    ? renderImperativeClause(ast.clause)
    : renderClause(ast.clause);

  // 時間副詞を文末に追加
  const timeAdverbial = ast.timeAdverbial;
  const fullSentence = timeAdverbial ? `${clause} ${timeAdverbial}` : clause;

  // 文頭を大文字に、末尾は命令文なら感嘆符、それ以外はピリオド
  const capitalized = fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1);
  const punctuation = ast.sentenceType === 'imperative' ? '!' : '.';
  return capitalized + punctuation;
}

function renderClause(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect, polarity, modal, modalPolarity } = clause;

  // 主語を取得（agent, experiencer, possessor, theme の順で探す）
  let subjectSlot: FilledArgumentSlot | undefined;
  for (const role of SUBJECT_ROLES) {
    subjectSlot = verbPhrase.arguments.find(a => a.role === role);
    if (subjectSlot?.filler) break;
  }

  // 主語をレンダリング（isSubject = true）
  // 主語がない場合は "someone" をデフォルト値として使用（命令文は別途ラッパーで対応予定）
  const subject = subjectSlot?.filler ? renderFiller(subjectSlot.filler, true, polarity) : 'someone';

  // 動詞エントリを取得して前置詞情報を参照
  const verbEntry = findVerb(verbPhrase.verb.lemma);

  // 副詞を種類別に分類
  const frequencyAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'frequency');
  const mannerAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'manner');
  const locativeAdverbs = verbPhrase.adverbs.filter(a => a.advType === 'place');

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

  // 様態副詞は文末
  const mannerStr = mannerAdverbs.map(a => a.lemma).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(a.lemma, polarity)).join(' ');

  // 前置詞句（動詞修飾）
  const prepPhrases = verbPhrase.prepositionalPhrases
    .map(pp => renderPrepositionalPhrase(pp, polarity))
    .join(' ');

  // 語順: Subject + Verb(+neg+freq) + Objects + PrepPhrases + Manner + Location
  const parts = [subject, verbForm, otherArgs, prepPhrases, mannerStr, locativeStr].filter(p => p.length > 0);

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

  // その他の引数（目的語など）- 主語は除外
  const subjectRoles: SemanticRole[] = ['agent', 'experiencer', 'possessor'];
  const otherArgs = verbPhrase.arguments
    .filter(a => !subjectRoles.includes(a.role) && a.filler)
    .map(a => {
      const slotDef = verbEntry?.valency.find(v => v.role === a.role);
      const preposition = slotDef?.preposition;
      const rendered = renderFiller(a.filler!, false, polarity);
      return preposition ? `${preposition} ${rendered}` : rendered;
    })
    .join(' ');

  // 様態副詞は文末
  const mannerStr = mannerAdverbs.map(a => a.lemma).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(a.lemma, polarity)).join(' ');

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

  // その他の引数（目的語など）
  const subjectRoles: SemanticRole[] = ['agent', 'experiencer', 'possessor'];
  const otherArgs = vp.arguments
    .filter(a => !subjectRoles.includes(a.role) && a.filler)
    .map(a => {
      const slotDef = verbEntry?.valency.find(v => v.role === a.role);
      const preposition = slotDef?.preposition;
      const rendered = renderFiller(a.filler!, false, polarity);
      return preposition ? `${preposition} ${rendered}` : rendered;
    })
    .join(' ');

  // 様態副詞は文末
  const mannerStr = mannerAdverbs.map(a => a.lemma).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(a.lemma, polarity)).join(' ');

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

  // 主語となりうるロールを取得
  const subjectRoles: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];
  let ownSubjectSlot: FilledArgumentSlot | undefined;
  for (const role of subjectRoles) {
    ownSubjectSlot = vp.arguments.find(a => a.role === role && a.filler);
    if (ownSubjectSlot?.filler) break;
  }

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

  // その他の引数（目的語など）- 主語以外
  const otherArgs = vp.arguments
    .filter(a => a !== ownSubjectSlot && a.filler)
    .map(a => {
      const slotDef = verbEntry?.valency.find(v => v.role === a.role);
      const preposition = slotDef?.preposition;
      const rendered = renderFiller(a.filler!, false, polarity);
      return preposition ? `${preposition} ${rendered}` : rendered;
    })
    .join(' ');

  // 様態副詞は文末
  const mannerStr = mannerAdverbs.map(a => a.lemma).join(' ');

  // 場所副詞は最後（極性感応: somewhere ↔ anywhere）
  const locativeStr = locativeAdverbs.map(a => renderLocativeAdverb(a.lemma, polarity)).join(' ');

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
          break;
        case 'present':
          doForm = isThirdPersonSingular ? 'does' : 'do';
          break;
        case 'future':
          // will not [freq] base
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
          return freqStr ? `${freqStr} ${pastForm}` : pastForm;
        }
        case 'present': {
          const presentForm = getIrregularForm('present') ||
            (isThirdPersonSingular ? verbEntry.forms.s : verbEntry.forms.base);
          return freqStr ? `${freqStr} ${presentForm}` : presentForm;
        }
        case 'future':
          return freqStr
            ? `will ${freqStr} ${verbEntry.forms.base}`
            : `will ${verbEntry.forms.base}`;
      }
    }
  }

  // Progressive: aux + [not] + [freq] + verb-ing
  if (aspect === 'progressive') {
    const beForm = getBeAuxiliary(tense);
    const notPart = isNegative ? 'not' : '';
    const parts = [beForm, notPart, freqStr, verbEntry.forms.ing].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect: aux + [not] + [freq] + verb-pp
  if (aspect === 'perfect') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
    const notPart = isNegative ? 'not' : '';
    const parts = [haveForm, notPart, freqStr, verbEntry.forms.pp].filter(p => p.length > 0);
    return parts.join(' ');
  }

  // Perfect Progressive: aux + [not] + [freq] + been + verb-ing
  if (aspect === 'perfectProgressive') {
    const haveForm = tense === 'past' ? 'had' : (tense === 'future' ? 'will have' : (isThirdPersonSingular ? 'has' : 'have'));
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
