# TODO

## Bugs

- [ ] "The a something runs." - プレースホルダー名詞にDET/QTYが重複適用される問題
  - 原因: 空のnounスロットに"something"がデフォルト設定され、ラッパーの出力と重複
  - 修正案: プレースホルダー時はラッパーの出力を抑制、または別のデフォルト処理

- [x] 副詞の語順が不自然（"has run always" → "has always run"）
  - 解決済み: Verb Modifiers (FREQ, MANNER) で副詞タイプ別配置を実装
    - 頻度副詞: 助動詞と本動詞の間 ("has always run")
    - 様態副詞: 文末 ("runs quickly")

- [ ] be動詞の人称活用が不完全（"I is" → "I am", "you is" → "you are"）
  - 現状: 3人称単数のみ判定
  - 修正案: 1人称/2人称の判定を追加、be動詞専用の活用テーブル

- [ ] 固有名詞に冠詞がつく（"the Tokyo" → "Tokyo"）
  - 修正案: NounEntry に `proper: boolean` を追加、レンダラーで冠詞を抑制

## Future Enhancements

### Grammar & Syntax
- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 所有限定詞 (my, your, his, her, its, our, their)
- [ ] 場所前置詞 (in, at, to, from)
- [x] 否定文対応 - NOT wrapper で実装済み
- [ ] 疑問文対応
- [ ] 前置限定詞の語順対応（"all the things" not "the all things"）
- [ ] Modal（法助動詞）wrapper (can, may, must, should)
  - TimeFrame の will は時制用、Modal の will は意思表明用
  - 能力 (can)、許可 (may)、義務 (must)、助言 (should)
  - all, both, half → predeterminer（限定詞の前）
  - two, many, some → postdeterminer（限定詞の後）
  - 修正案: `QUANTIFIER_OPTIONS` に `position: 'pre' | 'post'` を追加

### Multi-language
- [ ] 日本語レンダラー
- [ ] 文法ルールの定数化・多言語説明対応
  - 副詞配置、語順などのルールをデータとして定義
  - UI言語に応じた説明表示（文法ヒント機能）
  - 例: `{ position: 'pre-verb', description: { en: "...", ja: "..." } }`
