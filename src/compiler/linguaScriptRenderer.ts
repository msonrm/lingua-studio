import {
  SentenceNode,
  ClauseNode,
  NounPhraseNode,
  VerbPhraseNode,
  NounHead,
  PronounHead,
  AdjectivePhraseNode,
  CoordinatedNounPhraseNode,
} from '../types/schema';

// ============================================
// AST → LinguaScript レンダラー
// ============================================
export function renderToLinguaScript(ast: SentenceNode): string {
  const clauseScript = renderClauseToScript(ast.clause);

  // 時間副詞がある場合は別途表示（コメントとして）
  if (ast.timeAdverbial) {
    return `${clauseScript}  // ${ast.timeAdverbial}`;
  }

  return clauseScript;
}

function renderClauseToScript(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect, polarity } = clause;

  // 動詞句をレンダリング
  let result = renderVerbPhraseToScript(verbPhrase);

  // 否定をラップ
  if (polarity === 'negative') {
    result = `not(${result})`;
  }

  // アスペクトをラップ（常に明示）
  const aspectWrapper = getAspectWrapper(aspect);
  result = `${aspectWrapper}(${result})`;

  // 時制をラップ（常に明示）
  result = `${tense}(${result})`;

  return result;
}

function getAspectWrapper(
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive'
): string {
  const aspectMap: Record<string, string> = {
    'simple': 'simple',
    'progressive': 'progressive',
    'perfect': 'perfect',
    'perfectProgressive': 'perfect_progressive',
  };

  return aspectMap[aspect];
}

function renderVerbPhraseToScript(vp: VerbPhraseNode): string {
  const args = vp.arguments
    .filter(arg => arg.filler !== null)
    .map(arg => renderFillerToScript(arg.filler!))
    .join(', ');

  let result = args ? `${vp.verb.lemma}(${args})` : `${vp.verb.lemma}()`;

  // 副詞をラップ（頻度副詞）
  const freqAdverbs = vp.adverbs.filter(a => a.advType === 'frequency');
  for (const adv of freqAdverbs) {
    result = `${adv.lemma}(${result})`;
  }

  // 副詞をラップ（様態副詞）
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  for (const adv of mannerAdverbs) {
    result = `${adv.lemma}(${result})`;
  }

  // 前置詞句をラップ
  for (const pp of vp.prepositionalPhrases) {
    const objScript = pp.object.type === 'coordinatedNounPhrase'
      ? renderCoordinatedNounPhraseToScript(pp.object as CoordinatedNounPhraseNode)
      : renderNounPhraseToScript(pp.object as NounPhraseNode);
    result = `${pp.preposition}(${result}, ${objScript})`;
  }

  // 等位接続をラップ
  if (vp.coordinatedWith) {
    const coordScript = renderVerbPhraseToScript(vp.coordinatedWith.verbPhrase);
    result = `${vp.coordinatedWith.conjunction}(${result}, ${coordScript})`;
  }

  return result;
}

function renderFillerToScript(filler: NounPhraseNode | AdjectivePhraseNode | CoordinatedNounPhraseNode): string {
  if (filler.type === 'nounPhrase') {
    return renderNounPhraseToScript(filler as NounPhraseNode);
  } else if (filler.type === 'coordinatedNounPhrase') {
    return renderCoordinatedNounPhraseToScript(filler as CoordinatedNounPhraseNode);
  } else if (filler.type === 'adjectivePhrase') {
    return `'${(filler as AdjectivePhraseNode).head.lemma}`;
  }
  return '?';
}

function renderCoordinatedNounPhraseToScript(coordNP: CoordinatedNounPhraseNode): string {
  const conjuncts = coordNP.conjuncts.map(conjunct => {
    if (conjunct.type === 'coordinatedNounPhrase') {
      // 入れ子の場合は再帰的にレンダリング
      return renderCoordinatedNounPhraseToScript(conjunct);
    }
    return renderNounPhraseToScript(conjunct);
  });
  return `${coordNP.conjunction}(${conjuncts.join(', ')})`;
}

function renderNounPhraseToScript(np: NounPhraseNode): string {
  // 名詞/代名詞のヘッドをレンダリング
  let result: string;

  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    result = `'${pronounHead.lemma}`;
  } else {
    const nounHead = np.head as NounHead;
    // 複数形の場合はマーク
    if (nounHead.number === 'plural') {
      result = `plural('${nounHead.lemma})`;
    } else {
      result = `'${nounHead.lemma}`;
    }
  }

  // 形容詞をラップ（内側から外側へ）
  for (const adj of [...np.adjectives].reverse()) {
    result = `${adj.lemma}(${result})`;
  }

  // 限定詞をラップ
  if (np.postDeterminer) {
    result = `${np.postDeterminer}(${result})`;
  }

  if (np.determiner?.lexeme) {
    const det = np.determiner.lexeme;
    if (det === 'a' || det === 'an') {
      result = `a(${result})`;
    } else {
      result = `${det}(${result})`;
    }
  }

  if (np.preDeterminer) {
    result = `${np.preDeterminer}(${result})`;
  }

  // レガシー数量詞
  if (np.quantifier) {
    result = `${np.quantifier}(${result})`;
  }

  // 前置詞句修飾
  if (np.prepModifier) {
    const objScript = np.prepModifier.object.type === 'coordinatedNounPhrase'
      ? renderCoordinatedNounPhraseToScript(np.prepModifier.object as CoordinatedNounPhraseNode)
      : renderNounPhraseToScript(np.prepModifier.object as NounPhraseNode);
    result = `${np.prepModifier.preposition}(${result}, ${objScript})`;
  }

  return result;
}
