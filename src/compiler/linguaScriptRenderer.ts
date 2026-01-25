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
// モダリティ → 英語表層形マッピング
// ============================================
type ModalType = 'ability' | 'permission' | 'possibility' | 'obligation' | 'certainty' | 'advice' | 'volition' | 'prediction';
type Tense = 'past' | 'present' | 'future';

const modalSurfaceForms: Record<ModalType, Record<Tense, string>> = {
  ability:     { past: 'could',        present: 'can',    future: 'can' },
  permission:  { past: 'could',        present: 'may',    future: 'may' },
  possibility: { past: 'might',        present: 'might',  future: 'might' },
  obligation:  { past: 'had_to',       present: 'must',   future: 'must' },
  certainty:   { past: 'must_have',    present: 'must',   future: 'must' },
  advice:      { past: 'should_have',  present: 'should', future: 'should' },
  volition:    { past: 'was_going_to', present: 'will',   future: 'will' },
  prediction:  { past: 'would',        present: 'will',   future: 'will' },
};

function getModalSurfaceForm(modal: ModalType, tense: Tense): string {
  return modalSurfaceForms[modal]?.[tense] || modal;
}

// ============================================
// AST → LinguaScript レンダラー
// ============================================
export function renderToLinguaScript(ast: SentenceNode): string {
  let result = renderClauseToScript(ast.clause);

  // sentence() ラッパーで包む（仕様: 命題のルート）
  result = `sentence(${result})`;

  // モダリティがある場合は modal() でラップ（仕様: modal(ability:can, sentence(...))）
  if (ast.clause.modal) {
    const modal = ast.clause.modal as ModalType;
    const tense = ast.clause.tense as Tense;
    const surfaceForm = getModalSurfaceForm(modal, tense);
    result = `modal(${modal}:${surfaceForm}, ${result})`;

    // モダリティ否定の場合は not() でラップ（仕様: not(modal(ability:can, ...))）
    if (ast.clause.modalPolarity === 'negative') {
      result = `not(${result})`;
    }
  }

  // 命令文の場合は imperative() でラップ
  if (ast.sentenceType === 'imperative') {
    result = `imperative(${result})`;
  }

  // 時間副詞がある場合は time() ラッパーで包む
  if (ast.timeAdverbial) {
    result = `time('${ast.timeAdverbial.toLowerCase()}, ${result})`;
  }

  return result;
}

function renderClauseToScript(clause: ClauseNode): string {
  const { verbPhrase, tense, aspect, polarity } = clause;

  // 動詞句をレンダリング
  let result = renderVerbPhraseToScript(verbPhrase);

  // 否定をラップ
  if (polarity === 'negative') {
    result = `not(${result})`;
  }

  // 時制+相を組み合わせてラップ（A + B 記法）
  const aspectWrapper = getAspectWrapper(aspect);
  result = `${tense}+${aspectWrapper}(${result})`;

  return result;
}

function getAspectWrapper(
  aspect: 'simple' | 'progressive' | 'perfect' | 'perfectProgressive'
): string {
  // 仕様書に合わせてキャメルケースを維持
  return aspect;
}

function renderVerbPhraseToScript(vp: VerbPhraseNode): string {
  // 意味役割の名前付き引数形式（仕様: verb(agent:'x, theme:'y, ...)）
  const args = vp.arguments
    .filter(arg => arg.filler !== null)
    .map(arg => `${arg.role}:${renderFillerToScript(arg.filler!)}`)
    .join(', ');

  let result = args ? `${vp.verb.lemma}(${args})` : `${vp.verb.lemma}()`;

  // 副詞をラップ（頻度副詞）- 仕様: frequency('always, verb(...))
  const freqAdverbs = vp.adverbs.filter(a => a.advType === 'frequency');
  for (const adv of freqAdverbs) {
    result = `frequency('${adv.lemma}, ${result})`;
  }

  // 副詞をラップ（様態副詞）- 仕様: manner('quickly, verb(...))
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  for (const adv of mannerAdverbs) {
    result = `manner('${adv.lemma}, ${result})`;
  }

  // 前置詞句をラップ - 仕様: pp('in, 'park, verb(...))
  for (const pp of vp.prepositionalPhrases) {
    const objScript = pp.object.type === 'coordinatedNounPhrase'
      ? renderCoordinatedNounPhraseToScript(pp.object as CoordinatedNounPhraseNode)
      : renderNounPhraseToScript(pp.object as NounPhraseNode);
    result = `pp('${pp.preposition}, ${objScript}, ${result})`;
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
    const ap = filler as AdjectivePhraseNode;
    if (ap.degree) {
      return `degree('${ap.degree.lemma}, '${ap.head.lemma})`;
    }
    return `'${ap.head.lemma}`;
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
  // 代名詞の場合
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;
    // 前置詞句修飾がある場合（例: "someone in the room"）
    if (np.prepModifier) {
      const objScript = np.prepModifier.object.type === 'coordinatedNounPhrase'
        ? renderCoordinatedNounPhraseToScript(np.prepModifier.object as CoordinatedNounPhraseNode)
        : renderNounPhraseToScript(np.prepModifier.object as NounPhraseNode);
      return `pronoun('${pronounHead.lemma}, post:pp('${np.prepModifier.preposition}, ${objScript}))`;
    }
    return `'${pronounHead.lemma}`;
  }

  // 名詞句: noun(pre:'all, det:'the, post:'three, adj:['big, 'red], head:'apple)
  const nounHead = np.head as NounHead;
  const parts: string[] = [];

  // 前置限定詞
  if (np.preDeterminer) {
    parts.push(`pre:'${np.preDeterminer}`);
  }

  // 中央限定詞
  if (np.determiner?.lexeme) {
    const det = np.determiner.lexeme;
    // a/an は 'a に統一
    parts.push(`det:'${det === 'an' ? 'a' : det}`);
  }

  // 後置限定詞（複数形マーカー含む）
  if (np.postDeterminer) {
    // メタ値はクォートなし（Lisp慣習: 非リテラル）、リテラルはクォート付き
    const postDet = np.postDeterminer;
    if (postDet === '[plural]' || postDet === '__plural__') {
      parts.push(`post:plural`);
    } else if (postDet === '[uncountable]' || postDet === '__uncountable__') {
      parts.push(`post:uncountable`);
    } else {
      parts.push(`post:'${postDet}`);
    }
  } else if (nounHead.number === 'plural' && !np.determiner?.lexeme && !np.preDeterminer) {
    // 限定詞なしの複数形
    parts.push(`post:plural`);
  }

  // 形容詞
  if (np.adjectives.length > 0) {
    if (np.adjectives.length === 1) {
      parts.push(`adj:'${np.adjectives[0].lemma}`);
    } else {
      const adjList = np.adjectives.map(adj => `'${adj.lemma}`).join(', ');
      parts.push(`adj:[${adjList}]`);
    }
  }

  // 名詞ヘッド
  parts.push(`head:'${nounHead.lemma}`);

  // 前置詞句修飾（後置修飾）
  if (np.prepModifier) {
    const objScript = np.prepModifier.object.type === 'coordinatedNounPhrase'
      ? renderCoordinatedNounPhraseToScript(np.prepModifier.object as CoordinatedNounPhraseNode)
      : renderNounPhraseToScript(np.prepModifier.object as NounPhraseNode);
    parts.push(`post:pp('${np.prepModifier.preposition}, ${objScript})`);
  }

  return `noun(${parts.join(', ')})`;
}
