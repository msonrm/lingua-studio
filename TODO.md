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

## Completed (This Session)

- [x] 前置詞ブロックの実装
  - PP (VERB): 動詞修飾用（"I go to the park"）- 赤系 (#C0392B)
  - PP (NOUN): 名詞修飾用（"the man with the telescope"）- 青系 (#3c6e91)
  - 構造的曖昧性を明示的に解消可能
  - 前置詞カテゴリ: location (in, on, at, under, behind), direction (to, from, into), relation (with, of, for, about)

- [x] LinguaScriptレンダラーの追加
  - LISP風の明示的構文表記: `present(simple(see('I, the('man))))`
  - 完全明示: tenseとaspectを常に表示（`simple`も省略せず）
  - 時間副詞はコメントで付記: `// yesterday`
  - AI間通信に適した曖昧性のない表現

- [x] 複数SENTENCEブロックのサポート
  - ワークスペースに複数のSENTENCEブロックを配置可能
  - Generated Sentences / LinguaScript を縦に並べて表示
  - 構造的曖昧性の比較（例: "I saw the man with the telescope" の2解釈）

- [x] 辞書に 'see' 動詞と 'telescope' 名詞を追加
  - 構造的曖昧性デモ用

- [x] ブロックラベルの言語学的表現への統一
  - ACTION → VERB, TIME FRAME → SENTENCE
  - スロットラベル: who/what → agent/patient/theme 等
  - 必須スロット: `label:` / 任意スロット: `(label):`
  - ToolboxカテゴリをSentence/Verbs/Verb Modifiers/Nouns/Noun Modifiersに再編成

- [x] モンテッソーリベースの配色
  - Sentence系: ブラウン (#5D4E37, #8B7355)
  - Verb系: 赤グラデーション (#DC143C → #EF6C57)
  - Noun系: ほぼ黒 (#0d1321)
  - Noun Modifier系: ネイビーグラデーション (#1a365d → #2c5282)

- [x] ADJ/DET接続順序の制約
  - ADJ: 入力 ["noun", "adjective"] → 出力 "adjective"
  - DET: 入力 ["noun", "adjective"] → 出力 "nounPhrase"
  - 正しい順序: DET → ADJ → NOUN のみ許可

- [x] 起動時に初期ブロック配置
  - SENTENCE + VERB を接続した状態で配置
  - チョムスキー的な TP > VP 構造を反映

- [x] ドロップダウンの "Select..." プレースホルダー削除
  - 全ブロックで実際の値がデフォルト選択されるように変更

## Future Enhancements

### Grammar & Syntax
- [ ] 代名詞選択時のNUMBER非表示（UX改善）
- [ ] 指示代名詞 (this/that as pronouns, these/those)
- [ ] 所有限定詞 (my, your, his, her, its, our, their)
- [x] 前置詞ブロック (in, on, at, to, from, with, etc.) - PP (VERB) / PP (NOUN) で実装済み
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

### UI & Localization
- [ ] ブロックラベルの切り替え機能
  - 現在: 言語学的表現（VERB, agent, theme, etc.）
  - オプション: カジュアル（ACTION, who, what）、子供向け、日本語
  - 設定UIから切り替え可能に
- [ ] 日本語レンダラー
- [ ] 文法ルールの定数化・多言語説明対応
  - 副詞配置、語順などのルールをデータとして定義
  - UI言語に応じた説明表示（文法ヒント機能）
  - 例: `{ position: 'pre-verb', description: { en: "...", ja: "..." } }`

### UI Redesign (MakeCode Style)

**Phase 1: レイアウト変更**
- [ ] 上下2分割レイアウト
  - 上部: メインワークスペース（Blocks）
  - 下部左: Output（生成文 + 読み上げボタン + ハイライト）
  - 下部右: Grammar Console（文法説明ログ）
- [ ] AST表示のトグル化（デフォルト非表示）
- [ ] ヘッダーにモード切替タブ（Blocks / LinguaScript）の場所確保

**Phase 2: Grammar Console**
- [ ] レンダリング時の文法判断をログ収集する仕組み
  - 例: "subject 'I' → 1st person singular"
  - 例: "verb 'see' + PAST → 'saw'"
  - 例: "NP: the + man (definite, singular)"
- [ ] コンソールUIコンポーネント作成
- [ ] 日本語/英語切り替え対応

**Phase 3: Output ハイライト & 読み上げ**
- [ ] 生成文の構成要素を色分け表示（ブロック色と対応）
  - 主語（名詞）: 黒系
  - 動詞: 赤系
  - 目的語: 黒系
  - 前置詞句: PP色
- [ ] Web Speech API による読み上げ機能
- [ ] ホバーで詳細表示（オプション）

**Phase 4: LinguaScript エディタ**
- [ ] Monaco Editor 統合
- [ ] LinguaScript用シンタックスハイライト定義
- [ ] 辞書連携オートコンプリート
  - 動詞: run, eat, see, give...
  - 名詞: cat, dog, man, telescope...
  - 関数: present, past, future, simple, perfect, not, the, a...
  - 前置詞: to, from, with, in, on...

**Phase 5: 双方向同期**
- [ ] Blocks → LinguaScript（既存）
- [ ] LinguaScript → AST パーサー実装
- [ ] AST → Blocks 変換（ブロック自動生成）
- [ ] モード切替時の同期処理
