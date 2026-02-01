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

## Key Files

- `src/blocks/definitions.ts` - Blockly ブロック定義
- `src/blocks/det-rules-en.ts` - 限定詞ルール
- `src/renderer/english/` - 英語レンダラー
- `src/renderer/japanese/` - 日本語レンダラー
- `src/locales/` - ローカライズ

## Documentation

- `TODO.md` - 実装予定・進行中のタスク
- `CHANGELOG.md` - 変更履歴

機能実装完了時は TODO.md と CHANGELOG.md の両方を更新してください。
