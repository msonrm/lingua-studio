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

- [x] 固有名詞に冠詞がつく（"the Tokyo" → "Tokyo"）
  - 解決済み: 限定詞ブロックが接続名詞の `proper` フラグを検出
  - 固有名詞接続時は全限定詞オプションに「×」マークを表示、選択不可に

## Future Enhancements

### Grammar & Syntax
- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 所有限定詞 (my, your, his, her, its, our, their)
- [ ] 場所前置詞 (in, at, to, from)
- [x] 否定文対応 - NOT wrapper で実装済み
- [x] 頻度副詞 - FREQ wrapper (always, usually, often, sometimes, rarely, never)
- [x] 様態副詞 - MANNER wrapper (quickly, slowly, furiously)
- [x] 前置限定詞の語順対応 - 統合DETERMINERブロック (`determiner_unified`) で実装
  - 3つのドロップダウン: 前置(all,both,half) / 中央(the,this,that,a/an,my,your,no) / 後置(one,two,many,few,some,several,[plural],[–])
  - 双方向制約チェック（PRE↔CENTRAL↔POST）
  - 無効なオプションに「×」マーク表示、選択不可
- [x] 名詞プロパティに基づく限定詞制約
  - 固有名詞: 全限定詞無効
  - 不可算名詞: a/an, both, half, 数量詞(one,two,many,few,several,[plural])無効
- [ ] 不定代名詞 + 形容詞対応 ("something good", "someone important")
  - 現状: 代名詞に形容詞を付けてもコンパイル時に無視される
  - 修正案: 不定代名詞(something, someone, etc.)の場合のみ形容詞を後置でレンダリング
- [ ] 疑問文対応
- [ ] Modal（法助動詞）wrapper (can, may, must, should)
  - TimeFrame の will は時制用、Modal の will は意思表明用
  - 能力 (can)、許可 (may)、義務 (must)、助言 (should)

### Multi-language
- [ ] 日本語レンダラー
- [ ] 文法ルールの定数化・多言語説明対応
  - 副詞配置、語順などのルールをデータとして定義
  - UI言語に応じた説明表示（文法ヒント機能）
  - 例: `{ position: 'pre-verb', description: { en: "...", ja: "..." } }`
