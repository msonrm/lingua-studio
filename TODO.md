# TODO

> **Note**: このファイルは [CHANGELOG.md](./CHANGELOG.md) と連動しています。機能実装完了時は両方を更新してください。

## リファクタリング（進行中）

計画: [docs/REFACTORING-PLAN.md](./docs/REFACTORING-PLAN.md) / 構造: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

- [x] **Phase 0**: テスト・静的解析の基盤（Vitest / ESLint / knip / CI）— 2026-07-26 完了
- [x] **Phase 1**: 死んだコードの整理 — 2026-07-26 完了
  - 削除: `VisualizationPanel.tsx` / `renderer/index.ts` / `BlockChange` 収集経路 /
    `generateAST` / `renderToEnglish` / `GrammarLogCollector` ほか（-301行）
  - 復活: `EditorMode` の `'ast'`（タブを追加。`TAB_AST` は3ロケールとも既にあった）
  - 未参照 export 67件・型25件 → **0件**（`npm run knip` が CI で失敗するようになった）
  - `definitions.ts` が `dictionary-core` のヘルパーを再実装していた重複を解消
- [x] **Phase 2**: 巨大関数の分割 — 2026-07-26 完了
  - `parseVerbChain` 426行 → ディスパッチャ39行 + ハンドラ6個（テーブル駆動）
  - `conjugateVerb` 322行 → エントリ16行 + ハンドラ10個（相ごとに分割）
  - 初期ブロック配置を `blocks/initialWorkspace.ts` へ切り出し（`BlocklyWorkspace.tsx` 312→173行）
- [ ] **Phase 3**: `blocks/definitions.ts`（1,709行 / ブロック41個）をカテゴリ別に分割
- [ ] **Phase 4**: 構造的な改善（tracker のモジュールグローバル解消 / 英日レンダラーの共通骨格抽出 / UI 層）

## Phase 0 で発見した不具合

- [x] 入れ子 VP 等位接続 `or(and(A, B), C)` で B が AST から消える — 2026-07-26 修正
- [x] 繋辞の形容詞が日本語訳されない（「私はhappyである」）— 2026-07-26 修正
- [x] 日本語レンダラーが `logicOp` を扱わない — 2026-07-26 修正
- [x] 日本語がモダリティ否定を無視する — 2026-07-26 修正
- [x] 日本語がモダリティ使用時に相を落とす — 2026-07-26 修正
- [x] `japanese/renderer.ts` の未使用 `verb` 変数 — 2026-07-26 削除

### 残っている既知の不整合

- [ ] **等位接続の英語出力（カンマ・correlative）を通しで見直す** ★要検討
  - 現状の出力:
    ```
    I eat an apple, or an orange.      ← 2要素なのにカンマ。"an apple or an orange" が自然
    I eat, or drink.                    ← 同上
    I eat apple and orange, or banana.  ← オックスフォードカンマの扱いが混在
    Both I eat and drink, or run.       ← correlative は正しいがカンマは要検討
    I eat, and my father runs.          ← 異なる主語の等位節。カンマは妥当
    Do you drink tea, or coffee?        ← 選択疑問。カンマの是非は要検討
    ```
  - **原因の当たり**: `english/coordination.ts` の `groupElements()` が
    最初の要素の接続詞を `elem.conjunction || 'and'` で `'and'` にデフォルトしている。
    純粋な OR の等位接続でも「最初は and グループ / 2番目は or グループ」と割れ、
    `joinGroups()` がグループ間に必ず `, ` を挟むためカンマが出る。
  - 併せて検討したい点:
    - グループ内3要素以上のオックスフォードカンマ（`formatGroup`）を有効にするか
    - 複数階層のとき correlative（both / either）を出す条件
    - 節の等位（異なる主語）と句の等位でカンマの扱いを分けるか
  - 出力を変えるとスナップショットが広範囲に動くので、独立した変更として扱うこと
- [ ] **`NOT` のオペランド構築が二項演算子と揃っていない**
  - `astGenerator.ts` の `parseNotLogic()` は `toVerbPhraseWithLogic()` を使わず
    自前で `VerbPhraseNode` を組んでおり、`polarity` を載せず内側の等位接続も繋がない
  - `parseBinaryLogic()`（AND/OR/IF/BECAUSE）は `toVerbPhraseWithLogic()` を使う
  - 統一すると `NOT(and(A, B))` のような入れ子で振る舞いが変わるため、
    Phase 2（機械的な分割）では現状を保った。揃えるなら独立した変更として扱うこと
- [ ] **副詞ラッパーのラベル行スキップが到達不能な防御コードになっている**
  - `parseAdverbWrapper()` の `skipLabelRows`（manner / locative / time_adverb）は
    フィールド値が `__` 始まりのとき副詞を足さず素通しする
  - しかし `definitions.ts` の `labelValidator` がラベル行の選択自体を拒否するため、
    UI 経由でこの値になることはない（`astGenerator.test.ts` で確認済み）
  - 消してよいか、逆にバリデータ側を緩めるべきかは要判断
- [ ] **`AdjectivePhraseNode.degree` がスキーマにあるのに UI から到達不能**
  - `astGenerator` は degree を一切生成せず、消費しているのは `linguaScriptRenderer` のみ
  - 英語レンダラーは degree を無視する（`degree('very, 'happy)` でも EN は "I am happy."）
  - 日本語レンダラーは対応済み（「とても幸せである」）
  - 程度副詞ブロックを追加する際は英語側の対応も必要
- [ ] **モダリティの迂言形式が単純相にしか対応しておらず、英語が壊れる**
  - `english/conjugation.ts` の `conjugateWithModal()`
  - `had to` / `was going to` / `don't have to` の特別扱いが `aspect === 'simple'` の場合のみ。
    それ以外は通常経路に落ち、`modalForm.auxiliary` が undefined → 空文字になる
  - 実際の出力:
    ```
    obligation + past + progressive        → "I be eating an apple."      ← 助動詞が落ちる
    volition   + past + progressive        → "I be eating an apple."      ← 同上
    obligation + past + progressive + 否定 → "I not be eating an apple."  ← 空文字を否定して ' not'
    ```
  - 単純相の `obligation` + 過去も `"I did have to eat an apple."` と do-support が重複している
  - 日本語は正しく出ている（「食べていなければならなかった」）
  - `Phase 2` のテストで現状を固定済み（`cases.ts` の KNOWN BUG コメント参照）
- [ ] **日本語は動詞否定とモダリティ否定を表層で区別しない**
  - 英語の "can not eat"（動詞否定）と "need not eat"（モダリティ否定）が
    日本語ではどちらもモダリティ側の否定形になる
  - 日本語の性質上ある程度は妥当だが、教育ツールとして区別を見せたいなら要設計

## Session Log (2026-01-31)

### UI改善
- [x] モバイルビューポート修正（100dvh）- Safari対応
- [x] サイドパネルをデフォルトで閉じる
- [x] サイドパネル再構成
  - Tense/Aspect図をGrammarパネルに移動
  - Timelineタブは「Coming soon」表示
- [x] 文法パネルのスタイル統一（viz-section）
- [x] ブロックモード時はLinguaScriptバーを非表示
- [x] 出力欄下のパディング増加

### 出力パネル
- [x] 英語/日本語ラベルをローカライズ対応
- [x] テキスト読み上げ機能（Web Speech API）
- [x] 再生ボタン: 絵文字→SVG、青色統一（#5c8bc4）
- [x] 再生ボタンに「Play」ラベル追加・ローカライズ

### 日本語レンダラー
- [x] 名詞句の空白除去（join('')）
- [x] 量化詞の翻訳追加
- [x] 否定極性副詞（まだ/もう）
- [x] 独立所有代名詞
- [x] 複合量化詞・分配詞の日本語翻訳追加
  - 分配詞: each, every, either, any
  - 複合量化詞: a_few, a_little, a_lot_of, plenty_of, etc.
- [x] 前置詞句サポート
  - 動詞の前置詞句: "go to the park" → "公園に行く"
  - 名詞の前置詞句修飾: "the apple on the table" → "テーブルの上のりんご"
  - 前置詞→後置詞マッピング（in→で, to→に, from→から, with→と, etc.）
- [ ] 否定限定詞（no, neither）の日本語対応
  - 限定詞の否定情報を動詞の polarity に伝播させる必要あり
  - 例: "no apples" → 「りんごがない」（動詞で否定）

### 日本語VP等位接続
- [x] Phase 1: 基本的な等位接続
  - and: テ形接続（食べて飲む）
  - or: 終止形+か接続（食べるか飲む）
- [x] Phase 2: VP個別の否定
  - ないで形（食べないで飲む）
- [x] Phase 3: 節レベルの否定
  - De Morgan適用（conjunction無視）
  - not(and(A,B)) / not(or(A,B)) → 「Aないで Bない」
- [x] 異なる主語のハンドリング
  - 「私は食べて、父が走る」
- [x] 2パス方式へリファクタリング
  - collectVPChain: 情報収集
  - renderVPChainItem: レンダリング

### ユーザー辞書拡張機能
- [x] 拡張辞書モジュール（dictionary-ext.ts）
  - localStorage永続化
  - インポート/エクスポート（JSONパッケージ形式）
  - 変更リスナー機構
- [x] 辞書パネルUI（DictionaryPanel.tsx）
  - 動詞/名詞/形容詞/副詞のカテゴリ別管理
  - 単語追加・削除機能
  - Valency設定（役割・必須/任意）
  - 自動活用形生成（規則動詞）
- [x] Blockly連携
  - 拡張ブロックの動的生成（verb_action_ext等）
  - ツールボックス自動更新
  - 同一セクション内に配置（ベースブロック直後）
- [x] AST/レンダラー連携
  - 拡張動詞のAST生成対応
  - 拡張名詞のAST生成対応
  - 英語レンダラー対応（辞書lookup: ベース→拡張）

### 英語レンダラー修正
- [x] Ditransitive語順修正（double object construction）
  - 修正前: "He gives a green apple me"
  - 修正後: "He gives me a green apple"
  - `sortValencyForEnglish()` で recipient → theme 順にソート
  - 辞書の意味構造（agent, theme, recipient）は維持
  - 設計メモ: 受動態・使役態は構造変換レイヤーで対応予定

### 辞書追加
- [x] telescope, camera（object）
- [x] colorless（color adjective）

## Future Enhancements

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
- [ ] 敬語処理 - 日本語レンダラー向け
  - 丁寧語・尊敬語・謙譲語

### Coordination
- [x] 否定とのスコープ相互作用（De Morgan）- 日本語レンダラー実装済み
  - "I don't eat apples and oranges" の解釈曖昧性
- [ ] 等位接続の構造的曖昧性
  - "I saw the man with the telescope and the camera"

### Multilingual & Language Parameters

#### Output UI
- [x] 2パネル出力構成（英語/日本語）
  - 架空言語対応時に再検討

#### 言語別レンダラー
- [x] 日本語レンダラー（基本実装）
  - 語彙リソース (lexicon.ts) - 概念ID → 日本語表層形マッピング
  - SOV語順、格助詞選択
  - 設計: 英語ハブ（dictionary-core.ts）に日本語モジュールが接続
- [x] 日本語レンダラー（動詞活用）
  - 動詞タイプ: 五段/一段/サ変/カ変 (lexicon.ts)
  - 活用形: タ形、テ形、ナイ形、ナカッタ形 (conjugation.ts)
  - 時制・相・否定の統合 (renderer.ts)
- [x] 日本語レンダラー（拡張）
  - モダリティ（〜できる、〜かもしれない）
- [x] 拡張辞書方式（単語・言語追加の基盤）- 実装済み
  - ベース辞書を汚さず拡張可能な設計
  - dictionary-ext.ts による拡張（localStorage永続化）
  - lookup: ベース → 拡張 → フォールバック の順で参照
  - 詳細はSession Log「ユーザー辞書拡張機能」参照
- [ ] パラメータベースのレンダラー設計（架空言語ビルダー）
  - チョムスキー「原理とパラメータ」理論に基づく
  - 語順パラメータ: SVO, SOV, VSO, VOS, OSV, OVS
  - 主要部位置: head-initial / head-final
  - Pro-drop: 主語省略可否
  - Wh移動: 疑問詞の文頭移動
  - 冠詞有無 / 格助詞使用
  - 教育ツールとしての活用（同じASTから異なる語順で出力）
  - 設計方針: dictionary-core.ts を使わずゼロベースで構築
    - 架空言語は独自の概念体系を持つ可能性
    - src/renderer/conlang/ に独立モジュールとして実装
- [ ] LinguaScriptパーサー（双方向変換の基盤）
  - BNF文法に基づく実装
  - AST ↔ LinguaScript の等価変換

### LinguaScript Syntax Enhancement
- [ ] フィールド必須/任意マーカー: `*field` / `field?` （手書き入力・バリデータ実装時に必要）

### Logic Extension - 推論機能（未実装）
- [ ] LLM連携API - LinguaScriptをLLMに送信してクエリ結果を取得
  - question() をクエリとして解釈
  - ?who, ?what 等を変数として束縛
- [ ] 閉世界仮説（CWA）vs 開世界仮説（OWA）の選択オプション
- [ ] 外部知識連携 - 未知の事実をGoogle/Wikidataに問い合わせ
  - LinguaScript → SPARQL 変換（Wikidata連携）
  - 意味役割がKnowledge Graphスキーマに対応

## Deferred（設計検討が必要）

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
- [ ] 複数Wh疑問詞の in-situ 処理
  - 仕様: 複数Wh語がある場合、最初の1つだけ文頭移動、残りは in-situ
  - 例: `sentence(present+simple(locative(?where, run(agent:?who))))` → "Who runs where?"
  - 現状: レンダラーに順序制御ロジックがない
- [ ] 時制-相制約チェック（バリデーション）
  - 仕様: 時間副詞と時制・相の適切性を検証
  - 例: yesterday + present perfect は非文法的
  - 現状: AST生成時に制約検証がない
- [ ] 意味役割 instrument/beneficiary の活用検討
  - 仕様では定義されているが、ほぼ未使用
  - 現状: pp() with "with", "for" で代替
  - 検討: 明示的な意味役割 vs 前置詞句の使い分け方針
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

## Out of Scope（単文スコープ外）

- 関係節 (the man who ate...)
- 複文接続 (but, because による文の接続)
- 従属節 (if, when, although...)
