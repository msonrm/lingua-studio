/**
 * Phase 2-F の採点をやり直す
 *
 * 最初の採点は「曖昧」「解釈」などの語で判定したが、応答が触れているのが
 * **別の曖昧さ**（can の能力/許可、否定の焦点）であるケースを取りこぼしていた。
 * 「曖昧さに言及したか」ではなく「**意図した対立する読みに言及したか**」を測る必要がある。
 *
 * 正規表現では無理なので LLM に判定させる。判定基準は1つだけ、
 * かつ対立する読みを明示的に与えて推測させない。生の応答は保存してあるので人手で監査できる。
 *
 * 実行: npx vitest run --config vitest.experiments.config.ts experiments/phase2Judge.run.ts
 */

import { it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

interface Phase2Result {
  surface: string;
  cause: string;
  flagged: boolean;
  raw: string | null;
}

/** 各衝突が持つ「もう一方の読み」を自然言語で書く */
const ALTERNATIVE_READING: Record<string, string> = {
  pp: 'The prepositional phrase modifies the OBJECT NOUN rather than the verb — i.e. "the apples that are located in the park / that are with the knife", where the eating itself need not happen there.',
  neg: 'The modal takes scope OVER the negation — i.e. "I am able to refrain from eating" (it is possible for me not to eat), rather than "I am unable to eat".',
  'pp+neg':
    'EITHER (a) the prepositional phrase modifies the OBJECT NOUN rather than the verb, OR (b) the modal takes scope over the negation ("able to refrain from eating" rather than "unable to eat").',
};

function judgePrompt(sentence: string, response: string, alternative: string): string {
  return [
    'You are grading whether an assistant surfaced a specific alternative reading.',
    '',
    `ORIGINAL SENTENCE: "${sentence}"`,
    '',
    'ALTERNATIVE READING IN QUESTION:',
    alternative,
    '',
    "ASSISTANT'S RESPONSE:",
    '---',
    response,
    '---',
    '',
    "Did the assistant's response explicitly acknowledge the ALTERNATIVE READING above",
    'as a possible interpretation of the sentence?',
    '',
    'Mentioning some OTHER ambiguity (e.g. ability vs permission, politeness level,',
    'singular vs plural, focus of negation) does NOT count. It must be the reading described above.',
    '',
    'Answer with exactly one word: YES or NO',
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

it('Phase 2-F 再採点: 意図した読みに言及したか', () => {
  const phase2: Phase2Result[] = JSON.parse(readFileSync('experiments/out/phase2f.json', 'utf-8'));

  const results = phase2.map((p, i) => {
    if (!p.raw) return { ...p, surfacedAlternative: false, judgeRaw: null, failed: true };

    const verdict = askClaude(judgePrompt(p.surface, p.raw, ALTERNATIVE_READING[p.cause]));
    const yes = /^\s*YES/i.test(verdict ?? '');
    // eslint-disable-next-line no-console
    console.log(
      `[${i + 1}/${phase2.length}] ${p.cause} ${yes ? '言及あり' : '言及なし'} :: ${p.surface}`
    );
    return {
      surface: p.surface,
      cause: p.cause,
      /** 正規表現による粗い判定（参考） */
      regexFlagged: p.flagged,
      /** 意図した対立読みに言及したか */
      surfacedAlternative: yes,
      judgeRaw: verdict,
      failed: verdict === null,
    };
  });

  mkdirSync('experiments/out', { recursive: true });
  writeFileSync('experiments/out/phase2f-judged.json', JSON.stringify(results, null, 1));

  const byCause = new Map<string, { n: number; hit: number; regex: number }>();
  for (const r of results) {
    const e = byCause.get(r.cause) ?? { n: 0, hit: 0, regex: 0 };
    e.n++;
    if (r.surfacedAlternative) e.hit++;
    if ('regexFlagged' in r && r.regexFlagged) e.regex++;
    byCause.set(r.cause, e);
  }
  writeFileSync(
    'experiments/out/phase2f-judged-summary.json',
    JSON.stringify(
      {
        total: results.length,
        surfacedAlternative: results.filter(r => r.surfacedAlternative).length,
        byCause: Object.fromEntries(
          [...byCause].map(([k, v]) => [k, { 意図した読みに言及: `${v.hit}/${v.n}`, 正規表現の粗い判定: `${v.regex}/${v.n}` }])
        ),
      },
      null,
      2
    )
  );
});
