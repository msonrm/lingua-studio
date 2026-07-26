/**
 * 初期ブロック仕様の検証
 *
 * `placeInitialBlocks()` 自体は SVG ワークスペース（`initSvg` / `render`）を要するため
 * Node 環境では実行できない。代わりに、配置されるブロック木の仕様 `INITIAL_BLOCKS` を
 * ヘッドレスで組み立て、期待どおりの文になることを確認する。
 *
 * 初回起動時にユーザーが最初に目にする画面なので、崩れたら気づけるようにしておく。
 */

import { describe, it, expect } from 'vitest';
import { INITIAL_BLOCKS } from '../blocks/initialWorkspace';
import { generateMultipleAST } from '../renderer/astGenerator';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { renderToJapanese } from '../renderer/japanese';
import { renderToLinguaScript } from '../renderer/linguaScriptRenderer';
import { buildWorkspace } from './workspace';

describe('初期ブロック', () => {
  it('"I eat an apple." を生成する', async () => {
    const ws = await buildWorkspace(INITIAL_BLOCKS);
    try {
      const asts = generateMultipleAST(ws);
      expect(asts).toHaveLength(1);

      // 限定詞 a は明示指定していない。determiner_unified の onchange が
      // 可算名詞を検出して自動補正した結果として付く。
      expect(renderToEnglishWithLogs(asts[0]).output).toBe('I eat an apple.');
      expect(renderToJapanese(asts[0])).toBe('私はりんごを食べる。');
      expect(renderToLinguaScript(asts[0])).toBe(
        "sentence(present+simple(eat(agent:'I, patient:noun(det:'a, head:'apple))))"
      );
    } finally {
      ws.dispose();
    }
  });
});
