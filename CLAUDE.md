# Claude Code Project Instructions

## Session Start Checklist

**重要**: 各セッション開始時に必ず以下を実行してください：

```bash
git fetch origin main && git merge origin/main --no-edit
```

これにより、main ブランチの最新変更を取り込んでから作業を開始できます。

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
