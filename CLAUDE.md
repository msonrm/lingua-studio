# Claude Code Project Instructions

## Session Start Checklist

各セッション開始時に以下を実行してください：

1. **必須**: main ブランチの最新を取得
   ```bash
   git fetch origin main && git merge origin/main --no-edit
   ```

2. **推奨**: 新機能実装・バグ修正の場合は `TODO.md` を確認
   - 実装予定・進行中のタスク
   - 設計方針・Deferred 項目

3. **任意**: 最近の変更を把握したい場合は `CHANGELOG.md` を確認

## Working Guidelines

### 実装前の確認

**指示に不明点がある場合は、必ず明確にしてから実装に進むこと。**

- 曖昧な要件は推測せず、質問する
- 複数の解釈が可能な場合は、選択肢を提示して確認する
- 大きな変更の場合は、実装方針を先に説明して承認を得る

### コード変更時の注意

- ファイルを読む前に編集しない
- 古いキャッシュに注意（必要に応じて再読み込み）
- ビルド確認後にコミット

## Project Overview

Lingua Studio は、英語文法を視覚的に学習するための Blockly ベースのツールです。

- **Block Editor**: Blockly による視覚的な文構築
- **LinguaScript**: AST のテキスト表現
- **English/Japanese Renderers**: AST から自然言語への変換

React 19 + TypeScript 5.9 + Vite 7 + Blockly 12。デプロイ先は Vercel。

## Commands

```bash
npm install
npm run dev         # 開発サーバー
npm run build       # tsc（型チェック）+ vite build
npm run preview     # ビルド結果のプレビュー

npm run check       # tsc --noEmit + eslint + vitest（コミット前はこれ）
npm test            # vitest run
npm run test:watch  # vitest（ウォッチ）
npm run lint        # eslint
npm run knip        # 未参照 export の棚卸し（現在0件。増やさないこと）
```

### テスト

`src/test/` に2層のゴールデンテストがある（計583テスト / 118スナップショット）。

| 層 | ファイル | 対象 |
|---|---|---|
| A | `renderers.test.ts` | AST → 英語 / 日本語 / LinguaScript / 導出ログ |
| B | `astGenerator.test.ts` | Blockly ブロック木 → AST |

- ケースは `cases.ts`（レイヤーA）とテストファイル内（レイヤーB）に表として定義。AST は `builders.ts`、ワークスペースは `workspace.ts` のヘルパーで組む
- **スナップショットは「正しい出力」ではなく「固定時点の出力」**。既知のバグも現状のまま固定してあり、`KNOWN ISSUE` / `KNOWN BUG` コメントが付いている
- 意図的に出力を変えたときは `npx vitest run -u` で更新し、**差分を必ずレビューする**
- ヘッドレス Blockly（`new Blockly.Workspace()`）が Node 環境で動くため、`Blockly.inject` なしで astGenerator を検証できる。ただし **Blockly はイベントを非同期にフラッシュする**ので、`determiner_unified` の限定詞自動補正など `onchange` 依存の挙動は `flushBlocklyEvents()` を待つ必要がある（`buildWorkspace()` は内部で待っている）

## Architecture

詳細は **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** を参照。要点のみ:

```
Blockly Workspace
  └─ generateMultipleAST()      renderer/astGenerator.ts
       └─ SentenceNode[]        types/schema.ts
            ├─ renderToEnglishWithLogs()   renderer/english/renderer.ts
            ├─ renderToJapanese()          renderer/japanese/renderer.ts
            └─ renderToLinguaScript()      renderer/linguaScriptRenderer.ts
```

レンダラーは **AST → 文字列の純関数**。英語・日本語は `BlocklyWorkspace.tsx` 内で生成、LinguaScript のみ `App.tsx` の `useMemo` で生成する（経路が1つだけ非対称）。

辞書は3層: `dictionary-core.ts`（言語非依存・valency）→ `dictionary-en.ts`（英語の語形）→ `dictionary-ext.ts`（ユーザー拡張・localStorage）。`findVerb()` 等がマージして返す。日本語は `renderer/japanese/lexicon.ts` が独自マッピングを持ち、この3層には接続していない。

## Key Files

- `src/blocks/` - Blockly ブロック定義41個 + ツールボックス。カテゴリ別に分割済み（`index.ts` が登録を集約）
- `src/blocks/det-rules-en.ts` - 限定詞ルール
- `src/renderer/astGenerator.ts` - ブロック木 → AST（`parseVerbChain` が426行）
- `src/renderer/english/` - 英語レンダラー
- `src/renderer/japanese/` - 日本語レンダラー
- `src/types/schema.ts` - AST スキーマ
- `src/locales/` - ローカライズ（en / ja / ja-hira × 290キー）

## Gotchas

作業前に把握しておくべき既知の罠:

- **`english/renderer.ts` の `tracker` はモジュールレベルの可変シングルトン**。`renderToEnglishWithLogs()` が毎回作り直すが、レンダリング中の全関数が暗黙に参照している。並行レンダリング不可
- **否定が2階層ある**: `ClauseNode.polarity`（節レベル）と `VerbPhraseNode.polarity`（VP 個別、等位接続内で使う）。両方が negative なら二重否定
- **ロケール切り替えはワークスペースを再マウントする**（`workspaceKey` を +1）。既存ブロックのラベルは動的更新できないため。切り替え前に `saveState()` で退避している
- **`blocks/index.ts` は副作用 import**。`import '../blocks'` した時点で全ブロックが登録される。import 順に意味がある（データ → ブロック定義 → 拡張 → ツールボックス）
- **`npm run knip` は0件を保つこと**。意図的に残す export には `/** @public 理由 */` を付ける（`knip.json` の `tags: ["-public"]` で除外される）。現在タグが付いているのは辞書モジュールの API（消すと辞書データが到達不能になる）と、Phase 4-1 で使う予定の `RenderContext` 一式のみ
- **等位接続は n項ツリー**。`ClauseNode.verbPhrase` は `VerbPhraseConjunct`（単一 or `CoordinatedVerbPhraseNode`）の union なので、`clause.verbPhrase.verb` のように直接読まず `isCoordinatedVerbPhrase()` で分岐すること
- **英語のカンマ・correlative は `english/coordination.ts` が構造から決める**。接続詞の並びから推測してはいけない（それが不要なカンマの原因だった）
- **`japanese/lexicon.ts` の `translateAdjective()` が返すのは連体形**（「幸せな」「悲しい」）。述語や連用修飾で使うときは `analyzeAdjective()` で語幹・連用形・活用型を取ること。そのまま繋げると「幸せなである」になる
- **`AdjectivePhraseNode.degree` は UI から到達不能**。`astGenerator` が生成せず、消費しているのは `linguaScriptRenderer` と日本語レンダラーのみ。英語レンダラーは未対応

## Documentation

- `TODO.md` - 実装予定・進行中のタスク
- `CHANGELOG.md` - 変更履歴
- `docs/ARCHITECTURE.md` - 内部構造リファレンス（データフロー・辞書・AST・技術的負債）
- `docs/REFACTORING-PLAN.md` - リファクタリング計画（Phase 0〜4）
- `LinguaScript-Grammar-Spec.md` - LinguaScript 文法仕様
- `linguascript-prolog-spec.md` - Prolog 表現仕様

機能実装完了時は TODO.md と CHANGELOG.md の両方を更新してください。
