# TODO

## Bugs

- [ ] 場所副詞（here, there）を一時削除中
  - 問題: 限定詞・前置詞が付けられてしまう（例: "I go to the here."）
  - 対応: place_block から削除済み
  - 将来: 独立ブロック化、または determiner で副詞選択時に制約して復活

## Future Enhancements

### Grammar & Syntax
- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 不定代名詞 + 形容詞対応 ("something good", "someone important")
  - 現状: 代名詞に形容詞を付けてもコンパイル時に無視される
  - 修正案: 不定代名詞の場合のみ形容詞を後置でレンダリング
- [ ] 疑問文対応
- [ ] Modal（法助動詞）wrapper (can, may, must, should)

### Coordination
- [ ] 否定とのスコープ相互作用（De Morgan）
  - "I don't eat apples and oranges" の解釈曖昧性
- [ ] 等位接続の構造的曖昧性
  - "I saw the man with the telescope and the camera"

### UI & Localization
- [ ] ブロックラベルの切り替え機能（言語学的 / カジュアル / 日本語）
- [ ] 日本語レンダラー
- [ ] Grammar Console（文法判断のログ表示）

### LinguaScript Editor
- [ ] Monaco Editor 統合
- [ ] シンタックスハイライト
- [ ] 辞書連携オートコンプリート
- [ ] 双方向同期（Blocks ↔ LinguaScript）

## Completed

### Core Features
- [x] 統合限定詞ブロック（PRE / CENTRAL / POST の3スロット）
- [x] 双方向制約チェック + 無効オプションに「×」マーク表示
- [x] 固有名詞・不可算名詞に基づく限定詞制約
- [x] 前置詞ブロック（動詞修飾用 / 名詞修飾用）
- [x] 等位接続ブロック（AND/OR）+ 入れ子対応
- [x] 主語の数の一致（subject-verb agreement）
- [x] 否定文対応（NOT wrapper）
- [x] 頻度副詞・様態副詞
- [x] LinguaScriptレンダラー
- [x] 複数SENTENCEブロックのサポート

### Bug Fixes
- [x] "The a something runs." - レガシーquantifierフィールドを削除し、限定詞システムに統合
- [x] "a few" の組み合わせが禁止されていた問題を修正
- [x] 副詞の語順（"has always run"）
- [x] be動詞の人称活用
- [x] 固有名詞への冠詞付与防止

### Cleanup
- [x] レガシーブロック削除（quantifier_block, determiner_block, noun_phrase, person_block, thing_block, adjective, adverb）
