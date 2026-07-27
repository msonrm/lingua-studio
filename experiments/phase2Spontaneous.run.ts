/**
 * Phase 2-F: 自発的な検出（対抗手段F の公正な検証）
 *
 * Phase 1 は「解釈は何通りか」と直接聞いた。18/18 検出できたが、
 * **現実の使用で誰もそんな聞き方はしない**。ただ文を渡して仕事をさせる。
 *
 * そこが争点になる。
 *
 * - AI が自発的に「曖昧です」と指摘する → 聞き返せば済む。LinguaScript は不要
 * - 黙って1つの読みを選ぶ → 検出**能力**はあっても**発動**しない。曖昧さは静かに失われる
 *
 * 事前登録した判定では「F が B と同等 → 不要」としている。
 * Fを最も有利な形（直接質問）でなく、現実的な形で測る。
 *
 * 実行: npx vitest run --config vitest.experiments.config.ts experiments/phase2Spontaneous.run.ts
 */

import { it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

interface Phase1Result {
  surface: string;
  cause: string;
  intendedReadings: string[];
}

/**
 * 現実的なタスク
 *
 * 翻訳は**必ずどちらかの読みに倒す**必要がある作業なので、
 * 黙って選ぶか指摘するかがはっきり出る。曖昧さについては一切触れない。
 */
function taskPrompt(sentence: string): string {
  return [
    'Translate the following English sentence into Japanese.',
    '',
    sentence,
  ].join('\n');
}

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

/**
 * 応答が曖昧さに言及しているか
 *
 * 判定は語で行う。訳文だけを返したなら黙って選んだということ。
 */
function mentionsAmbiguity(response: string): boolean {
  return /曖昧|あいまい|多義|解釈|ambiguous|ambiguity|two readings|どちら|複数の意味|係り|かかり/i.test(
    response
  );
}

it('Phase 2-F: 黙って選ぶか、指摘するか', () => {
  const phase1: Phase1Result[] = JSON.parse(
    readFileSync('experiments/out/phase1.json', 'utf-8')
  );

  const results = phase1.map((p, i) => {
    const raw = askClaude(taskPrompt(p.surface));
    const flagged = raw !== null && mentionsAmbiguity(raw);
    // eslint-disable-next-line no-console
    console.log(
      `[${i + 1}/${phase1.length}] ${p.cause} ${flagged ? '指摘した' : '黙って選んだ'} :: ${p.surface}`
    );
    return { surface: p.surface, cause: p.cause, flagged, raw, failed: raw === null };
  });

  mkdirSync('experiments/out', { recursive: true });
  writeFileSync('experiments/out/phase2f.json', JSON.stringify(results, null, 1));

  const byCause = new Map<string, { n: number; hit: number }>();
  for (const r of results) {
    const e = byCause.get(r.cause) ?? { n: 0, hit: 0 };
    e.n++;
    if (r.flagged) e.hit++;
    byCause.set(r.cause, e);
  }
  writeFileSync(
    'experiments/out/phase2f-summary.json',
    JSON.stringify(
      {
        total: results.length,
        failed: results.filter(r => r.failed).length,
        flagged: results.filter(r => r.flagged).length,
        byCause: Object.fromEntries([...byCause].map(([k, v]) => [k, `${v.hit}/${v.n}`])),
      },
      null,
      2
    )
  );
});
