/**
 * Phase 0: 曖昧さの棚卸し
 *
 * AST を機械的に列挙し、英語にレンダリングして**同じ英語になる相異なる AST の組**を集める。
 * 衝突した組が、英語では表現し分けられない曖昧さである。
 *
 * 曖昧な文を手で選ぶと恣意的になるので選ばない。「意図した読み」はブロック構造から
 * 決まるので後付けできない。
 *
 * 日本語でも同じ集計をする。「曖昧さは構造か語の多義性にある」なら、
 * どの構造がどちらの言語で潰れるかが見えるはず。
 *
 * 実行: npx vitest run --config vitest.experiments.config.ts
 */

import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import type { SentenceNode, PrepositionalPhraseNode, NounPhraseNode } from '../src/types/schema';
import { renderToEnglishWithLogs } from '../src/renderer/english/renderer';
import { renderToJapanese } from '../src/renderer/japanese';
import { renderToLinguaScript } from '../src/renderer/linguaScriptRenderer';
import { noun, pron, coordNP, pp, arg, vp, coordVp, clause, sentence } from '../src/test/builders';

// ============================================
// 列挙する構造の軸
// ============================================

type Axis<T> = { name: string; values: { key: string; value: T }[] };

const ax = <T,>(name: string, values: Record<string, T>): Axis<T> => ({
  name,
  values: Object.entries(values).map(([key, value]) => ({ key, value })),
});

const I = () => pron('I');
const thePark = () => noun('park', { det: 'the' });
const theKnife = () => noun('knife', { det: 'the' });

/** PP の係り先 */
const ppAttachment = ax<{
  vpPps: PrepositionalPhraseNode[];
  objectOf: (np: NounPhraseNode) => NounPhraseNode;
}>('pp', {
  none: { vpPps: [], objectOf: np => np },
  'verb:in_park': { vpPps: [pp('in', thePark())], objectOf: np => np },
  'noun:in_park': {
    vpPps: [],
    objectOf: np => ({ ...np, prepModifier: pp('in', thePark()) }),
  },
  'verb:with_knife': { vpPps: [pp('with', theKnife())], objectOf: np => np },
  'noun:with_knife': {
    vpPps: [],
    objectOf: np => ({ ...np, prepModifier: pp('with', theKnife()) }),
  },
});

/** 等位接続の位置 */
type CoordShape = 'none' | 'vp-and' | 'vp-or' | 'np-and' | 'np-or' | 'np-nested-and-or' | 'np-nested-or-and' | 'vp-3-and';
const coordination = ax<CoordShape>('coord', {
  none: 'none',
  'vp-and': 'vp-and',
  'vp-or': 'vp-or',
  'np-and': 'np-and',
  'np-or': 'np-or',
  'np-nest-a': 'np-nested-and-or',
  'np-nest-b': 'np-nested-or-and',
  'vp-3-and': 'vp-3-and',
});

/** 否定の作用域 */
type NegShape = 'none' | 'clause' | 'vp-left' | 'vp-right' | 'modal';
const negation = ax<NegShape>('neg', {
  none: 'none',
  clause: 'clause',
  'vp-left': 'vp-left',
  'vp-right': 'vp-right',
  modal: 'modal',
});

/** 限定詞 */
const determiner = ax<{ det?: string; preDet?: string; number?: 'singular' | 'plural' }>('det', {
  'a': { det: 'an' },
  'the': { det: 'the' },
  'no': { det: 'no' },
  'all-plural': { preDet: 'all', det: 'the', number: 'plural' },
  'plural': { number: 'plural' },
});

/** 時制・相・モダリティ */
const tam = ax<{ tense?: 'past' | 'present' | 'future'; aspect?: 'simple' | 'progressive' | 'perfect'; modal?: 'ability' | 'obligation' }>('tam', {
  'pres-simple': { tense: 'present', aspect: 'simple' },
  'past-simple': { tense: 'past', aspect: 'simple' },
  'pres-prog': { tense: 'present', aspect: 'progressive' },
  'pres-perf': { tense: 'present', aspect: 'perfect' },
  'can': { tense: 'present', aspect: 'simple', modal: 'ability' },
  'must': { tense: 'present', aspect: 'simple', modal: 'obligation' },
});

// ============================================
// AST の組み立て
// ============================================

function buildAst(
  ppKey: string,
  coordKey: string,
  negKey: string,
  detKey: string,
  tamKey: string
): SentenceNode | null {
  const ppv = ppAttachment.values.find(v => v.key === ppKey)!.value;
  const coord = coordination.values.find(v => v.key === coordKey)!.value;
  const neg = negation.values.find(v => v.key === negKey)!.value;
  const det = determiner.values.find(v => v.key === detKey)!.value;
  const t = tam.values.find(v => v.key === tamKey)!.value;

  const obj = () => ppv.objectOf(noun('apple', det));
  const obj2 = () => noun('orange', det);

  const eat = (polarity?: 'negative', patient = obj()) =>
    vp('eat', [arg('agent', I()), arg('patient', patient)], {
      pps: ppv.vpPps,
      ...(polarity ? { polarity } : {}),
    });
  const drink = (polarity?: 'negative') =>
    vp('drink', [arg('agent', I()), arg('patient', noun('water'))], {
      ...(polarity ? { polarity } : {}),
    });
  const run = () => vp('run', [arg('agent', I())]);

  // 等位接続の形を決める
  let verbPhrase;
  switch (coord) {
    case 'none':
      verbPhrase = eat(neg === 'vp-left' ? 'negative' : undefined);
      break;
    case 'vp-and':
    case 'vp-or':
      verbPhrase = coordVp(coord === 'vp-and' ? 'and' : 'or', [
        eat(neg === 'vp-left' ? 'negative' : undefined),
        drink(neg === 'vp-right' ? 'negative' : undefined),
      ]);
      break;
    case 'vp-3-and':
      verbPhrase = coordVp('and', [
        eat(neg === 'vp-left' ? 'negative' : undefined),
        drink(neg === 'vp-right' ? 'negative' : undefined),
        run(),
      ]);
      break;
    case 'np-and':
    case 'np-or':
      verbPhrase = eat(
        neg === 'vp-left' ? 'negative' : undefined,
        coordNP(coord === 'np-and' ? 'and' : 'or', [obj(), obj2()]) as never
      );
      break;
    case 'np-nested-and-or':
      verbPhrase = eat(
        neg === 'vp-left' ? 'negative' : undefined,
        coordNP('and', [obj(), coordNP('or', [obj2(), noun('banana', det)])]) as never
      );
      break;
    case 'np-nested-or-and':
      verbPhrase = eat(
        neg === 'vp-left' ? 'negative' : undefined,
        coordNP('or', [coordNP('and', [obj(), obj2()]), noun('banana', det)]) as never
      );
      break;
    default:
      return null;
  }

  // VP 個別の否定は等位接続がないと意味がない
  if ((neg === 'vp-left' || neg === 'vp-right') && coord === 'none' && neg === 'vp-right') return null;
  // modal 否定はモダリティがないと意味がない
  if (neg === 'modal' && !t.modal) return null;

  return sentence(
    clause(verbPhrase, {
      tense: t.tense,
      aspect: t.aspect,
      ...(t.modal ? { modal: t.modal } : {}),
      ...(neg === 'clause' ? { polarity: 'negative' as const } : {}),
      ...(neg === 'modal' ? { modalPolarity: 'negative' as const } : {}),
    })
  );
}

// ============================================
// 実行
// ============================================

/**
 * 縮約を展開してから比較する
 *
 * レンダラーは modal 否定を "can't"、節否定を "can not" と書き分けるが、
 * 英語として "I can't eat" と "I can not eat" は同義で、縮約は作用域の signal ではない。
 * 文字列のまま比べると**偽の区別**を数えてしまい、英語の曖昧さを過小評価する。
 */
function normalizeEnglish(s: string): string {
  return s
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/\b(\w+)n't\b/g, '$1 not')
    .replace(/\s+/g, ' ');
}

interface Rendered {
  id: string;
  ls: string;
  en: string;
  /** 縮約を展開したもの。衝突判定はこちらで行う */
  enNorm: string;
  ja: string;
}

it('Phase 0: 衝突を集める', () => {
  const rendered: Rendered[] = [];
  const seenLs = new Set<string>();
  let attempted = 0;
  let failed = 0;

  for (const p of ppAttachment.values) {
    for (const c of coordination.values) {
      for (const n of negation.values) {
        for (const d of determiner.values) {
          for (const t of tam.values) {
            attempted++;
            const id = `${p.key}|${c.key}|${n.key}|${d.key}|${t.key}`;
            let ast: SentenceNode | null;
            try {
              ast = buildAst(p.key, c.key, n.key, d.key, t.key);
            } catch {
              failed++;
              continue;
            }
            if (!ast) continue;

            try {
              const ls = renderToLinguaScript(ast);
              // AST が同一なら重複。LinguaScript を正準形として使う
              if (seenLs.has(ls)) continue;
              seenLs.add(ls);
              const en = renderToEnglishWithLogs(ast).output;
              rendered.push({ id, ls, en, enNorm: normalizeEnglish(en), ja: renderToJapanese(ast) });
            } catch {
              failed++;
            }
          }
        }
      }
    }
  }

  // 同じ表層になる相異なる AST を集める
  const groupBy = (key: 'enNorm' | 'ja') => {
    const map = new Map<string, Rendered[]>();
    for (const r of rendered) {
      if (!map.has(r[key])) map.set(r[key], []);
      map.get(r[key])!.push(r);
    }
    return [...map.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([surface, items]) => ({ surface, count: items.length, items }))
      .sort((a, b) => b.count - a.count);
  };

  const enCollisions = groupBy('enNorm');
  const jaCollisions = groupBy('ja');

  const summary = {
    attempted,
    failed,
    distinctAsts: rendered.length,
    en: {
      distinctSurfaces: new Set(rendered.map(r => r.enNorm)).size,
      collisionGroups: enCollisions.length,
      astsInvolved: enCollisions.reduce((s, g) => s + g.count, 0),
    },
    ja: {
      distinctSurfaces: new Set(rendered.map(r => r.ja)).size,
      collisionGroups: jaCollisions.length,
      astsInvolved: jaCollisions.reduce((s, g) => s + g.count, 0),
    },
  };

  mkdirSync('experiments/out', { recursive: true });
  writeFileSync('experiments/out/summary.json', JSON.stringify(summary, null, 2));
  writeFileSync('experiments/out/collisions-en.json', JSON.stringify(enCollisions, null, 1));
  writeFileSync('experiments/out/collisions-ja.json', JSON.stringify(jaCollisions, null, 1));
  writeFileSync('experiments/out/all.json', JSON.stringify(rendered, null, 1));
});
