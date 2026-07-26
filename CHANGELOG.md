# CHANGELOG

> **Note**: このファイルは [TODO.md](./TODO.md) と連動しています。機能実装完了時は両方を更新してください。

## 2026-07-27

### 等位接続の統一とカンマの修正

VP の等位接続を連結リストから n項ツリーに変え、名詞句と対称な表現にした。
**LinguaScript / 英語の出力が変わる意図的な変更。**

#### 根本原因: 3つの異なる「繋ぐ」表現

同じ「and/or で2つを繋ぐ」概念に AST 上で3つの形があった。

| 機構 | 修正前 | 入れ子 |
|---|---|---|
| NP 等位 | `CoordinatedNounPhraseNode { conjunction, conjuncts[] }` | n項ツリー |
| VP 等位 | `VerbPhraseNode.coordinatedWith { conjunction, verbPhrase }` | **二項連結リスト** |
| 命題論理 | `logicOp { operator, leftOperand?, rightOperand? }` | 二項ツリー |

VP だけが鎖だったため、左入れ子と右入れ子が同じ鎖に潰れていた。

```
修正前: or(and(A,B), C) と and(A, or(B,C)) が
        どちらも eat ─and→ drink ─or→ build になり、
        LinguaScript も英語も同一だった
```

とくに LinguaScript は `or(and(A,B),C)` を `and(A, or(B,C))` と誤って出力しており、
「意味を一意に確定させる中間表現」という位置づけに反していた。

#### 変更内容

- [x] `CoordinatedVerbPhraseNode` を導入（`CoordinatedNounPhraseNode` と対称な n項ツリー）
  - `ClauseNode.verbPhrase` は `VerbPhraseConjunct`（単一 or 等位接続）の union に
  - `VerbPhraseNode.coordinatedWith` は廃止
  - 同じ接続詞が続く場合は1グループに畳む（`and(and(A,B),C)` → `and(A,B,C)`）
- [x] `logicOp` のオペランドも等位接続を取れるように型を拡張
- [x] `NOT` のオペランド構築を二項演算子と統一（Phase 2 で保留していた項目）
- [x] 4つのレンダラーを対応
  - 英語: 鎖の走査（`appendCoordinatedVP`）をツリー再帰に置き換え。
    命令文専用の等位接続処理も一本化
  - LinguaScript: `and(A, B, C)` のように n項で出力
  - 日本語: correlative がなく語順が線形なので、ツリーを表層順に平坦化して
    既存の2パス方式（テ形接続など）を活かす
- [x] `english/coordination.ts` を作り直し、**構造を受け取る API** に
  - 修正前は要素の並びと接続詞から構造を推測しており、
    `groupElements()` が先頭要素の接続詞を `'and'` にデフォルトしていたため
    純粋な OR でもグループが割れてカンマが入っていた

#### 出力の変化

```
I eat, or drink.               →  I eat or drink.
I eat an apple, or an orange.  →  I eat an apple or an orange.
Do you drink tea, or coffee?   →  Do you drink tea or coffee?
I eat apple and orange, or banana. → I eat both apple and orange, or banana.
```

カンマの規則を構造から決めるようにした。

| 条件 | カンマ |
|---|---|
| 3要素以上 | 打つ（オックスフォードカンマ） |
| 末尾以外に入れ子グループがある | 打つ |
| 2要素目以降が独立した節（主語が違う） | 打つ（"I eat, and my father runs."） |
| それ以外 | 打たない |

入れ子は correlative で範囲を明示する。

```
or(and(A,B), C)  →  "Both I eat and drink, or build."     ← both が内側を括る
and(A, or(B,C))  →  "I eat and either drink or build."     ← either が内側を括る
```

### Refactoring Phase 3: blocks/definitions.ts の分割

1,703行の1ファイル（ブロック定義41個 + ツールボックス）を13ファイルに分割した。
振る舞いは変えていない（既存スナップショットに差分なし）。

```
src/blocks/
├── index.ts             28行  登録の集約（副作用 import の受け口）+ 公開 API
├── shared.ts            79行  COLORS / msg() / labelValidator
├── blockData.ts         63行  TimeChip・限定詞のデータ（Blockly 非依存）
├── prepositions.ts      42行  前置詞データ（動詞用・名詞用の両方が使う）
├── sentence.ts         206行  time_frame / 各種ラッパー / time_chip_*
├── verbs.ts             79行  カテゴリ別の動詞ブロック
├── verbModifiers.ts    233行  副詞ラッパー / 前置詞句 / 等位接続
├── nouns.ts            212行  代名詞 / カテゴリ別の名詞
├── determiner.ts       238行  determiner_unified
├── nounModifiers.ts    112行  形容詞 / 前置詞句 / 等位接続
├── question.ts          68行  choice_question / wh_*
├── logic.ts            116行  fact_wrapper / logic_*
├── extensions.ts       156行  拡張辞書ブロックの動的生成
└── toolbox.ts          210行  createToolbox()
```

- `index.ts` が import 順を保証する（データ → ブロック定義 → 拡張 → ツールボックス）。
  利用側は `import '../blocks'` するだけでよい
- `blockData.ts` を Blockly 非依存にしたので、`astGenerator` が
  `TIME_CHIP_DATA` / `DETERMINER_DATA` を参照するのにブロック定義を読み込まなくて済む
- 検証: 691テストに加え、実際にブラウザで起動して**ツールボックス8カテゴリ・
  計55ブロックすべてが登録されている**こと、初期ブロック・AST タブ・
  コンソールエラーなしを確認した（副作用 import の順序依存が効いているかの確認）

### Refactoring Phase 2: 巨大関数の分割

振る舞いは変えていない（既存スナップショットに差分なし）。

#### `astGenerator.parseVerbChain`: 426行 → ディスパッチャ39行 + ハンドラ6個

- 同じ形をした分岐を仕様データにまとめた
  - `ADVERB_WRAPPERS`: 副詞ラッパー5種（frequency / manner / locative / time_adverb / wh_adverb）
  - `BINARY_LOGIC`: 二項の命題論理4種（AND / OR / IF / BECAUSE）。演算子と入力名だけが違い中身は同一だった
  - `VERB_COORDINATION`: 等位接続2種
- `resolveWhAdverb()` で ?where / ?when / ?how の振り分けを分離

#### `english/conjugation.conjugateVerb`: 322行 → エントリ16行 + ハンドラ10個

- `conjugateVerb` 内のクロージャ（record / getBeForm / getHaveForm / getNotPart / join）が
  すべての分岐から暗黙に参照されていたため、`ConjugationScope` にまとめて明示的に渡す形にした
- `ASPECT_HANDLERS` で相ごとのハンドラへディスパッチ

#### コンポーネントの整理

- [x] 初期ブロック配置（約70行）を `blocks/initialWorkspace.ts` へ切り出し
  - 手続き的な組み立てを宣言的な `INITIAL_BLOCKS` 仕様に置き換えた
  - `BlocklyWorkspace.tsx` は 312行 → 173行（Phase 1 の削除分と合わせて）
  - 仕様はヘッドレスで検証（`initialWorkspace.test.ts`）。SVG 経路は
    実際にブラウザで起動して初期表示・AST タブ・コンソールエラーなしを確認済み

#### Phase 2 で見つかった問題（未修正・現状をスナップショットで固定）

- [ ] モダリティの迂言形式が単純相にしか対応しておらず、英語が壊れる
  - `obligation + past + progressive` → `"I be eating an apple."`（助動詞が落ちる）
  - 同 + 否定 → `"I not be eating an apple."`
- [ ] `parseNotLogic` のオペランド構築が二項演算子と揃っていない（polarity と等位接続の扱い）
- [ ] 副詞ラッパーのラベル行スキップが `labelValidator` により到達不能な防御コードになっている

### Refactoring Phase 1: 死んだコードの整理

アプリの振る舞いは変えていない（AST タブの復活のみ UI 変更）。差し引き -301行。

#### 復活

- [x] AST ビュー（`EditorMode` の `'ast'`）にタブを追加
  - 表示分岐は元からあったが切り替え UI がなく到達不能だった
  - `TAB_AST` は3ロケールとも既に定義済みで、欠けていたのはボタンだけ

#### 削除

- [x] `components/VisualizationPanel.tsx`（`App.tsx` でコメントアウト済みだった）
- [x] `renderer/index.ts`（どこからも import されないバレル）
- [x] `BlockChange` 収集経路（約90行）
  - `BlocklyWorkspace.tsx` の `getReadableFieldName()` / `handleBlockChange()` /
    `pendingChangesRef` / `onBlockChanges` prop、`App.tsx` の `_blockChanges`、
    `types/grammarLog.ts` の `BlockChange` 型
  - 2026-01-25 に「Your Changes」パネルとして追加され、2026-01-27 のサイドパネル移設で
    表示側だけが落ちた残骸。復活させるなら `DerivationTracker.diff()` の上で作り直す
- [x] `astGenerator.generateAST` / `english/renderer.renderToEnglish`（どちらも別関数のみ使用）
- [x] `types/grammarLog.ts` の `GrammarLogCollector` / `formatLogStructured` /
      `formatLogEnglish` / `FormattedLog`
- [x] `types/schema.ts` の `CoordinatedVerbPhraseNode` / `DeterminerConfig`
  - VP 等位接続は `coordinatedWith` の連結リストで表現しているため専用ノードは不要
- [x] `japanese/renderer.ts` の default export、`definitions.ts` の未使用定数3つ

#### 重複の解消

- [x] `blocks/definitions.ts` が `dictionary-core.ts` のヘルパーを再実装していた
  - ローカル定義の `findNounCore` / `getVerbCoresByCategory` を削除して import に置換
  - インラインの `nounCores.filter(...)` / `adjectiveCores.filter(...)` を
    `getNounCoresByCategory()` / `getAdjectiveCoresByCategory()` に置換
  - これらの export が「未使用」に見えていた原因でもあった

#### 未参照 export の整理（67件 + 型25件 → 0件）

- [x] ファイル内でしか使われないものは `export` を外して内部化
  - `japanese/index.ts` のバレルを `renderToJapanese` のみに絞る
  - `lexicon.ts` の翻訳マップ12個、`conjugation.ts` の活用ヘルパー4個、
    `dictionary-en.ts` の生データ配列4個、`det-rules-en.ts` / `nounPhrase.ts` の型 ほか
- [x] 意図的に残すものは `/** @public 理由 */` を付けて knip の対象外にした
  - 辞書モジュールの API（`findAdjectiveCore` など）— 削除すると比較級・最上級 108件などの
    辞書データが到達不能になり巻き添えで失われるため
  - `renderer/types.ts` の `RenderContext` 一式 — Phase 4-1 で引き回す予定
- [x] `npm run knip` を CI で失敗させるようにした（レポートのみ → ゲート）

### Refactoring Phase 0: テスト・静的解析の基盤整備

リファクタリングの安全網。**アプリの振る舞いは変えていない**。
計画全体は [docs/REFACTORING-PLAN.md](./docs/REFACTORING-PLAN.md)、構造の解説は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

- [x] Vitest 導入（`vitest.config.ts`、環境は `node`）
- [x] ゴールデンテスト 2層（計583テスト / 118スナップショット）
  - レイヤーA `src/test/renderers.test.ts` — AST → 英語 / 日本語 / LinguaScript / 導出ログ（86ケース）
  - レイヤーB `src/test/astGenerator.test.ts` — Blockly ブロック木 → AST（32ケース）
  - ヘルパー: `builders.ts`（AST）、`workspace.ts`（ヘッドレス Blockly）、`cases.ts`（ケース表）
  - ヘッドレス Blockly が Node で動作。イベントをフラッシュすれば `determiner_unified` の限定詞自動補正まで検証できる
- [x] ESLint + typescript-eslint 導入（`eslint.config.js`）
- [x] knip 導入（`knip.json`）— 未参照 export の棚卸し（レポート専用）
- [x] GitHub Actions CI（`.github/workflows/ci.yml`）— tsc / eslint / vitest / build
- [x] npm scripts 追加: `test` / `test:watch` / `lint` / `check` / `knip`

### Lint 対応（振る舞い不変）

スナップショットに変化がないことで振る舞い不変を確認済み。

- [x] `prefer-const` 4件
- [x] `no-case-declarations` 6件（`japanese/conjugation.ts` の `case` をブロックで囲む）
- [x] `no-this-alias` 1件（Blockly パターンのため理由コメント付きで inline disable）
- [x] `package.json` の `"main": "index.js"` を削除（存在しないファイルへの参照）

### Phase 0 で発見した不具合の修正

Phase 0 のゴールデンテストが検出した6件をすべて修正した。

#### 入れ子 VP 等位接続で項が消えるバグ

- [x] `or(and(A, B), C)` で B が AST から丸ごと消える問題を修正
  - `coordinatedWith` は連結リストなので、上書きせず**末尾に追加**する `appendCoordination()` を追加
  - `VerbChainResult → VerbPhraseNode` の変換が3箇所（`parseTimeFrameBlock` / fact の timeless 分岐 /
    `toVerbPhraseWithLogic`）に複製され、いずれも同じ上書きをしていたため
    `toVerbPhraseNode()` に共通化
  - AST は `eat ─and→ drink ─or→ run` の鎖になる
  - 英語は `coordination.ts` の設計どおり correlative で構造を明示: "Both I eat and drink, or run."

#### 日本語レンダラー

- [x] 繋辞の形容詞を日本語訳するよう修正（「私はhappyである」→「私は幸せである」）
  - 辞書の値は**連体形**（「幸せな」「悲しい」）なので、述語で使うには変換が必要
  - `analyzeAdjective()` を追加し、連体形から語幹・連用形・活用型（イ／ナ／その他）を求める
  - `conjugateAdjectivalPredicate()` を追加。イ形容詞は繋辞を付けず形容詞自体が活用する
    - 「私は悲しい」「私は悲しかった」「私は悲しくない」「私は悲しくなかった」
    - ナ形容詞・ノ形容詞は語幹 + である（「幸せである」「本当である」）
  - be 以外の動詞に係る形容詞は連用形にする（「私は幸せに見える」）
- [x] 命題論理（`logicOp`）に対応
  - AND=「〜、かつ〜」/ OR=「〜、または〜」/ NOT=「〜ということはない」
  - IF=「〜ならば、〜」/ BECAUSE=「〜ので、〜」（英語と違い日本語は原因が先）
  - De Morgan: `NOT(OR(P, Q))` →「Pということも、Qということもない」
- [x] モダリティ否定（`modalPolarity`）を反映するよう修正
  - obligation: 「食べなければならない」→「食べなくてもいい」（EN: don't have to）
  - permission: 「食べてはいけない」（EN: may not）
  - 日本語はモダリティ自体が否定を担うため、動詞否定と表層で区別しない
- [x] モダリティ使用時に相が落ちる問題を修正
  - 進行相はテ形 + いる を土台にする（「食べていることができる」）
  - 完了相は過去と同形にする（`conjugateEntry` と同じ規則）
- [x] 未使用の `verb` 変数を削除（2パス方式リファクタの残骸）
  - `renderVerbWithCoordination()` が同じ lemma・同じ文脈で `conjugate()` を呼ぶため、
    例外挙動を含めて完全に冗長だった

## 2026-02-01

### DET Block Improvements
- [x] Fix DET auto-correction not working with adjectives between DET and noun
  - `getConnectedNounInfo()` now traverses adjective chains to find noun
  - Enables proper countable/uncountable detection for `DET → adjective → noun`

### Initial Blocks Update
- [x] Change initial blocks from "I run." to "I eat an apple."
  - More comprehensive example with transitive verb and noun phrase
- [x] Add time_chip_abstract ([Present]) to initial blocks

### Japanese Renderer
- [x] Add Japanese translations for compound quantifiers and distributives
  - Distributives: each → それぞれの, every → すべての, either → どちらかの, any → どんな
  - Compound quantifiers: a_few → いくつかの, a_little → 少しの, a_lot_of → たくさんの, etc.
  - Note: no/neither require special negation handling (deferred)
- [x] Add prepositional phrase support
  - Verb prepositional phrases: "go to the park" → "公園に行く"
  - Noun prepositional modifiers: "the apple on the table" → "テーブルの上のりんご"
  - Preposition to postposition mapping in lexicon.ts (30+ prepositions)
  - `renderPrepositionalPhrase()` for verb modifiers
  - `renderPrepositionalPhraseAsModifier()` for noun modifiers with 連体形

## 2026-01-31

### User Dictionary Extension
- [x] Extension dictionary module (`dictionary-ext.ts`)
  - localStorage persistence for user-defined words
  - Import/export in JSON package format
  - Change listener mechanism for reactive updates
- [x] Dictionary Panel UI (`DictionaryPanel.tsx`)
  - Category tabs: Verbs, Nouns, Adjectives, Adverbs
  - Add/remove words with valency settings
  - Auto-generate regular verb conjugations
  - Export user dictionary as JSON
- [x] Blockly integration
  - Dynamic block generation (`verb_action_ext`, `noun_human_ext`, etc.)
  - Automatic toolbox update on dictionary changes
  - Extension blocks placed alongside base blocks in same section
- [x] AST & Renderer support
  - Extension verbs/nouns recognized in AST generation
  - Dictionary lookup: base → extension → fallback

### English Renderer Fix
- [x] Ditransitive word order (double object construction)
  - Fixed: "He gives a green apple me" → "He gives me a green apple"
  - Added `sortValencyForEnglish()` to order recipient before theme
  - Semantic structure in dictionary preserved (agent, theme, recipient)
  - Surface order handled by renderer (recipient → theme)

### Dictionary Additions
- [x] Added `telescope`, `camera` (objects)
- [x] Added `colorless` (color adjective)

### Japanese VP Coordination
- [x] Basic VP coordination
  - and: テ形接続 (`食べて飲む`)
  - or: 終止形+か接続 (`食べるか飲む`)
- [x] VP-level negation with ないで形
  - `and(not(eat), drink)` → `食べないで飲む`
- [x] Clause-level negation (De Morgan)
  - `not(and(eat, drink))` → `食べないで飲まない`
  - `not(or(eat, drink))` → `食べないで飲まない`
- [x] Different subject handling
  - `私は食べて、父が走る。` (comma + subject + が)
- [x] Refactor to 2-pass approach
  - `collectVPChain`: Phase 1 - collect chain info
  - `renderVPChainItem`: Phase 2 - render based on collected info
  - `VPChainItem` interface: isFirst, isLast, isSameGroupAsPrev, vpPolarity

### English VP Coordination Fix
- [x] Subject omission for same-group VPs
  - Fixed: "I eat and I drink" → "I eat and drink"
  - Added `omitSubject` parameter to `renderSingleVerbPhrase`

## 2026-01-30

### Grammar Panel Improvements
- [x] Do-support logging for negative declarative sentences
  - Grammar panel now shows `do → does` instead of `eat → eats` for "He does not eat"
  - Added DO_SUPPORT_NEGATIVE localization keys
- [x] Agreement logging fix for interrogative sentences
  - Affirmative questions now correctly show `do → does` instead of `eat → eats`
  - Added `isQuestion` flag to ConjugationContext
  - Created `usesDoSupport = isNegative || isQuestion` logic

### Bug Fixes
- [x] Null output bug for placeholder verbs
  - Fixed "null" appearing in output for `___()` placeholder verbs
  - Added null check for `result.auxiliary` before string interpolation

### VP Coordination & Polarity
- [x] Double negation support for VP coordination
  - `not(and(not(eat), eat))` → "I do not not eat and I do not eat"
  - Added `doubleNegation` flag to ConjugationContext
  - Updated `renderSingleVerbPhrase` to accept doubleNegation parameter
- [x] VP-level polarity support for verb coordination
  - Coordinated VPs can now have individual polarity
  - `and(not(eat), drink)` → "I do not eat and I drink"

### Code Cleanup
- [x] Remove unused rules/ folder and coordination utilities
- [x] Remove unused assembleDeclarative and assembleInterrogative functions

## Previous Releases

### Core Sentence Types
- [x] Declarative sentences (SVO order)
- [x] Interrogative sentences (Yes/No questions with do-support)
- [x] Wh-questions (?who, ?what, ?where, ?when, ?how)
- [x] Imperative sentences

### Tense & Aspect System
- [x] Present/Past tense
- [x] Simple/Progressive/Perfect/Perfect Progressive aspects
- [x] Tense + Aspect combinations (12 total)

### Negation
- [x] Clause-level negation with do-support
- [x] VP-level negation for coordination

### Modality
- [x] Modal verbs (can, could, will, would, shall, should, may, might, must)
- [x] Modal negation

### Noun Phrases
- [x] Determiners (a, the, this, that, etc.)
- [x] Adjectives (prenominal position)
- [x] Proper nouns
- [x] Pronouns (personal, demonstrative, indefinite)
- [x] Quantifiers (some, any, all, etc.)

### Verb Phrases
- [x] Transitive/Intransitive verbs
- [x] Ditransitive verbs (give, send, etc.)
- [x] Copular verbs (be)
- [x] Adverbs (manner, frequency, time)
- [x] Prepositional phrases

### Coordination
- [x] NP coordination (and, or)
- [x] VP coordination (and, or)
- [x] Adjective coordination

### Grammar Derivation Logging
- [x] Morphological transformations (agreement, tense)
- [x] Syntactic operations (do-support, Wh-movement)
- [x] Multi-locale support (en, ja, ja-hira)

### UI Components
- [x] Block Editor (visual AST editing)
- [x] LinguaScript display (text representation)
- [x] Grammar Console (derivation logs)
- [x] TimeChip (tense/aspect selection)
