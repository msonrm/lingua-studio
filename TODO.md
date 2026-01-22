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

- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 所有限定詞 (my, your, his, her, its, our, their)
- [ ] 日本語レンダラー
- [ ] 場所前置詞 (in, at, to, from)
- [ ] 否定文対応 (someone → anyone/nobody 切り替え)
- [ ] 疑問文対応
