# TODO

## Bugs

- [ ] "The a something runs." - プレースホルダー名詞にDET/QTYが重複適用される問題
  - 原因: 空のnounスロットに"something"がデフォルト設定され、ラッパーの出力と重複
  - 修正案: プレースホルダー時はラッパーの出力を抑制、または別のデフォルト処理

- [ ] 副詞の語順が不自然（"has run always" → "has always run"）
  - 現状: 副詞が文末に配置される
  - 正しい位置: 副詞タイプにより異なる
    - 頻度副詞 (always, often): have と過去分詞の間
    - アスペクト副詞 (already, still): have と過去分詞の間
    - 様態副詞 (slowly, quickly): 文末または動詞後
  - 修正案: AdverbNode.advType に応じた配置ロジック

## Future Enhancements

### Grammar & Syntax
- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 所有限定詞 (my, your, his, her, its, our, their)
- [ ] 場所前置詞 (in, at, to, from)
- [ ] 否定文対応 (someone → anyone/nobody 切り替え)
- [ ] 疑問文対応
- [ ] 前置限定詞の語順対応（"all the things" not "the all things"）
  - all, both, half → predeterminer（限定詞の前）
  - two, many, some → postdeterminer（限定詞の後）
  - 修正案: `QUANTIFIER_OPTIONS` に `position: 'pre' | 'post'` を追加

### Multi-language
- [ ] 日本語レンダラー
- [ ] 文法ルールの定数化・多言語説明対応
  - 副詞配置、語順などのルールをデータとして定義
  - UI言語に応じた説明表示（文法ヒント機能）
  - 例: `{ position: 'pre-verb', description: { en: "...", ja: "..." } }`
