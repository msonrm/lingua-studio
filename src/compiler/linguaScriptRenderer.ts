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
// モダリティ → 基本表層形マッピング
// 時制に依存せず基本形のみ（実際の活用はレンダラーが処理）
// LLM検証済み: 基本形から時制に応じた正しい表層形を推論可能
// ============================================
type ModalType = 'ability' | 'permission' | 'possibility' | 'obligation' | 'certainty' | 'advice' | 'volition' | 'prediction';

const modalBaseForms: Record<ModalType, string> = {
  ability:     'can',
  permission:  'may',
  possibility: 'might',
  obligation:  'must',
  certainty:   'must',
  advice:      'should',
  volition:    'will',
  prediction:  'will',
};

function getModalBaseForm(modal: ModalType): string {
  return modalBaseForms[modal] || modal;
}

// ============================================
// AST → LinguaScript レンダラー
// ============================================
export function renderToLinguaScript(ast: SentenceNode): string {
  let result = renderClauseToScript(ast.clause, ast.timeAdverbial);

  // fact の場合は fact() ラッパー（仕様: fact と sentence は排他）
  // fact は modal を持たない（仕様）
  if (ast.sentenceType === 'fact') {
    result = `fact(${result})`;
    return result;
  }

  // sentence() ラッパーで包む（仕様: 命題のルート）
  result = `sentence(${result})`;

  // モダリティがある場合は modal() でラップ（仕様: modal(ability:can, sentence(...))）
  if (ast.clause.modal) {
    const modal = ast.clause.modal as ModalType;
    const baseForm = getModalBaseForm(modal);
    result = `modal(${modal}:${baseForm}, ${result})`;

    // モダリティ否定の場合は not() でラップ（仕様: not(modal(ability:can, ...))）
    if (ast.clause.modalPolarity === 'negative') {
      result = `not(${result})`;
    }
  }

  // 命令文の場合は imperative() でラップ
  if (ast.sentenceType === 'imperative') {
    result = `imperative(${result})`;
  }

  // 疑問文の場合は question() でラップ
  if (ast.sentenceType === 'interrogative') {
    result = `question(${result})`;
  }

  return result;
}

function renderClauseToScript(clause: ClauseNode, timeAdverbial?: string): string {
  const { verbPhrase, tense, aspect, polarity } = clause;

  // 動詞句をレンダリング
  let result = renderVerbPhraseToScript(verbPhrase);

  // 時間副詞をラップ（他の副詞と同階層、not の前）
  if (timeAdverbial) {
    result = `time('${timeAdverbial.toLowerCase()}, ${result})`;
  }

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

  // 副詞をラップ（様態副詞）- 仕様: manner('quickly, verb(...)) / manner(?how, verb(...))
  const mannerAdverbs = vp.adverbs.filter(a => a.advType === 'manner');
  for (const adv of mannerAdverbs) {
    // 疑問副詞はクォートなし
    const advValue = adv.lemma.startsWith('?') ? adv.lemma : `'${adv.lemma}`;
    result = `manner(${advValue}, ${result})`;
  }

  // 副詞をラップ（場所副詞）- 仕様: locative('here, verb(...)) / locative(?where, verb(...))
  const locativeAdverbs = vp.adverbs.filter(a => a.advType === 'place');
  for (const adv of locativeAdverbs) {
    // 疑問副詞はクォートなし
    const advValue = adv.lemma.startsWith('?') ? adv.lemma : `'${adv.lemma}`;
    result = `locative(${advValue}, ${result})`;
  }

  // 副詞をラップ（時間副詞）- 仕様: time('today, verb(...)) / time(?when, verb(...))
  const timeAdverbs = vp.adverbs.filter(a => a.advType === 'time');
  for (const adv of timeAdverbs) {
    // 疑問副詞はクォートなし
    const advValue = adv.lemma.startsWith('?') ? adv.lemma : `'${adv.lemma}`;
    result = `time(${advValue}, ${result})`;
  }

  // 前置詞句をラップ - 仕様: pp('in, 'park, verb(...))
  for (const pp of vp.prepositionalPhrases) {
    const objScript = pp.object.type === 'coordinatedNounPhrase'
      ? renderCoordinatedNounPhraseToScript(pp.object as CoordinatedNounPhraseNode)
      : renderNounPhraseToScript(pp.object as NounPhraseNode);
    result = `pp('${pp.preposition}, ${objScript}, ${result})`;
  }

  // 等位接続をラップ（小文字 and/or - NP/VP の接続）
  if (vp.coordinatedWith) {
    const coordScript = renderVerbPhraseToScript(vp.coordinatedWith.verbPhrase);
    result = `${vp.coordinatedWith.conjunction}(${result}, ${coordScript})`;
  }

  // 命題レベル論理演算をラップ（大文字 AND/OR/NOT/IF/BECAUSE - Logic Extension）
  // 注: ブロックレベルで fact_wrapper 内のみ接続可能に制限済み
  if (vp.logicOp) {
    const { operator, leftOperand, rightOperand } = vp.logicOp;

    // leftOperandがある場合はネストされた論理式（例: NOT(AND(P, Q))）
    const leftScript = leftOperand ? renderVerbPhraseToScript(leftOperand) : result;

    if (operator === 'NOT') {
      // 単項演算子: NOT(P) または NOT(AND(P, Q))
      result = `NOT(${leftScript})`;
    } else if (operator === 'IF') {
      // 条件・含意: IF(P, then:Q)
      const rightScript = rightOperand ? renderVerbPhraseToScript(rightOperand) : '___';
      result = `IF(${leftScript}, then:${rightScript})`;
    } else if (operator === 'BECAUSE') {
      // 因果関係: BECAUSE(P, effect:Q)
      const rightScript = rightOperand ? renderVerbPhraseToScript(rightOperand) : '___';
      result = `BECAUSE(${leftScript}, effect:${rightScript})`;
    } else {
      // 二項演算子: AND(P, Q), OR(P, Q)
      const rightScript = rightOperand ? renderVerbPhraseToScript(rightOperand) : '___';
      result = `${operator}(${leftScript}, ${rightScript})`;
    }
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

  // 選択疑問の場合は ?which(...) 形式で出力
  if (coordNP.isChoiceQuestion) {
    return `?which(${conjuncts.join(', ')})`;
  }

  return `${coordNP.conjunction}(${conjuncts.join(', ')})`;
}

function renderNounPhraseToScript(np: NounPhraseNode): string {
  // 代名詞の場合
  if (np.head.type === 'pronoun') {
    const pronounHead = np.head as PronounHead;

    // 疑問詞の場合: ?who, ?what（クォートなし）
    if (pronounHead.pronounType === 'interrogative') {
      // 疑問詞は修飾を持たない（仕様）
      return pronounHead.lemma;  // ?who, ?what as-is
    }

    const parts: string[] = [`'${pronounHead.lemma}`];

    // 形容詞（不定代名詞 + 形容詞: "something beautiful"）
    if (np.adjectives.length > 0) {
      if (np.adjectives.length === 1) {
        parts.push(`adj:'${np.adjectives[0].lemma}`);
      } else {
        const adjList = np.adjectives.map(adj => `'${adj.lemma}`).join(', ');
        parts.push(`adj:[${adjList}]`);
      }
    }

    // 前置詞句修飾（例: "someone in the room"）
    if (np.prepModifier) {
      const objScript = np.prepModifier.object.type === 'coordinatedNounPhrase'
        ? renderCoordinatedNounPhraseToScript(np.prepModifier.object as CoordinatedNounPhraseNode)
        : renderNounPhraseToScript(np.prepModifier.object as NounPhraseNode);
      parts.push(`post:pp('${np.prepModifier.preposition}, ${objScript})`);
    }

    // 修飾がある場合は pronoun() でラップ
    if (parts.length > 1) {
      return `pronoun(${parts.join(', ')})`;
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
