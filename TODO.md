# TODO

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

### Coordination
- [ ] 否定とのスコープ相互作用（De Morgan）
  - "I don't eat apples and oranges" の解釈曖昧性
- [ ] 等位接続の構造的曖昧性
  - "I saw the man with the telescope and the camera"

### Multilingual & Language Parameters

#### Output UI
- [ ] 2パネル出力構成
  - 左: Primary Output（ターゲット言語）
  - 右: Reference Output（UI言語で意味確認）
  - 例: 英語学習時 → 左:English / 右:日本語訳
  - 例: 架空言語時 → 左:Conlang / 右:UI言語で意味確認

#### 言語別レンダラー
- [x] 日本語レンダラー（基本実装）
  - 語彙リソース (lexicon.ts) - 概念ID → 日本語表層形マッピング
  - SOV語順、格助詞選択
  - 設計: 英語ハブ（dictionary-core.ts）に日本語モジュールが接続
- [x] 日本語レンダラー（動詞活用）
  - 動詞タイプ: 五段/一段/サ変/カ変 (lexicon.ts)
  - 活用形: タ形、テ形、ナイ形、ナカッタ形 (conjugation.ts)
  - 時制・相・否定の統合 (renderer.ts)
- [ ] 日本語レンダラー（拡張）
  - 敬語処理（丁寧語・尊敬語・謙譲語）
  - モダリティ（〜できる、〜かもしれない）
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
