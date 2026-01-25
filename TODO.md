# TODO

## Future Enhancements

### Grammar & Syntax
- [x] 疑問文対応（Yes/No疑問文、Wh疑問文）
  - [x] `question()` ラッパー（`?()` から変更：可読性・検索性向上）
  - [x] 名詞句疑問詞プレースホルダー: `?who`, `?what`
  - [x] 選択疑問: `?which('tea, 'coffee)`
  - [ ] 副詞疑問詞プレースホルダー: `?where`, `?when`, `?how`（検討中）
  - 仕様: `question(sentence(past+simple(eat(agent:?who, theme:'apple))))` → "Who ate the apple?"
- [ ] Passive（受動態）wrapper
  - agent が指定されている場合は by 句を自動生成
  - 仕様: `sentence(passive(eat(agent:'I, patient:'apple)))` → "The apple was eaten by me."
- [ ] Causative（使役態）wrapper

### Modality & Register
- [ ] Register パラメータ（formal/casual）
  - ビルドconfig として設定
  - Permission: may (formal) / can (casual)
  - デフォルト: formal
- [ ] Evidentiality（証拠性）- 日本語レンダラー向け
  - 伝聞: 「〜そうだ」「〜らしい」
  - 様態: 「〜ようだ」
- [ ] Desiderative（願望）- 日本語レンダラー向け
  - 「〜たい」

### Coordination
- [ ] 否定とのスコープ相互作用（De Morgan）
  - "I don't eat apples and oranges" の解釈曖昧性
- [ ] 等位接続の構造的曖昧性
  - "I saw the man with the telescope and the camera"

### UI & Localization
- [x] ブロックラベルの切り替え機能（言語学的 / カジュアル / 日本語）
  - i18nシステム実装済み（en, ja, ja-hira）
  - Blockly.Msg + React Context による切り替え
- [ ] Grammar Console（文法判断のログ表示）
- [ ] TimeChip 3連プルダウン化（教育的UX改善）
  - [Tense][Aspect][Time] の3スロット構成
  - Time で "Yesterday" を選択 → [Past][Simple][Yesterday] に自動設定
  - 非文法的な組み合わせに×印、自動修正機能

### Multilingual & Language Parameters
- [ ] 日本語レンダラー
  - 日本語辞書 (dictionary-ja.ts)
  - SOV語順、助詞選択、敬語処理
- [ ] パラメータベースのレンダラー設計
  - チョムスキー「原理とパラメータ」理論に基づく
  - 語順パラメータ: SVO, SOV, VSO, VOS, OSV, OVS
  - 主要部位置: head-initial / head-final
  - Pro-drop: 主語省略可否
  - Wh移動: 疑問詞の文頭移動
  - 冠詞有無 / 格助詞使用
  - 教育ツールとしての活用（同じASTから異なる語順で出力）
- [ ] LinguaScriptパーサー（双方向変換の基盤）
  - BNF文法に基づく実装
  - AST ↔ LinguaScript の等価変換

### Linguistic AST Renderer（学術・教育向け）
- [ ] 言語学的構文木レンダラー
  - 内部AST → 言語学理論に基づく木構造を生成
  - 理論選択オプション（教育目的で切り替え可能）
  - **Note**: LinguaScriptは依存文法的（動詞中心＋意味役割引数）
- [ ] 対応理論候補:
  - X-bar Theory: Spec-Head-Comp の階層構造
  - Dependency Grammar: 主辞間の依存関係（LinguaScriptに最も近い）
  - Minimalist Program: 二項Merge、最小構造
  - HPSG/LFG: 制約ベース、素性構造
- [ ] 出力形式:
  - テキスト（括弧表記）
  - SVG/Canvas（視覚的な木構造）
  - LaTeX (qtree, forest パッケージ)

### LinguaScript Syntax Enhancement
- [x] メタ値記法: `plural`, `uncountable` （クォートなし = 出力されない制御値）
- [x] 組み合わせ演算子: `past+perfect` （両方適用を明示）
- [x] 意味注釈: `obligation:must` vs `certainty:must` （意味概念:表層形の記法）
- [ ] フィールド必須/任意マーカー: `*field` / `field?` （手書き入力・バリデータ実装時に必要）

### LinguaScript Editor
- [ ] Monaco Editor 統合
- [ ] シンタックスハイライト
- [ ] 辞書連携オートコンプリート
- [ ] 双方向同期（Blocks ↔ LinguaScript）

### Deferred（設計検討が必要）
- [ ] Why疑問文（`?why`）の構文設計
  - 構文的には where/when/how と同様（Wh副詞、文頭移動）
  - 意味的に特殊: 答えが「because...」節（理由節）になる
  - 設計課題:
    - 現行案: `pp(?why, ...)` は前置詞句として不自然
    - 代替案1: `reason(?why, ...)` ラッパーの導入
    - 代替案2: 付加詞として `?why` を単独で使用
    - 理由節（because...）との統一的な扱いが必要
  - 実装は where/when/how 完了後に検討
- [ ] 否定 + 頻度副詞 "never" の二重否定検出
  - `not(frequency('never, ...))` は論理的に二重否定
  - 警告表示 or 禁止の実装が必要
  - 難易度: 高（スコープ解析が必要）

### Out of Scope（単文スコープ外）
- 関係節 (the man who ate...)
- 複文接続 (but, because による文の接続)
- 従属節 (if, when, although...)

## Completed

### Question Implementation (2026-01)
- [x] `question()` ラッパー実装（Yes/No疑問文）
  - 主語-助動詞倒置（do-support）
  - モダリティ対応（Can you...?, Will he...?）
  - 否定疑問文対応（Can't a fish run?）
- [x] Wh疑問詞プレースホルダー（`?who`, `?what`）
  - 主語疑問文: "Who ate the apple?"（do-supportなし）
  - 目的語疑問文: "What did you eat?"（do-support付き）
  - whom の自動選択（目的語位置）
- [x] 選択疑問 `?which('tea, 'coffee)`
  - `isChoiceQuestion` フラグで通常のor接続と区別
- [x] Question カテゴリをトップレベルに独立
- [x] 疑問詞ブロックをQuestion + Pronouns両方に配置

### Locative Adverbs (2026-01)
- [x] 場所副詞（here, there, somewhere, anywhere, everywhere, nowhere, home）を実装
  - 動詞ラッパー `locative_wrapper` として実装
  - 極性感応: somewhere ↔ anywhere（否定文で自動切り替え）
  - 語順: 場所副詞は文末に配置
  - LinguaScript: `locative('here, verb(...))`
- [x] LinguaScript: `time()` を `sentence()` 内側に移動
  - 変更前: `time('yesterday, sentence(past+simple(eat(...))))`
  - 変更後: `sentence(past+simple(time('yesterday, eat(...))))`
  - 理由: 他の副詞ラッパー（manner, frequency, locative）と一貫性を持たせるため

### Renderer Bug Fixes (2026-01)
- [x] LinguaScript: 代名詞 + prepModifier が出力されない問題を修正
  - 修正前: `'I` （前置詞句が消える）
  - 修正後: `pronoun('I, post:pp('to, noun(...)))`
- [x] LinguaScript: 代名詞 + 形容詞が出力されない問題を修正
  - 修正前: `'something`
  - 修正後: `pronoun('something, adj:'beautiful)`
- [x] 英語: モーダル + 等位接続で2番目の動詞がモーダルを無視する問題を修正
  - 修正前: "I can run and a father eats a fish."
  - 修正後: "I can run and a father can eat a fish."
- [x] 英語: 命令文 + 等位接続で2番目の動詞が出力されない問題を修正
  - 修正前: "Run!"
  - 修正後: "Run and eat!"

### Semantic Roles & Verbs (2026-01)
- [x] 動詞ブロックのセマンティック役割ラベルをi18n対応
  - agent, patient, theme 等が言語切替で翻訳される
- [x] 言語学的慣習に従った日本語用語に修正
  - patient → 被動者, recipient → 受領者, place → 起点
- [x] goal/location 役割の翻訳キーを追加
  - goal: 着点 / どこへ
  - location: 位置 / どこに
- [x] 着点/位置が必須項の動詞を追加
  - put, place, hang (action): goal が必須
  - live, reside, stay (state): location が必須

### Sentence Modifier (2026-01)
- [x] Modal（法助動詞）wrapper
  - 8概念の言語非依存設計（UG: 原理とパラメータ）
  - Ability, Permission, Possibility, Obligation, Certainty, Advice, Volition, Prediction
  - 時制連動: 過去時制で適切な英語形式に変換
    - ability + past → could
    - volition + past → was going to
    - obligation + past → had to
  - LinguaScript: `modal('ability, sentence(...))`
- [x] Imperative（命令文）wrapper
  - 主語省略 + 動詞原形
  - 否定: "Do not eat!"
  - LinguaScript: `imperative(sentence(...))`
- [x] Sentence Modifier カテゴリとして Toolbox 分離
- [x] NOT（モダリティ否定）wrapper
  - 動詞否定（negation_wrapper）とは別ブロックとして実装
  - negation_sentence_wrapper: modal の外側に配置してモダリティ否定
  - 義務の否定 → "don't have to" / "didn't have to"（義務なし＝しなくてよい）
  - LinguaScript: `not(modal('obligation, sentence(...)))`

### Grammar Spec Review (2026-01)
- [x] 仕様書とコードベースの比較・精査
- [x] 拡張意味役割の追加 (patient, experiencer, stimulus, beneficiary, possessor, attribute)
- [x] 等位接続の仕様追加 (and/or for NP & VP)
- [x] 限定詞3層システムの仕様化 (pre/det/post)
- [x] 極性感応代名詞の仕様化 (someone ↔ nobody)
- [x] 形容詞語順の標準分類採用 (opinion→size→age→shape→color→origin→material→purpose)
- [x] location/time/manner を付加詞として再定義（意味役割から分離）
- [x] instrument を pp('with, ...) に統一
- [x] goal/source の使い分け基準明記
- [x] コピュラ動詞の構造明記 (theme + attribute)
- [x] 時制・相と時間副詞の制約テーブル追加
- [x] 所有代名詞の仕様追加 (mine, yours, his, hers, ours, theirs)
- [x] BNF文法の更新

### Verb / Subject
- [x] 主語がない場合のデフォルト値として "someone" を使用
  - 命令文は英語のローカルルールのため、命令文ラッパーで別途対応予定

### Pronouns
- [x] 指示代名詞 (this/that/these/those) を代名詞ブロックに追加
- [x] 不定代名詞 + 形容詞対応 ("something good", "someone important")
  - 不定代名詞の場合のみ形容詞を後置でレンダリング
- [x] 所有代名詞ブロック (mine, yours, his, hers, ours, theirs)
  - 専用ブロック（possessive_pronoun_block）として実装
  - 述語位置・主語位置で使用可能

### Sentence / Time / Aspect
- [x] Time/Aspect ブロックの言語学的レビューと修正
  - Just now: `past + perfect` → `past + simple` に修正（"just now" は過去単純形と共起）
  - Still: `progressive` → `inherit` に修正（状態動詞は単純形でも可）
- [x] TIME ブロックに Today, At the moment を追加
- [x] TENSE/ASPECT ブロックに [Progressive], [Perf. Prog.] を追加
- [x] 統合 T/A ブロック追加（Tense × Aspect の2プルダウン方式）
- [x] UI一貫性改善：出力されない項目はカッコ表記（[Past], [Simple] など）

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
- [x] 初期キャンバスブロック（SENTENCE + MOTION + PRONOUN "I"）
- [x] 等位接続ブロックをAND/OR別々に分離（coordination_noun_and, coordination_noun_or, coordination_verb_and, coordination_verb_or）
- [x] 形容詞カテゴリ追加（Dixon's semantic types: size, age, color, physical, quality, emotion）
- [x] 形容詞ブロックをカテゴリ別に分離（adjective_size, adjective_age, adjective_color, adjective_physical, adjective_quality, adjective_emotion）

### Bug Fixes
- [x] "The a something runs." - レガシーquantifierフィールドを削除し、限定詞システムに統合
- [x] "a few" の組み合わせが禁止されていた問題を修正
- [x] 副詞の語順（"has always run"）
- [x] be動詞の人称活用
- [x] 固有名詞への冠詞付与防止

### Cleanup
- [x] レガシーブロック削除（quantifier_block, determiner_block, noun_phrase, person_block, thing_block, adjective, adverb）
