/**
 * レイヤーA: レンダラーのゴールデンテスト
 *
 * AST → 英語 / 日本語 / LinguaScript の3出力と、英語の導出ログをスナップショットで固定する。
 * DOM に依存しないため node 環境で動く。
 *
 * スナップショットは「正しい出力」ではなく「固定時点の出力」。
 * 意図的に出力を変えた場合は `npx vitest run -u` で更新し、差分をレビューすること。
 */

import { describe, it, expect } from 'vitest';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { renderToJapanese } from '../renderer/japanese';
import { renderToLinguaScript } from '../renderer/linguaScriptRenderer';
import type { TransformLog } from '../types/grammarLog';
import { allCases } from './cases';

/** 導出ログを1行ずつの文字列に畳む（スナップショットの可読性のため） */
function formatLogs(logs: TransformLog[]) {
  return logs.map(l => `${l.type} | ${l.from} → ${l.to} | rule=${l.rule} | trigger=${l.trigger}`);
}

describe.each(allCases)('$group', ({ cases }) => {
  it.each(cases)('$name', ({ ast }) => {
    const english = renderToEnglishWithLogs(ast);

    expect({
      en: english.output,
      ja: renderToJapanese(ast),
      ls: renderToLinguaScript(ast),
      logs: formatLogs(english.logs),
    }).toMatchSnapshot();
  });
});

describe('レンダラーの不変条件', () => {
  const flat = allCases.flatMap(g => g.cases);

  it.each(flat)('$name: 英語出力が空でない', ({ ast }) => {
    expect(renderToEnglishWithLogs(ast).output.length).toBeGreaterThan(0);
  });

  it.each(flat)('$name: 英語出力が句読点で終わる', ({ ast }) => {
    expect(renderToEnglishWithLogs(ast).output).toMatch(/[.?!]$/);
  });

  it.each(flat)('$name: renderToEnglish は決定的', ({ ast }) => {
    const first = renderToEnglishWithLogs(ast);
    const second = renderToEnglishWithLogs(ast);
    expect(second.output).toBe(first.output);
    expect(second.logs).toEqual(first.logs);
  });

  it.each(flat)('$name: renderToJapanese は決定的', ({ ast }) => {
    expect(renderToJapanese(ast)).toBe(renderToJapanese(ast));
  });

  it.each(flat)('$name: LinguaScript は括弧が釣り合う', ({ ast }) => {
    const ls = renderToLinguaScript(ast);
    let depth = 0;
    for (const ch of ls) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      expect(depth).toBeGreaterThanOrEqual(0);
    }
    expect(depth).toBe(0);
  });
});
