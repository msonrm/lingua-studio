/**
 * ゴールデンテストのケース表
 *
 * CHANGELOG.md の「実装済み機能」をそのまま網羅することを狙っている。
 *
 * ⚠ ここに書かれた期待値（スナップショット）は「正しい出力」ではなく
 *    「2026-07-26 時点の出力」である。ゴールデンテストの目的は正しさの保証ではなく、
 *    リファクタリング中の意図しない変化の検出。
 *    既知の未対応項目には KNOWN ISSUE コメントを付けてある。
 */

import type { SentenceNode } from '../types/schema';
import {
  sentence,
  clause,
  decl,
  vp,
  arg,
  pron,
  noun,
  coordNP,
  coordVp,
  adjP,
  adv,
  pp,
} from './builders';
import type { ClauseNode, ModalType } from '../types/schema';

export interface RenderCase {
  name: string;
  ast: SentenceNode;
  note?: string;
}

// よく使う部品
const I = () => pron('I');
const he = () => pron('he');
const anApple = () => noun('apple', { det: 'a' });
const eatApple = () => vp('eat', [arg('agent', I()), arg('patient', anApple())]);

// ============================================
// 文型
// ============================================
const sentenceTypes: RenderCase[] = [
  { name: '平叙文: I eat an apple', ast: decl(eatApple()) },
  {
    name: '疑問文（Yes/No）: do-support',
    ast: sentence(clause(eatApple()), { sentenceType: 'interrogative' }),
  },
  {
    name: '疑問文（Yes/No）: 3人称単数',
    ast: sentence(clause(vp('eat', [arg('agent', he()), arg('patient', anApple())])), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: 'Wh疑問文: ?who（主語疑問）',
    ast: sentence(clause(vp('eat', [arg('agent', pron('?who')), arg('patient', anApple())])), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: 'Wh疑問文: ?what（目的語疑問）',
    ast: sentence(clause(vp('eat', [arg('agent', I()), arg('patient', pron('?what'))])), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: 'Wh疑問文: ?where',
    ast: sentence(clause(vp('run', [arg('agent', I())], { adverbs: [adv('?where', 'place')] })), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: 'Wh疑問文: ?when',
    ast: sentence(clause(vp('run', [arg('agent', I())], { adverbs: [adv('?when', 'time')] })), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: 'Wh疑問文: ?how',
    ast: sentence(clause(vp('run', [arg('agent', I())], { adverbs: [adv('?how', 'manner')] })), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: '命令文: Eat an apple',
    ast: sentence(clause(vp('eat', [arg('agent', null), arg('patient', anApple())])), {
      sentenceType: 'imperative',
    }),
  },
  {
    name: '事実宣言（fact）',
    ast: sentence(clause(eatApple()), { sentenceType: 'fact' }),
  },
  {
    name: '時間副詞（TimeChip 由来）',
    ast: sentence(clause(eatApple(), { tense: 'past' }), { timeAdverbial: 'Yesterday' }),
  },
];

// ============================================
// 時制 × 相（3 × 4 = 12通り）
// ============================================
const tenses: ClauseNode['tense'][] = ['past', 'present', 'future'];
const aspects: ClauseNode['aspect'][] = [
  'simple',
  'progressive',
  'perfect',
  'perfectProgressive',
];

const tenseAspect: RenderCase[] = tenses.flatMap(tense =>
  aspects.map(aspect => ({
    name: `時制×相: ${tense} + ${aspect}`,
    ast: decl(eatApple(), { tense, aspect }),
  }))
);

// ============================================
// 否定
// ============================================
const negation: RenderCase[] = [
  { name: '否定: 節レベル（do-support）', ast: decl(eatApple(), { polarity: 'negative' }) },
  {
    name: '否定: 節レベル + 3人称単数',
    ast: decl(vp('eat', [arg('agent', he()), arg('patient', anApple())]), {
      polarity: 'negative',
    }),
  },
  {
    name: '否定: 過去',
    ast: decl(eatApple(), { tense: 'past', polarity: 'negative' }),
  },
  {
    name: '否定: 進行相',
    ast: decl(eatApple(), { aspect: 'progressive', polarity: 'negative' }),
  },
  {
    name: '否定: 疑問文',
    ast: sentence(clause(eatApple(), { polarity: 'negative' }), {
      sentenceType: 'interrogative',
    }),
  },
  {
    name: '否定: VPレベル（等位接続内）',
    ast: decl(
      coordVp('and', [
        vp('eat', [arg('agent', I())], { polarity: 'negative' }),
        vp('drink', [arg('agent', I())]),
      ])
    ),
  },
  {
    name: '否定: 二重否定（節 + VP）',
    ast: decl(vp('eat', [arg('agent', I())], { polarity: 'negative' }), {
      polarity: 'negative',
    }),
  },
];

// ============================================
// モダリティ（ModalType 8種）
// ============================================
const modalTypes: ModalType[] = [
  'ability',
  'permission',
  'possibility',
  'obligation',
  'certainty',
  'advice',
  'volition',
  'prediction',
];

const modality: RenderCase[] = [
  ...modalTypes.map(modal => ({
    name: `モダリティ: ${modal}`,
    ast: decl(eatApple(), { modal }),
  })),
  {
    name: 'モダリティ: ability + 過去',
    ast: decl(eatApple(), { modal: 'ability', tense: 'past' }),
  },
  {
    name: 'モダリティ: obligation + 過去（迂言形式）',
    ast: decl(eatApple(), { modal: 'obligation', tense: 'past' }),
    note: 'had to。以前は do-support が重複して "did have to" になっていた',
  },
  {
    name: 'モダリティ: 義務のモダリティ否定（3人称単数）',
    ast: decl(
      vp('eat', [arg('agent', he()), arg('patient', anApple())]),
      { modal: 'obligation', modalPolarity: 'negative' }
    ),
    note: "doesn't have to。以前は主語に一致せず \"He don't have to\" になっていた",
  },
  {
    name: 'モダリティ: 意志のモダリティ否定 + 過去',
    ast: decl(eatApple(), { modal: 'volition', tense: 'past', modalPolarity: 'negative' }),
    note: 'was not going to。以前は否定が消えて "was going to" になっていた',
  },
  {
    name: 'モダリティ: 迂言形式 + 完了相（had to have）',
    ast: decl(eatApple(), { modal: 'obligation', tense: 'past', aspect: 'perfect' }),
  },
  {
    name: 'モダリティ: 動詞否定',
    ast: decl(eatApple(), { modal: 'ability', polarity: 'negative' }),
  },
  {
    name: 'モダリティ: モダリティ否定',
    ast: decl(eatApple(), { modal: 'obligation', modalPolarity: 'negative' }),
    note:
      '日本語はモダリティ自体が否定を担うため、動詞否定（polarity）と' +
      'モダリティ否定（modalPolarity）を表層で区別しない',
  },
  {
    name: 'モダリティ: モダリティ否定（permission）',
    ast: decl(eatApple(), { modal: 'permission', modalPolarity: 'negative' }),
  },
  {
    name: 'モダリティ: 進行相',
    ast: decl(eatApple(), { modal: 'ability', aspect: 'progressive' }),
    note: '日本語はテ形 + いる を土台にモダリティを付ける',
  },
  {
    name: 'モダリティ: 完了相',
    ast: decl(eatApple(), { modal: 'ability', aspect: 'perfect' }),
    note: '日本語では完了相は過去と同形',
  },
  {
    name: 'モダリティ: 進行相 + 過去',
    ast: decl(eatApple(), { modal: 'ability', aspect: 'progressive', tense: 'past' }),
  },
  {
    name: 'モダリティ: 迂言形式 + 進行相（had to）',
    ast: decl(eatApple(), { modal: 'obligation', tense: 'past', aspect: 'progressive' }),
    note: '迂言形式 had to が相と合成される（助動詞 + 連結語に分解しているため）',
  },
  {
    name: 'モダリティ: 迂言形式 + 進行相（was going to）',
    ast: decl(eatApple(), { modal: 'volition', tense: 'past', aspect: 'progressive' }),
    note: '迂言形式 was going to が相と合成される',
  },
  {
    name: 'モダリティ: 義務の否定 + 進行相',
    ast: decl(eatApple(), {
      modal: 'obligation',
      tense: 'past',
      aspect: 'progressive',
      modalPolarity: 'negative',
    }),
    note: "義務のモダリティ否定 didn't have to も相と合成される",
  },
];

// ============================================
// 名詞句
// ============================================
const nounPhrases: RenderCase[] = [
  {
    name: '名詞句: 定冠詞',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple', { det: 'the' }))])),
  },
  {
    name: '名詞句: 不定冠詞 + 母音（a → an）',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple', { det: 'a' }))])),
  },
  {
    name: '名詞句: 指示詞',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple', { det: 'this' }))])),
  },
  {
    name: '名詞句: 所有格',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple', { det: 'my' }))])),
  },
  {
    name: '名詞句: 限定詞なし（可算名詞の単数）',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple'))])),
    note:
      '可算名詞の単数には限定詞が必須。DET ブロックを繋がずに接続できてしまうため、' +
      '欠けていることを ___ で示す（必須スロットの欠損を示す既存の慣習にならう）。' +
      '黙って a を補うとブロック上に無いものが出力に現れ WYSIWYG が崩れるため。',
  },
  {
    name: '名詞句: 限定詞なし（複数形は正当）',
    ast: decl(
      vp('eat', [arg('agent', I()), arg('patient', noun('apple', { number: 'plural' }))])
    ),
  },
  {
    name: '名詞句: 限定詞なし（不可算は正当）',
    ast: decl(vp('drink', [arg('agent', I()), arg('patient', noun('water'))])),
  },
  {
    name: '名詞句: 限定詞なし（固有名詞は正当）',
    ast: decl(vp('see', [arg('experiencer', I()), arg('stimulus', noun('John'))])),
  },
  {
    name: '名詞句: 複数形',
    ast: decl(
      vp('eat', [arg('agent', I()), arg('patient', noun('apple', { number: 'plural' }))])
    ),
  },
  {
    name: '名詞句: 形容詞1つ',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'a', adjectives: ['red'] })),
      ])
    ),
  },
  {
    name: '名詞句: 比較級（-er 型）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'the', adjectives: [{ lemma: 'big', grade: 'comparative' }] })),
      ])
    ),
  },
  {
    name: '名詞句: 最上級（-est 型）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'the', adjectives: [{ lemma: 'big', grade: 'superlative' }] })),
      ])
    ),
  },
  {
    name: '名詞句: 比較級（more 型）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'the', adjectives: [{ lemma: 'beautiful', grade: 'comparative' }] })),
      ])
    ),
    note: '規則からは導出できないので辞書の comparative を引く',
  },
  {
    name: '名詞句: 比較級（不規則）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'the', adjectives: [{ lemma: 'good', grade: 'comparative' }] })),
      ])
    ),
  },
  {
    name: '名詞句: 形容詞2つ',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { det: 'a', adjectives: ['big', 'red'] })),
      ])
    ),
  },
  {
    name: '名詞句: preDeterminer（all）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { preDet: 'all', det: 'the', number: 'plural' })),
      ])
    ),
  },
  {
    name: '名詞句: postDeterminer（many）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', noun('apple', { postDet: 'many', number: 'plural' })),
      ])
    ),
  },
  {
    name: '名詞句: 前置詞句修飾（the apple on the table）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg(
          'patient',
          noun('apple', {
            det: 'the',
            prepModifier: pp('on', noun('table', { det: 'the' })),
          })
        ),
      ])
    ),
  },
  {
    name: '名詞句: 代名詞（3人称単数）',
    ast: decl(vp('eat', [arg('agent', he()), arg('patient', anApple())])),
  },
  {
    name: '名詞句: 目的格への格変化',
    ast: decl(vp('see', [arg('experiencer', I()), arg('stimulus', pron('he'))])),
  },
];

// ============================================
// 動詞句
// ============================================
const verbPhrases: RenderCase[] = [
  { name: '動詞句: 自動詞（run）', ast: decl(vp('run', [arg('agent', I())])) },
  { name: '動詞句: 他動詞（eat）', ast: decl(eatApple()) },
  {
    name: '動詞句: 二重目的語（give）',
    ast: decl(
      vp('give', [
        arg('agent', he()),
        arg('theme', noun('apple', { det: 'a', adjectives: ['green'] })),
        arg('recipient', pron('I')),
      ])
    ),
    note: '意味構造は agent/theme/recipient、表層順は recipient → theme',
  },
  {
    name: '動詞句: 繋辞（be + ナ形容詞）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('happy'))])),
    note: '日本語は語幹 + である →「私は幸せである」',
  },
  {
    name: '動詞句: 繋辞（be + 比較級）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('big', undefined, 'comparative'))])),
  },
  {
    name: '動詞句: 繋辞（be + 最上級）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('big', undefined, 'superlative'))])),
    note: '最上級は述語位置でも定冠詞を伴う（"I am the biggest."）',
  },
  {
    name: '動詞句: 繋辞（be + イ形容詞）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('sad'))])),
    note: '日本語は繋辞を付けず形容詞自体が活用する →「私は悲しい」',
  },
  {
    name: '動詞句: 繋辞（be + イ形容詞・過去）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('sad'))]), { tense: 'past' }),
  },
  {
    name: '動詞句: 繋辞（be + イ形容詞・否定）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('sad'))]), {
      polarity: 'negative',
    }),
  },
  {
    name: '動詞句: 繋辞（be + イ形容詞・過去否定）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('sad'))]), {
      tense: 'past',
      polarity: 'negative',
    }),
  },
  {
    name: '動詞句: 繋辞（be + ナ形容詞・過去否定）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('happy'))]), {
      tense: 'past',
      polarity: 'negative',
    }),
  },
  {
    name: '動詞句: 繋辞（be + ノ形容詞）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('true'))])),
    note: '「〜の」もナ形容詞と同じく語幹 + である',
  },
  {
    name: '動詞句: 繋辞（be + 形容詞 + 程度副詞）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('happy', 'very'))])),
    note:
      'AdjectivePhraseNode.degree は astGenerator が生成しないため現状 UI からは到達不能だが、' +
      '3つのレンダラー（英語 / 日本語 / LinguaScript）すべてが扱えるようにしてある。' +
      '程度副詞ブロックを追加すればそのまま動く。',
  },
  {
    name: '動詞句: 繋辞（be + 形容詞 + モダリティ）',
    ast: decl(vp('be', [arg('theme', I()), arg('attribute', adjP('happy'))]), {
      modal: 'ability',
    }),
    note: 'モダリティがある場合は「である」経路にフォールバックする',
  },
  {
    name: '動詞句: 繋辞以外の形容詞（seem）',
    ast: decl(vp('seem', [arg('theme', I()), arg('attribute', adjP('happy'))])),
    note: 'be 以外は renderFiller() 経由で連体形が使われる',
  },
  {
    name: '動詞句: 繋辞（be + 名詞）',
    ast: decl(vp('be', [arg('theme', he()), arg('attribute', noun('teacher', { det: 'a' }))])),
  },
  {
    name: '動詞句: 様態副詞',
    ast: decl(vp('run', [arg('agent', I())], { adverbs: [adv('quickly', 'manner')] })),
  },
  {
    name: '動詞句: 頻度副詞',
    ast: decl(vp('run', [arg('agent', I())], { adverbs: [adv('often', 'frequency')] })),
  },
  {
    name: '動詞句: 頻度副詞 + 否定',
    ast: decl(vp('run', [arg('agent', I())], { adverbs: [adv('often', 'frequency')] }), {
      polarity: 'negative',
    }),
  },
  {
    name: '動詞句: 場所副詞',
    ast: decl(vp('run', [arg('agent', I())], { adverbs: [adv('here', 'place')] })),
  },
  {
    name: '動詞句: 時間副詞',
    ast: decl(vp('run', [arg('agent', I())], { adverbs: [adv('today', 'time')] })),
  },
  {
    name: '動詞句: 前置詞句（go to the park）',
    ast: decl(
      vp('go', [arg('agent', I())], { pps: [pp('to', noun('park', { det: 'the' }))] })
    ),
  },
];

// ============================================
// 等位接続
// ============================================
const coordination: RenderCase[] = [
  {
    name: '等位接続: NP and',
    ast: decl(
      vp('eat', [
        arg('agent', coordNP('and', [pron('I'), noun('father', { det: 'my' })])),
        arg('patient', anApple()),
      ])
    ),
  },
  {
    name: '等位接続: NP or',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg('patient', coordNP('or', [noun('apple', { det: 'an' }), noun('orange', { det: 'an' })])),
      ])
    ),
  },
  {
    name: '等位接続: NP 入れ子（or(and(A, B), C)）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg(
          'patient',
          coordNP('or', [
            coordNP('and', [noun('apple', { det: 'an' }), noun('orange', { det: 'an' })]),
            noun('banana', { det: 'a' }),
          ])
        ),
      ])
    ),
  },
  {
    name: '等位接続: VP and（同一主語 → 主語省略）',
    ast: decl(
      coordVp('and', [vp('eat', [arg('agent', I())]), vp('drink', [arg('agent', I())])])
    ),
  },
  {
    name: '等位接続: VP or',
    ast: decl(
      coordVp('or', [vp('eat', [arg('agent', I())]), vp('drink', [arg('agent', I())])])
    ),
  },
  {
    name: '等位接続: VP（異なる主語）',
    ast: decl(
      coordVp('and', [
        vp('eat', [arg('agent', I())]),
        vp('run', [arg('agent', noun('father', { det: 'my' }))]),
      ])
    ),
  },
  {
    name: '等位接続: VP + 個別の否定',
    ast: decl(
      coordVp('and', [
        vp('eat', [arg('agent', I())], { polarity: 'negative' }),
        vp('drink', [arg('agent', I())]),
      ])
    ),
  },
  {
    name: '等位接続: 選択疑問（?which）',
    ast: sentence(
      clause(
        vp('drink', [
          arg('agent', pron('you')),
          arg('patient', coordNP('or', [noun('tea'), noun('coffee')], { isChoiceQuestion: true })),
        ])
      ),
      { sentenceType: 'interrogative' }
    ),
  },
];

// ============================================
// Logic Extension（命題論理）
//
// 日本語は AND=かつ / OR=または / NOT=〜ということはない /
// IF=〜ならば / BECAUSE=〜ので（原因が先）で表現する。
// ============================================
const logic: RenderCase[] = [
  {
    name: 'Logic: AND',
    ast: sentence(
      clause(
        vp('eat', [arg('agent', I())], {
          logicOp: { operator: 'AND', rightOperand: vp('drink', [arg('agent', I())]) },
        })
      ),
      { sentenceType: 'fact' }
    ),
  },
  {
    name: 'Logic: OR',
    ast: sentence(
      clause(
        vp('eat', [arg('agent', I())], {
          logicOp: { operator: 'OR', rightOperand: vp('drink', [arg('agent', I())]) },
        })
      ),
      { sentenceType: 'fact' }
    ),
  },
  {
    name: 'Logic: NOT',
    ast: sentence(
      clause(
        vp('eat', [arg('agent', I())], {
          logicOp: { operator: 'NOT' },
        })
      ),
      { sentenceType: 'fact' }
    ),
  },
  {
    name: 'Logic: IF',
    ast: sentence(
      clause(
        vp('run', [arg('agent', I())], {
          logicOp: { operator: 'IF', rightOperand: vp('eat', [arg('agent', I())]) },
        })
      ),
      { sentenceType: 'fact' }
    ),
  },
  {
    name: 'Logic: BECAUSE',
    ast: sentence(
      clause(
        vp('run', [arg('agent', I())], {
          logicOp: { operator: 'BECAUSE', rightOperand: vp('eat', [arg('agent', I())]) },
        })
      ),
      { sentenceType: 'fact' }
    ),
    note: '英語は結果が先（Q because P）、日本語は原因が先（Pので、Q）',
  },
  {
    name: 'Logic: 入れ子 AND(NOT(P), Q)',
    ast: sentence(
      clause(
        vp('eat', [arg('agent', I())], {
          logicOp: {
            operator: 'AND',
            leftOperand: vp('eat', [arg('agent', I())], { logicOp: { operator: 'NOT' } }),
            rightOperand: vp('drink', [arg('agent', I())]),
          },
        })
      ),
      { sentenceType: 'fact' }
    ),
  },
  {
    name: 'Logic: De Morgan NOT(OR(P, Q))',
    ast: sentence(
      clause(
        vp('eat', [arg('agent', I())], {
          logicOp: {
            operator: 'NOT',
            leftOperand: vp('eat', [arg('agent', I())], {
              logicOp: { operator: 'OR', rightOperand: vp('drink', [arg('agent', I())]) },
            }),
          },
        })
      ),
      { sentenceType: 'fact' }
    ),
    note: '英語は neither P nor Q、日本語は「PということもQということもない」',
  },
];

// ============================================
// 日本語レンダラー固有
// ============================================
const japaneseSpecific: RenderCase[] = [
  {
    name: '日本語: 格助詞（が/を）',
    ast: decl(vp('eat', [arg('agent', he()), arg('patient', anApple())])),
  },
  {
    name: '日本語: テ形接続（食べて飲む）',
    ast: decl(
      coordVp('and', [vp('eat', [arg('agent', I())]), vp('drink', [arg('agent', I())])])
    ),
  },
  {
    name: '日本語: ないで形（食べないで飲む）',
    ast: decl(
      coordVp('and', [
        vp('eat', [arg('agent', I())], { polarity: 'negative' }),
        vp('drink', [arg('agent', I())]),
      ])
    ),
  },
  {
    name: '日本語: De Morgan（節レベル否定）',
    ast: decl(
      coordVp('and', [vp('eat', [arg('agent', I())]), vp('drink', [arg('agent', I())])]),
      { polarity: 'negative' }
    ),
  },
  {
    name: '日本語: 前置詞 → 後置詞（公園に行く）',
    ast: decl(vp('go', [arg('agent', I())], { pps: [pp('to', noun('park', { det: 'the' }))] })),
  },
  {
    name: '日本語: 名詞の前置詞句修飾（テーブルの上のりんご）',
    ast: decl(
      vp('eat', [
        arg('agent', I()),
        arg(
          'patient',
          noun('apple', { det: 'the', prepModifier: pp('on', noun('table', { det: 'the' })) })
        ),
      ])
    ),
  },
  {
    name: '日本語: 否定限定詞 no',
    ast: decl(vp('eat', [arg('agent', I()), arg('patient', noun('apple', { det: 'no' }))])),
    note: 'KNOWN ISSUE: TODO.md「否定限定詞（no, neither）の日本語対応」が未実装',
  },
];

// ============================================
// 全ケース
// ============================================
export const allCases: { group: string; cases: RenderCase[] }[] = [
  { group: '文型', cases: sentenceTypes },
  { group: '時制×相', cases: tenseAspect },
  { group: '否定', cases: negation },
  { group: 'モダリティ', cases: modality },
  { group: '名詞句', cases: nounPhrases },
  { group: '動詞句', cases: verbPhrases },
  { group: '等位接続', cases: coordination },
  { group: 'Logic Extension', cases: logic },
  { group: '日本語固有', cases: japaneseSpecific },
];
