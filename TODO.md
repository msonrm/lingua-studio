# TODO

## Future Enhancements

### Grammar & Syntax
- [x] 疑問文対応（Yes/No疑問文、Wh疑問文）
  - [x] `question()` ラッパー（`?()` から変更：可読性・検索性向上）
  - [x] 名詞句疑問詞プレースホルダー: `?who`, `?what`
  - [x] 選択疑問: `?which('tea, 'coffee)`
  - [x] 副詞疑問詞プレースホルダー: `?where`, `?when`, `?how`
    - Questionカテゴリ + 各副詞カテゴリに二重配置
    - Wh語検出による疑問文自動判定（`question()`不要）
    - LinguaScript: `sentence(past+simple(locative(?where, run(agent:'I))))` → "Where did I run?"
  - 仕様: `sentence(past+simple(eat(agent:?who, theme:'apple)))` → "Who ate the apple?"

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

### Vocabulary
- [x] LOCATION副詞に「home」と同ジャンルの単語を追加
  - home, abroad, indoors, outdoors, upstairs, downstairs を追加済み

### UI & Localization
- [x] ブロックラベルの切り替え機能（言語学的 / カジュアル / 日本語）
  - i18nシステム実装済み（en, ja, ja-hira）
  - Blockly.Msg + React Context による切り替え
- [x] 言語切り替え時のワークスペース状態保持
  - Blockly.serialization を使用した状態保存・復元
- [x] Grammar Console（文法判断のログ表示）
  - [x] 2パネル構成
    - "Your Changes": ユーザーのブロック操作を表示
    - "Applied Rules": 文法変換ルールを表示
  - [x] ブロック変更検知
    - フィールド値変更（プルダウン）: `BLOCK_CHANGE` イベント
    - ブロック接続/切断: `BLOCK_MOVE` イベント
  - [x] 変換ログの表示（2行フォーマット: 条件 + 結果）
    - agreement: Subject-verb agreement `run → runs` (3rd person singular)
    - tense: Tense inflection `eat → ate` (past tense)
    - aspect: Progressive/Perfect marking `eat → eating/eaten`
    - case: Pronoun case `I → me` (object position)
    - article: Article selection `a → an` (before vowel)
    - do-support: Do-insertion for questions/negation
    - modal: Modal past form `can → could`
    - inversion: Subject-auxiliary inversion
    - wh-movement: Wh-word fronting
  - [x] アーキテクチャ
    - `GrammarLogCollector` クラス（モジュールレベル）
    - `renderToEnglishWithLogs()` → `RenderResult { output, logs, warnings }`
    - 共通ヘルパー関数パターン（他言語レンダラーの参考用）

### Multilingual & Language Parameters

#### 前提作業（多言語展開の基盤）
- [x] Grammar Rule System アーキテクチャ
  - `src/renderer/types.ts`: RenderContext, DerivationStep 等の型定義
  - `src/renderer/DerivationTracker.ts`: 変形記録クラス（GrammarLogCollector を置換）
  - `src/renderer/english/rules/`: 英語ルールの分離
    - `morphology.ts`: 形態論（agreement, tense, aspect, case, article）
    - `syntax.ts`: 統語論（do-support, inversion, wh-movement）
  - `toLegacyLogs()`: 後方互換性のため既存UI形式に変換
- [x] Grammar Console UI の更新（新 DerivationTracker 対応）
  - [x] i18n 対応（GrammarMessages によるメッセージキー翻訳）
  - [x] サイドパネル移動 + タブ構成
  - toLegacyLogs() で既存UIと後方互換

#### 辞書アーキテクチャ
- [x] 辞書分離（言語非依存 / 言語固有）
  - `dictionary-core.ts`: lemma（英語識別子）, type, category, valency（言語非依存）
  - `dictionary-en.ts`: 英語 forms（活用形）+ ルックアップ関数（findVerb等）
  - `dictionary-ja.ts`: 日本語 surface + forms（未実装）
  - lemma は英語で固定（プログラミング言語が英語ベースなのと同様）
  - ルックアップ時に Core + Forms をオンデマンドでマージ

#### Output UI
- [ ] 2パネル出力構成
  - 左: Primary Output（ターゲット言語）
  - 右: Reference Output（UI言語で意味確認）
  - 例: 英語学習時 → 左:English / 右:日本語訳
  - 例: 架空言語時 → 左:Conlang / 右:UI言語で意味確認

#### 言語別レンダラー
- [ ] 日本語レンダラー
  - 日本語辞書 (dictionary-ja.ts)
  - SOV語順、助詞選択、敬語処理
- [ ] パラメータベースのレンダラー設計（架空言語ビルダー）
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

### LinguaScript Syntax Enhancement
- [x] メタ値記法: `plural`, `uncountable` （クォートなし = 出力されない制御値）
- [x] 組み合わせ演算子: `past+perfect` （両方適用を明示）
- [x] 意味注釈: `obligation:must` vs `certainty:must` （意味概念:表層形の記法）
- [ ] フィールド必須/任意マーカー: `*field` / `field?` （手書き入力・バリデータ実装時に必要）

### LinguaScript Editor
- [x] シンタックスハイライト（読み取り専用ビューア）
  - Prism.js によるカスタム言語定義
  - Solarized Light テーマ
  - 行番号表示、インデント付きフォーマット

### Logic Extension（論理推論拡張）

LinguaScriptを論理推論言語として拡張し、LLMを推論エンジンとして活用する。
Geminiでの実験により、前提知識なしで論理構文が理解され、正しく推論されることを確認済み。

#### 構文追加
- [x] `fact(P)` - 真偽値の確定（アサーション）
  - P を真と宣言する
  - 例: `fact(own(experiencer:'John, theme:'car))`
  - `sentence()` / `modal()` とは排他的
- [x] `AND(P, Q)`, `OR(P, Q)`, `NOT(P)` - 命題論理演算（大文字）
  - 小文字 `and()`/`or()`/`not()` は等位接続・動詞否定（言語学的）
  - 大文字 `AND()`/`OR()`/`NOT()` は命題論理（論理学的）
  - `fact()` 内でのみ使用可能（ブロックレベルで接続制限）
  - ネスト対応: `NOT(AND(P, OR(Q, R)))`
- [x] `IF(P, then:Q)` - 条件・含意（大文字、名前付き引数）
  - ルール定義: 前件が真なら後件も真
  - 例: `IF(give(agent:?A, theme:?T, recipient:?R), then:have(experiencer:?R, theme:?T))`
- [x] `BECAUSE(P, effect:Q)` - 因果関係（大文字、名前付き引数）
  - 原因→結果の因果推論
  - 例: `BECAUSE(rain(), effect:wet(theme:'ground))`

#### Blocklyブロック
- [x] `fact_wrapper` ブロック - 事実の宣言
- [x] `logic_and_block`, `logic_or_block`, `logic_not_block` - 命題論理演算
  - Logic カテゴリとして Toolbox に追加（Question の下）
  - 接続タイプ制限: logic ブロックは fact_wrapper 内でのみ接続可能
- [x] `logic_if_block` ブロック - 条件・ルール定義（IF...THEN形式）
- [x] `logic_because_block` ブロック - 因果関係（BECAUSE...EFFECT形式）

#### 英語レンダリング
- [x] `⊨` マーカーで fact 出力を区別
- [x] `AND(P, Q)` → "both P and Q"
- [x] `OR(P, Q)` → "either P or Q"
- [x] `NOT(P)` → "it is not the case that P"
- [x] `NOT(OR(P, Q))` → "neither P nor Q" (De Morgan 対応)
- [x] `IF(P, then:Q)` → "if P, then Q"
- [x] `BECAUSE(P, effect:Q)` → "Q because P"

#### ローカライズ
- [x] 日本語 (ja): 事実, AND, OR, NOT, IF, THEN, BECAUSE, EFFECT, 論理
- [x] ひらがな (ja-hira): ほんと, かつ, または, ちがう, もし, ならば, なぜなら, けっか

#### 推論機能（未実装）
- [ ] LLM連携API - LinguaScriptをLLMに送信してクエリ結果を取得
  - question() をクエリとして解釈
  - ?who, ?what 等を変数として束縛
- [ ] 閉世界仮説（CWA）vs 開世界仮説（OWA）の選択オプション
- [ ] 外部知識連携 - 未知の事実をGoogle/Wikidataに問い合わせ
  - LinguaScript → SPARQL 変換（Wikidata連携）
  - 意味役割がKnowledge Graphスキーマに対応

#### 理論的背景
- 生成文法からの原理: 機能範疇の階層（普遍的な骨格）
- 依存文法からのパラメータ: 動詞の結合価・意味役割（語彙駆動）
- Prolog的な論理意味論: fact/rule/query
- 「原理とパラメータ」アプローチの再解釈

#### 関連システム
- AMR (Abstract Meaning Representation) - 意味表現
- UNL (Universal Networking Language) - Interlingua
- LFG f-structure - 機能構造
- Prolog - 論理プログラミング

### Deferred（設計検討が必要）
- [ ] Passive（受動態）wrapper
  - agent が指定されている場合は by 句を自動生成
  - 仕様: `sentence(passive(eat(agent:'I, patient:'apple)))` → "The apple was eaten by me."
- [ ] Causative（使役態）wrapper
- [ ] Why疑問文（`?why`）の構文設計
  - 構文的には where/when/how と同様（Wh副詞、文頭移動）
  - 意味的に特殊: 答えが「because...」節（理由節）になる
  - 設計課題:
    - 現行案: `pp(?why, ...)` は前置詞句として不自然
    - 代替案1: `reason(?why, ...)` ラッパーの導入
    - 代替案2: 付加詞として `?why` を単独で使用
    - 理由節（because...）との統一的な扱いが必要
  - 関連: Logic Extension の `because(cause:P, effect:Q)` と設計を統一すべき
- [ ] 否定 + 頻度副詞 "never" の二重否定検出
  - `not(frequency('never, ...))` は論理的に二重否定
  - 警告表示 or 禁止の実装が必要
  - 難易度: 高（スコープ解析が必要）
- [ ] Grammar Console 詳細表示モード
  - DerivationStep を直接参照（toLegacyLogs() を経由しない）
  - 形態論/統語論の区別、操作種類、位置情報を表示
  - 折りたたみUIで「詳細を見る」オプション
- [ ] LinguaScript Editor 編集機能
  - Monaco Editor 統合（バンドルサイズ +2-3MB）
  - 辞書連携オートコンプリート
  - 双方向同期（Blocks ↔ LinguaScript）
  - パーサー実装が前提
- [ ] Linguistic AST Renderer（学術・教育向け）
  - 言語学理論に基づく木構造表示（X-bar, 依存文法, Minimalist等）
  - LinguaScript自体が依存文法的なので必要性は低い
- [ ] TimeChip 3連プルダウン化（教育的UX改善）
  - [Tense][Aspect][Time] の3スロット構成
  - 現状の統合ブロックで十分機能している

### Out of Scope（単文スコープ外）
- 関係節 (the man who ate...)
- 複文接続 (but, because による文の接続)
- 従属節 (if, when, although...)

## Completed

### UI & i18n Improvements (2026-01)
- [x] Grammar Log メッセージの i18n 対応
  - `GrammarMessages` インターフェースで全変形ログメッセージキーを定義
  - `LocaleContext` に grammar プロパティを追加
  - conjugation.ts, nounPhrase.ts, englishRenderer.ts でメッセージキーを使用
  - GrammarPanel.tsx で `translateKey()` 関数によるキー→翻訳変換
- [x] UI カラーパレットの調整（威圧的→優しめに）
  - アクセントカラー: `#e94560` (ピンク) → `#5c8bc4` / `#6c9bcf` (青系)
  - 背景色: `#16213e` (暗い青紫) → `#252d3a` / `#2d3748` (暖かいグレー)
  - インタラクティブ要素（ボタン、セレクタ）は青、ラベルは白で区別
- [x] コピーボタンの改善
  - ローカライズされたラベル追加（Copy / コピー / コピーしたよ）
  - 青い枠線、アイコン + ラベルのUI
  - `ui.COPY`, `ui.COPIED`, `ui.COPY_FOR_AI` キー追加
- [x] サイドパネルタブのローカライズ
  - `ui.TAB_GRAMMAR`, `ui.TAB_TIMELINE` キー追加
  - ja-hira: 子供向け表現（ことばのきまり、じかん/ようす）
- [x] Blockly ワークスペースの自動リサイズ
  - `ResizeObserver` でコンテナサイズ変更を検知
  - `Blockly.svgResize()` でワークスペースを再描画
  - サイドパネル開閉時にメイン領域が適切に拡縮
- [x] ja-hira ロケールの子供向け表現統一
  - `TAB_GRAMMAR`: 'ぶんぽう' → 'ことばのきまり'
  - `TAB_TIMELINE`: 'タイムライン' → 'じかん/ようす'
  - `TIME_CHIP_UNIFIED_LABEL`: 'いつ？/ようす' → 'じかん/ようす'
  - `SENTENCE_TA_LABEL`: 'いつ？:' → 'いつ？どんなようす？:'
  - `APP_SUBTITLE`: 'ことばのIDE' → 'IDE for Natural Language'（全ロケール統一）

### Grammar Rule System Refactoring (2026-01)
- [x] 新アーキテクチャ設計・実装
  - `DerivationTracker` クラス: GrammarLogCollector を置換
  - 形態論（MorphologyStep）と統語論（SyntaxStep）を明確に分離
  - `RenderContext` 型: レンダリング文脈を構造化
  - `DerivationDiff`: 前回との差分計算機能
- [x] 英語ルールの分離
  - `src/renderer/english/rules/morphology.ts`: agreement, tense, aspect, case, article
  - `src/renderer/english/rules/syntax.ts`: do-support, inversion, wh-movement
  - 将来の日本語レンダラー対応を考慮した設計
- [x] 英語レンダラーのリファクタリング
  - `src/renderer/english/` に英語固有コードを集約
    - `renderer.ts`: 英語レンダラー本体
    - `coordination.ts`: 等位接続ルール（Oxford comma, both/either）
    - `conjugation.ts`: 動詞活用
    - `nounPhrase.ts`: 名詞句レンダリング
  - `logCollector.log()` → `tracker.recordMorphology()` / `tracker.recordSyntax()`
  - `toLegacyLogs()` で既存UIとの後方互換性を維持

### Logic Extension - Phase 1 (2026-01)
- [x] `fact()` wrapper と `AND()`/`OR()`/`NOT()` 命題論理ブロック実装
  - fact_wrapper: sentence/modal と排他的な事実宣言
  - logic_and_block, logic_or_block, logic_not_block: 命題論理演算
  - 接続タイプ制限: logic ブロックは fact_wrapper 内でのみ接続可能
  - ネスト対応: NOT(AND(P, OR(Q, R))) などの深いネスト
- [x] 英語レンダリング
  - `⊨` マーカーで fact 出力を区別
  - both/either/neither マーカーでスコープを明確化
  - NOT(OR(P, Q)) → "neither P nor Q" (De Morgan)
- [x] 小文字/大文字の区別
  - 小文字 and/or/not: 等位接続・動詞否定（言語学的）
  - 大文字 AND/OR/NOT: 命題論理（論理学的）
- [x] ローカライズ (ja, ja-hira)
  - 日本語: 事実, AND, OR, NOT, 論理
  - ひらがな: ほんと, かつ, または, ちがう, ほんと？うそ？
- [x] バグ修正
  - and()/or() 等位接続で内側の logicOp が失われる問題
  - ネストされた論理式で rightOperand の logicOp が失われる問題

### Logic Extension - Phase 2 (2026-01)
- [x] `IF(P, then:Q)` と `BECAUSE(P, effect:Q)` 実装
  - 大文字で命題論理の一貫性を維持（AND/OR/NOT と同様）
  - 名前付き引数で可読性向上（生成AI・人間両方に配慮）
  - logic_if_block: IF...THEN形式のブロック
  - logic_because_block: BECAUSE...EFFECT形式のブロック
- [x] 英語レンダリング
  - IF(P, then:Q) → "if P, then Q"
  - BECAUSE(P, effect:Q) → "Q because P"（結果を先に配置）
- [x] 再帰的ネスト対応
  - IF(AND(P, Q), then:R) などの複合条件
  - AND(P, IF(Q, then:R)) などの複合結果
  - AND/OR と同じパターンで leftOperand を処理
- [x] ローカライズ (ja, ja-hira)
  - 日本語: IF, THEN, BECAUSE, EFFECT
  - ひらがな: もし, ならば, なぜなら, けっか

### Screen Layout Refactor (2026-01)
- [x] 3タブ構成: Blocks / LinguaScript / AST
  - メインエディタ領域でタブ切り替え
  - AST toggle を削除し、タブに統合
- [x] LinguaScript Bar（ヘッダー下に常時表示）
  - 黒背景・白文字のシンプル表示
  - コピーボタンで生成AIへの貼り付けを容易に
- [x] LinguaScript View（メインエディタ）
  - Prism.js シンタックスハイライト
  - 括弧に応じたインデント付きフォーマット
  - 行番号表示
- [x] サイドパネル（開閉可能）
  - 将来のビルドオプション用にスペース確保
- [x] Bottom Panel 簡素化
  - Output + Grammar Console のみに整理

### Grammar Console Implementation (2026-01)
- [x] 2パネル構成で教育的UXを実現
  - "Your Changes": ユーザーのブロック操作（接続、値変更）を表示
  - "Applied Rules": 文法変換ルールを条件→結果の2行形式で表示
- [x] ブロック変更検知システム
  - `BLOCK_CHANGE` イベント: プルダウン値変更
  - `BLOCK_MOVE` イベント: ブロック接続/切断
  - フィールド名・ブロックタイプを読みやすいラベルに変換
- [x] 文法変換ログ
  - TransformType: agreement, tense, aspect, case, article, do-support, modal, negation, wh-movement, inversion
  - ~~`GrammarLogCollector` クラスで変換を収集~~ → `DerivationTracker` に移行
  - `renderToEnglishWithLogs()` で RenderResult を返す
- [x] 共通ヘルパー関数パターン
  - `logModalTransformation()`: 平叙文・疑問文の両方で使用
  - 他言語レンダラー作成時の参考パターンとして整備

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
  - LinguaScript: `modal(ability:can, sentence(...))`
- [x] Imperative（命令文）wrapper
  - 主語省略 + 動詞原形
  - 否定: "Do not eat!"
  - LinguaScript: `imperative(sentence(...))`
- [x] Sentence Modifier カテゴリとして Toolbox 分離
- [x] NOT（モダリティ否定）wrapper
  - 動詞否定（negation_wrapper）とは別ブロックとして実装
  - negation_sentence_wrapper: modal の外側に配置してモダリティ否定
  - 義務の否定 → "don't have to" / "didn't have to"（義務なし＝しなくてよい）
  - LinguaScript: `not(modal(obligation:must, sentence(...)))`

### Grammar Spec Review (2026-01)
- [x] 仕様書とコードベースの比較・精査
- [x] BNF文法の疑問詞定義を具体的な形式に統一 (`?` → `?who`, `?what`, `?which(...)`)
- [x] 例文の記法を現行実装に合わせて修正 (`?()` → `question()`, `past(simple())` → `past+simple()`)
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

### DET Rules Refactoring (2026-01)
- [x] 英語DETルールを独立モジュールに抽出 (`det-rules-en.ts`)
  - PRE/CENTRAL/POST の3層構造
  - 排他ルール（PRE_EXCLUSIONS, CENTRAL_EXCLUSIONS, POST_EXCLUSIONS）
  - 名詞タイプ別制約（countable, uncountable, proper, zeroArticle）
- [x] 限定詞の追加
  - 指示詞: these, those
  - 所有格: his, her, its, our, their
  - 量化詞: each, every, either, neither, any
  - 複合量化詞: a few, a little, a lot of, plenty of, a number of,
                a couple of, a great deal of, many a, quite a few
- [x] POST限定詞の追加
  - little, much（不可算用）
- [x] 排他ルールのバグ修正
  - my/your/this/that + uncountable の誤った排他を削除
  - `all` から `number: 'plural'` を削除（"all the apple" も有効）
- [x] LinguaScript/AST の簡素化
  - determiner を複雑なオブジェクトから単純な文字列に変更
  - 値をそのまま通過させる設計（言語非依存層）

### Bug Fixes
- [x] "The a something runs." - レガシーquantifierフィールドを削除し、限定詞システムに統合
- [x] "a few" の組み合わせが禁止されていた問題を修正
- [x] 副詞の語順（"has always run"）
- [x] be動詞の人称活用
- [x] 固有名詞への冠詞付与防止

### Cleanup
- [x] レガシーブロック削除（quantifier_block, determiner_block, noun_phrase, person_block, thing_block, adjective, adverb）

### Dropdown UX Improvements (2026-01)
- [x] ドロップダウンのグループヘッダーを選択不可に
  - `labelValidator` 関数で `__label_*` 値を拒否
  - 対象: pronoun, human, place, manner, locative, time_adverb, preposition
- [x] 動詞修飾副詞のプルダウン改善
  - MANNER: Common を上に、Interrogative を下に
  - MANNER: デフォルト値を `quickly` に（`?how` から変更）
  - MANNER: 順序を quickly/slowly/furiously に
  - LOCATION: デフォルト値を `here` に
  - LOCATION: `home` を一時除外（Vocabulary TODO参照）
  - TIME: デフォルト値を `yesterday` に
  - TIME: 順序を yesterday/today/tomorrow 先頭に
- [x] 前置詞プルダウンにグループヘッダー追加
  - Location (in, on, at, under, behind)
  - Direction (to, from, into)
  - Relation (with, of, for, about)
- [x] 欠損引数の表示を `___` マーカーに統一
  - 主語欠損: `someone` → `___`
  - 必須引数欠損: `___` を表示（例: "I cut ___."）
  - PP/等位接続の欠損: `something`/`thing` → `___`
  - Grammar Console 対応の準備完了
- [x] 引数レンダリングアルゴリズムの簡素化
  - 主語ロールはvalencyの順序で決定（最初のSUBJECT_ROLE）
  - シンプルなアルゴリズム: 全スロット`___` → 値代入 → オプショナル欠損省略
  - 全レンダリング関数で統一（declarative, interrogative, wh-question, imperative, coordinated VP）
- [x] 前置詞プルダウンのデフォルト値を `in` に修正
  - グループヘッダーではなく実際の値をデフォルトに

### DET Dropdown UX Improvements (2026-01)
- [x] CENTRAL限定詞にカテゴリラベル追加
  - Article, Demonstrative, Possessive, Distributive, Quantity
  - ラベル行は選択不可（`__label_*` 値で判定）
- [x] noneオプションの表記改善
  - `─` → `[∅]`（言語学的ゼロ記号）
- [x] ドロップダウンラベルの国際化対応
  - `msg()` 関数で動的ローカライズ
  - 配列からゲッター関数に変換（`getCentralDeterminers()`）
  - ja: 冠詞, 指示詞, 所有詞, 分配詞, 数量詞
  - ja-hira: 子供向け表現（これ・あれ, わたしの・あなたの, etc.）
- [x] バリデータ簡素化
  - リスト型検証への統一で不要コード削除（~150行）
  - X印とラベルの拒否のみに簡素化
- [x] 名詞タイプ変更時のX印表示バグ修正
  - `getOptions(false)` + `setValue` でBlocklyキャッシュをバイパス
  - GitHub issue #3099 のワークアラウンド適用
