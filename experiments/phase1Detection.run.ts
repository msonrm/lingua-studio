/**
 * Phase 1: 天井の測定
 *
 * Phase 0 で見つけた衝突（英語では表現し分けられない構造）について、
 * **英語だけ**を与えて LLM が曖昧さに気づくかを測る。
 *
 * 測るのは「どちらの読みか」ではなく**検出**である。
 * 均衡した曖昧さでは「どちらか」は文脈なしには決まらず、当てずっぽうで50%になる。
 * 一方、AI が曖昧だと気づけるなら**聞き返せば済む**ので、
 * 人間が LinguaScript を書く理由が消える。これが最も強い対抗手段。
 *
 * 実行: npx vitest run --config vitest.experiments.config.ts -t "Phase 1"
 */

import { it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

interface Collision {
  surface: string;
  count: number;
  items: { id: string; ls: string; en: string; enNorm: string; ja: string }[];
}

/** 衝突の原因になっている軸 */
const AXES = ['pp', 'coord', 'neg', 'det', 'tam'];
function cause(group: Collision): string {
  const keys = group.items.map(i => i.id.split('|'));
  return AXES.filter((_, i) => new Set(keys.map(k => k[i])).size > 1).join('+');
}

/**
 * 検出を問うプロンプト
 *
 * 誘導しないよう「曖昧ですか」とは聞かず、解釈の数を答えさせる。
 * 「1つ」と答えたら検出できていない。
 */
function detectionPrompt(sentence: string): string {
  return [
    'You are given one English sentence.',
    '',
    `Sentence: "${sentence}"`,
    '',
    'How many distinct structural interpretations does this sentence have?',
    'Consider only structural (syntactic/scope) readings, not word-sense differences.',
    '',
    'Answer in exactly this format, with no other text:',
    'COUNT: <a number>',
    'READINGS: <one short paraphrase per reading, separated by " | ">',
  ].join('\n');
}

/** 1回だけ再試行する。落ちた項目は null にして続行する（1件で全体を止めない） */
function askClaude(prompt: string): string | null {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return execFileSync('claude', ['-p', prompt], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 300_000,
      }).trim();
    } catch {
      // 再試行
    }
  }
  return null;
}

/** 衝突グループから、種類ごとに代表を選ぶ（同じ文型の重複を避ける） */
function pickSamples(groups: Collision[], perCause: number): Collision[] {
  const byCause = new Map<string, Collision[]>();
  for (const g of groups) {
    const c = cause(g);
    if (!byCause.has(c)) byCause.set(c, []);
    byCause.get(c)!.push(g);
  }

  const picked: Collision[] = [];
  for (const [, list] of byCause) {
    // 表層が短い順に、重複しない文型を拾う
    const sorted = [...list].sort((a, b) => a.surface.length - b.surface.length);
    const seenShape = new Set<string>();
    for (const g of sorted) {
      // 文型 = 語を落とした骨格。同じ骨格は1つだけ取る
      const shape = g.items[0].id.split('|').slice(1).join('|');
      if (seenShape.has(shape)) continue;
      seenShape.add(shape);
      picked.push(g);
      if (seenShape.size >= perCause) break;
    }
  }
  return picked;
}

it('Phase 1: 英語だけで曖昧さに気づくか', () => {
  const groups: Collision[] = JSON.parse(
    readFileSync('experiments/out/collisions-en.json', 'utf-8')
  );
  const samples = pickSamples(groups, 6);

  const results = samples.map((g, i) => {
    const raw = askClaude(detectionPrompt(g.surface));
    const m = raw?.match(/COUNT:\s*(\d+)/i);
    const count = m ? Number(m[1]) : null;
    const readings = raw?.match(/READINGS:\s*(.*)/is)?.[1]?.trim() ?? '';
    // eslint-disable-next-line no-console
    console.log(`[${i + 1}/${samples.length}] ${cause(g)} count=${count} :: ${g.surface}`);
    return {
      surface: g.surface,
      cause: cause(g),
      intendedReadings: g.items.map(it => it.ls),
      reportedCount: count,
      reportedReadings: readings,
      /** 2つ以上と答えれば検出できている */
      detected: count !== null && count >= 2,
      raw,
      failed: raw === null,
    };
  });

  mkdirSync('experiments/out', { recursive: true });
  writeFileSync('experiments/out/phase1.json', JSON.stringify(results, null, 1));

  const byCause = new Map<string, { n: number; hit: number }>();
  for (const r of results) {
    const e = byCause.get(r.cause) ?? { n: 0, hit: 0 };
    e.n++;
    if (r.detected) e.hit++;
    byCause.set(r.cause, e);
  }
  writeFileSync(
    'experiments/out/phase1-summary.json',
    JSON.stringify(
      {
        total: results.length,
        failed: results.filter(r => r.failed).length,
        detected: results.filter(r => r.detected).length,
        byCause: Object.fromEntries([...byCause].map(([k, v]) => [k, `${v.hit}/${v.n}`])),
      },
      null,
      2
    )
  );
});
