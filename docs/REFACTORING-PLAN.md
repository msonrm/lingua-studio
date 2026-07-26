# リファクタリング計画

> 作成日: 2026-07-26 / 計画時の対象コミット: `c1628f9`
>
> **進捗**: Phase 0 ✅ / Phase 1 ✅ / Phase 2 ✅ / Phase 3 ✅ / Phase 4 未着手（2026-07-26 時点）
> 各 Phase の実施結果は [CHANGELOG.md](../CHANGELOG.md) を参照。

前提となる構造の理解は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照。

---

## 基本方針

Lingua Studio のレンダラー層は **AST（`SentenceNode`）を受け取って文字列を返す純関数**で構成されている。
入出力が完全に決定的なので、**現在の出力をそのままゴールデンテストとして固定できる**。これがこのプロジェクト最大の資産であり、リファクタリングの順序を決める。

したがって:

1. **安全網を先に張る**（Phase 0）— テストなしで 426行の関数を触るのは、壊れても気づけない
2. **削るものから削る**（Phase 1）— 未使用コードを残したまま分割すると、無駄な設計判断が増える
3. **機械的な分割**（Phase 2–3）— 振る舞いを変えずに構造だけ変える
4. **設計変更**（Phase 4）— 最も価値が高く、最もリスクが高い。テストが厚くなってから

---

## Phase 0: 安全網の整備 ✅ 完了（2026-07-26）

実施結果は本節末尾の「Phase 0 実施結果」を参照。以下は当初の計画。



**目的**: 以降のすべての変更で「壊れたら即座に分かる」状態を作る。振る舞いは1行も変えない。

### 0-1. Vitest 導入

- `vitest` を devDependencies に追加、`npm run test` / `test:watch` を追加
- **環境は `node` で足りる**（要件を確認済み）:
  - `dictionary-ext.ts` は localStorage をトップレベルで触らない。`initDictionaryExt()` は `App.tsx` からの明示呼び出し
  - レンダラー3種は DOM に依存しない
  - jsdom が必要なのはコンポーネントテストのみ（Phase 4 まで不要）

### 0-2. ゴールデンテスト（2層）

**レイヤー A — レンダラー（DOM 不要、確実に動く）**

```
AST フィクスチャ  ──►  renderToEnglishWithLogs()  ──►  出力 + 導出ログ をスナップショット
                 ├─►  renderToJapanese()         ──►  出力をスナップショット
                 └─►  renderToLinguaScript()     ──►  出力をスナップショット
```

フィクスチャは CHANGELOG.md の実装済み機能一覧をそのままケース表にする。カバーすべき軸:

| 軸 | ケース |
|---|---|
| 文型 | 平叙 / Yes-No 疑問 / Wh 疑問（?who ?what ?where ?when ?how）/ 命令 / fact |
| 時制×相 | 現在・過去 × simple / progressive / perfect / perfectProgressive（12通り） |
| 否定 | 節レベル / VP レベル / 二重否定 / モダリティ否定 |
| モダリティ | can, could, will, would, shall, should, may, might, must |
| 名詞句 | 限定詞 / 形容詞 / 固有名詞 / 代名詞 / 量化詞 / 前置詞句修飾 |
| 動詞句 | 自動詞 / 他動詞 / 二重目的語 / 繋辞 / 副詞 / 前置詞句 |
| 等位接続 | NP / VP / 形容詞、and・or、入れ子、主語省略、異主語 |
| 日本語固有 | テ形接続 / ないで形 / De Morgan / 格助詞選択 / 前置詞→後置詞 |
| Logic Ext | AND / OR / NOT / IF / BECAUSE |

> **注**: 現在の出力が「正しい」とは限らない。ゴールデンテストは*正しさ*ではなく*変化の検出*を保証する。既知のバグ（TODO.md の未対応項目）も現状のまま固定し、コメントで印を付ける。

**レイヤー B — astGenerator（Blockly 依存）**

`generateMultipleAST(workspace)` は `Blockly.Workspace` を取る。ヘッドレス（`new Blockly.Workspace()` + `Blockly.serialization.workspaces.load()`）で動作するかは**要検証**。

- 動く場合: ワークスペース JSON フィクスチャ → AST をスナップショット。`localStorage['lingua-studio-workspace']` の形式をそのまま流用できる
- 動かない場合: jsdom 環境に切り替えるか、Phase 2 で `parseVerbChain` を Blockly 非依存の中間表現に対して動くよう分離してからテストする

**フィクスチャの作り方**: アプリを `npm run dev` で起動 → 各ケースをブロックで組む → devtools で `localStorage.getItem('lingua-studio-workspace')` を保存。手書きより速く、実際の使われ方と一致する。

### 0-3. 静的解析

- **ESLint + typescript-eslint** — `tsc` は型しか見ない。未使用 export・危険な `any`・`==` などを拾う
- **knip または ts-prune** — 未参照 export 47件（§ARCHITECTURE 9）を継続的に検出。`tsconfig` の `noUnusedLocals` では検出できない領域
- **Prettier**（任意）— 差分ノイズを減らす。導入するなら全ファイル一括整形を独立コミットにする

### 0-4. CI（任意だが推奨）

GitHub Actions で `tsc && vitest run && eslint` を PR ごとに実行。既存の `claude/*` ブランチ + PR 運用にそのまま乗る。

**Phase 0 の完了条件**: 上記テストが全部グリーンで、`npm run build` の出力が現在と同一。

---

## Phase 0 実施結果（2026-07-26）

### 導入したもの

| 項目 | 内容 |
|---|---|
| Vitest 4.1 | `vitest.config.ts`、環境は `node`（当初の想定どおり jsdom 不要） |
| レイヤーA | `src/test/renderers.test.ts` — 86ケース、AST → 英語 / 日本語 / LinguaScript / 導出ログ |
| レイヤーB | `src/test/astGenerator.test.ts` — 32ケース、Blockly ブロック木 → AST |
| ヘルパー | `builders.ts`（AST）、`workspace.ts`（ヘッドレス Blockly）、`cases.ts`（ケース表） |
| ESLint 10 | `eslint.config.js` — typescript-eslint + react-hooks + react-refresh |
| knip 6 | `knip.json` — 未参照 export の棚卸し（レポート専用） |
| CI | `.github/workflows/ci.yml` — tsc / eslint / vitest / build を PR ごとに実行 |
| npm scripts | `test` / `test:watch` / `lint` / `check` / `knip` |

**合計 583 テスト / 118 スナップショット、すべてグリーン。**

### 想定と違った点

- **ヘッドレス Blockly が完全に動いた。** `new Blockly.Workspace()` は Node 環境で動作し、`blocks/definitions.ts` の副作用 import も問題ない。当初「動かない場合は jsdom へ」と書いていたが不要だった
- **さらに、ブロックの `onchange` も検証できた。** Blockly はイベントを非同期にフラッシュするため、接続直後は `determiner_unified` の `CENTRAL` が `"__none__"` のままだが、1 tick 待つと `"a"` になる。つまり**限定詞の自動補正までテストできる**。`buildWorkspace()` が内部で待っている
- **ESLint の指摘が 14件しかなかった。** `any` の警告はゼロ。既存コードは想定よりずっと綺麗だった
- **knip は手動スキャンより多く検出した**（未使用ファイル2 / export 67 / 型25）。`definitions.ts` の `toolbox` や `japanese/renderer.ts` の default export など、grep ベースの調査では拾えなかったものがある

### Phase 0 で見つかった不具合（**すべて 2026-07-26 に修正済み**）

Phase 0 の時点では現状固定に留め、その後まとめて修正した。修正内容は CHANGELOG.md を参照。
以下は発見時の記録。

1. **入れ子 VP 等位接続で項が消える（重度）** — `or(and(A, B), C)` で B が AST から丸ごと消える。
   `astGenerator.ts` の `parseTimeFrameBlock:303` と `toVerbPhraseWithLogic:420` が、スプレッドで引き継いだ内側の `coordinatedWith` を外側の `coordination` で無条件に上書きしている。
   CHANGELOG 2026-01-31 の修正は左辺 VP の構築（`parseVerbChain:787`）までは正しいが、その結果を消費する2箇所で潰れる。
   → 再現: `astGenerator.test.ts`「等位接続: VP 入れ子 or(and(A, B), C)」

2. **繋辞の形容詞が日本語訳されない** — 「私はhappyである」。`japanese/lexicon.ts` に `happy → 幸せな` があるのに、`japanese/renderer.ts:435` の `renderFiller()` が `adjectivePhrase` で `translateAdjective()` を通さず `head.lemma` をそのまま返している。
   → 再現: `renderers.test.ts`「動詞句: 繋辞（be + 形容詞）」

3. **日本語レンダラーが `logicOp` を扱わない** — AND / OR / IF / BECAUSE の右オペランドが出力から丸ごと落ちる（NOT も否定されない）。英語のみ対応済み。
   → 再現: `renderers.test.ts` の「Logic Extension」グループ

4. **日本語がモダリティ否定を無視する** — 英語が "don't have to" のとき日本語は「食べなければならない」と肯定のまま。
   → 再現: `renderers.test.ts`「モダリティ: モダリティ否定」

5. **日本語がモダリティ使用時に相を落とす** — 英語 "I can be eating an apple." に対し日本語「食べることができる」。
   → 再現: `renderers.test.ts`「モダリティ: 進行相」

6. **`japanese/renderer.ts` の `verb` 変数が使われていない** — 実際の動詞文字列は `renderVerbWithCoordination()` が生成しており、`conjugate()` の結果は捨てられている。2026-01-31 の2パス方式リファクタの残骸。
   `conjugate()` が例外を投げうるため削除は振る舞いを変える可能性があり、`TODO(Phase 1)` コメント + eslint-disable で温存した。

### Phase 0 で加えた変更（振る舞い不変）

ESLint をグリーンにするための機械的な修正のみ。583 テストのスナップショットに変化がないことで振る舞い不変を確認済み。

- `prefer-const` 4件（`english/renderer.ts` ほか）
- `no-case-declarations` 6件（`japanese/conjugation.ts` の `case` をブロックで囲む）
- `no-this-alias` 1件（`definitions.ts` の Blockly パターン → 理由コメント付きで inline disable）
- `package.json` の `"main": "index.js"` を削除（存在しないファイルへの参照。Vite アプリでは未使用）

残る警告は `react-hooks/exhaustive-deps` 1件（`LinguaScriptView.tsx:62`）のみ。Phase 4 の UI 整理で扱う。

---

## Phase 1: 死んだコードの整理 ✅ 完了（2026-07-26）

実施結果は CHANGELOG.md を参照。以下は当初の計画。

Phase 0 のテストがあれば、削除の安全性は機械的に確認できる。
到達不能なコードは「削除」と「復活」の両方があり、**判断済みの項目**（後述）で個別に決めている。

### 削除するもの

| 対象 | 規模 | 備考 |
|---|---|---|
| `components/VisualizationPanel.tsx` | 75行 | `App.tsx` でコメントアウト済み、完全に未参照 |
| `BlockChange` 収集経路 | 約90行 | `BlocklyWorkspace.tsx` の `getReadableFieldName()` / `handleBlockChange()` + `App.tsx` の `_blockChanges` + `types/grammarLog.ts` の `BlockChange` 型。**収集しているが誰も使っていない** |
| `renderer/index.ts` | 30行 | どこからも import されないバレル |
| `astGenerator.generateAST` | — | `generateMultipleAST` のみ使用 |
| `english/renderer.renderToEnglish` | — | `renderToEnglishWithLogs` のみ使用 |
| `types/schema.ts` の `CoordinatedVerbPhraseNode` / `DeterminerConfig` | — | 未使用の型 |
| 未参照 export 47件 | — | 削除 or `export` を外してモジュール内部化 |

### 判断済みの項目（2026-07-26 決定）

#### `EditorMode` の `'ast'` → **復活させる**

表示分岐（`App.tsx:243`）は既にあるので、ヘッダーの `mode-tabs` に3つ目のタブを追加するだけ。
`TAB_BLOCKS` / `TAB_LINGUASCRIPT` と並ぶ `TAB_AST` を `locales/{en,ja,ja-hira}.ts` の `UIMessages` に追加する（3ロケール × 1キー）。`PLACEHOLDER_AST` は既に存在する。

#### `BlockChange` 収集経路 → **削除する**

**来歴**:

| 時期 | 出来事 |
|---|---|
| 2026-01-25 `b0b1e07` | 「Your Changes」パネルとして追加。狙いは「He → She に変えると同じ 3sg 一致ルールが発動する」ことを学習者に見せること |
| 2026-01-27 `76e7731` | Grammar Console をサイドパネルへ移設。GrammarPanel は導出ステップ表示に置き換わり、**「Your Changes」は移植されずに落ちた**。収集ロジックのみ残存 |

意図的に捨てられたのではなく、リファクタの巻き添えで落ちている。ただし復活ではなく削除を選ぶ理由:

1. **データ品質が低く、そのままでは使えない**
   - `getReadableFieldName()` は14フィールドしかマップせず、未登録のものは生のフィールド名（`OBJECT_VALUE` 等）が UI に漏れる
   - `getBlockLabel()` は11ブロックタイプのみ。`determiner_unified` のような内部名がそのまま出る
   - 接続/切断を `{ field, from: 'connected', to: 'disconnected' }` という型に無理に押し込んでいる
   - **ローカライズされていない**（英語ハードコード）。他の UI は3ロケール対応済みなので、復活には locales へのキー追加が必須 — どのみち作り直しになる
2. **より良い基盤が既にある** — `DerivationStep` は形態論/統語論の区別・操作種類・位置情報を持つ。TODO.md の「Grammar Console 詳細表示モード」もこちらを使う設計
3. **同じ機能領域が二度作られて二度落ちている** — `76e7731` のコミットメッセージには「diff visualization: +/~/× for added/changed/removed rules」とあるが、現在の GrammarPanel に diff 表示はない（`DerivationTracker.diff()` が未使用であることが裏付け）。設計が固まっていない領域なので、中途半端な収集ロジックを残しても三度目に活きない

**削除対象**: `BlocklyWorkspace.tsx` の `getReadableFieldName()` / `handleBlockChange()` と `pendingChangesRef`、`onBlockChanges` prop、`App.tsx` の `_blockChanges` state、`types/grammarLog.ts` の `BlockChange` 型。

**復活させたくなったら**: Blockly のイベントを拾い直すのではなく、`DerivationTracker.diff()` で導出ステップの差分を取る方向で設計する。TODO.md の「Grammar Console 詳細表示モード」と統合できる。

### ⚠ 削除してはいけないもの

`DerivationTracker` の public メソッドのうち **7つが 0 参照**（`diff` / `getStepsByType` / `applyMorphology` / `getDerivation` / `getMorphologySteps` / `getSyntaxSteps` / `setInput`）だが、**これらは残す**。TODO.md の「Grammar Console 詳細表示モード」（DerivationStep を直接参照し、形態論/統語論の区別・操作種類・位置情報を表示）と明確に対応している。

「未使用だが計画がある」ものと「未使用で計画もない」ものは区別すること。Phase 0-3 で knip / ts-prune を導入する際は、これらを ignore 指定する。

---

## Phase 2: 巨大関数の分割 ✅ 完了（2026-07-26）

実施結果は CHANGELOG.md を参照。以下は当初の計画。

振る舞いを変えない機械的な分割。Phase 0 のスナップショットが差分ゼロであることが完了条件。

### 2-1. `astGenerator.parseVerbChain`（426行）→ テーブル駆動

現状は `if (blockType === 'X') { ... }` が十数個並ぶ構造。**各分岐がほぼ同型**であることが分割の鍵:

```
1. block.getFieldValue(FIELD) で値を取る
2. block.getInputTargetBlock('VERB') で内側を取る
3. parseVerbChain(inner) で再帰
4. return { ...innerResult, someArray: [newItem, ...innerResult.someArray] }
```

**分割案**:

| グループ | 対象ブロック | 方針 |
|---|---|---|
| 副詞ラッパー | `frequency_wrapper`, `manner_wrapper`, `locative_wrapper`, `time_adverb_wrapper`, `wh_adverb_block` | **1つの汎用ハンドラに畳める**。（フィールド名, advType, 格納先配列）のテーブルで駆動。`__` 始まりのラベル行スキップも共通 |
| 否定 | `negation_wrapper` | 単独ハンドラ（3行） |
| 前置詞 | `preposition_verb` | 単独ハンドラ |
| 命題論理 | `logic_and_block`, `logic_or_block`, `logic_not_block`, `logic_if_block`, `logic_because_block` | 二項（AND/OR/IF/BECAUSE）と単項（NOT）で2ハンドラに共通化 |
| 等位接続 | `coordination_verb_and`, `coordination_verb_or` | 1ハンドラ |
| 動詞本体 | `verb`, `verb_*` | 単独（valency の解決を含む最も重い部分） |

`Record<string, WrapperHandler>` に載せ、`parseVerbChain` 本体は「ハンドラを引いて呼ぶ」だけにする。**推定 426行 → 本体30行 + ハンドラ群**。

副次的な効果として、ブロック種別とパース処理の対応が一覧できるようになる。現状は `definitions.ts`（登録）と `astGenerator.ts`（解釈）が離れていて対応関係が追いにくい。

### 2-2. `english/conjugation.conjugateVerb`（322行）→ 決定表

現状は `(modal, aspect, tense, polarity, isThirdSingular, usesDoSupport)` の if カスケード。

**段階的に**:

1. まず `modal あり / なし` で2関数に分割（現在すでにコード上は明確に分かれている）
2. 各々を `aspect` 4種のハンドラに分割（`simple` / `progressive` / `perfect` / `perfectProgressive`）
3. `be` 動詞の特別扱い、do-support、迂言形式（`was going to`, `had to`）を独立関数に

ローカルヘルパー（`getBeForm`, `getHaveForm`, `join`, `neg`）は関数外に出してモジュールレベルに。

### 2-3. コンポーネントの分割

| 対象 | 方針 |
|---|---|
| `GrammarPanel.tsx` の `TenseAspectDiagram`（235行） | 別ファイルへ切り出し。純粋な表示コンポーネント |
| `DictionaryPanel.tsx`（347行） | カテゴリタブ（Verbs/Nouns/Adjectives/Adverbs）ごとのフォームを分離 |
| `BlocklyWorkspace.tsx`（312行） | 初期ブロック配置（L228–297、約70行）を `blocks/initialWorkspace.ts` へ。Phase 1 で BlockChange 経路を消せば残りは薄くなる |

---

## Phase 3: `blocks/definitions.ts` の分割（1,709行 / 41ブロック）

ツールボックスの8カテゴリに沿って分割するのが自然:

```
blocks/
├── index.ts            登録の集約（副作用 import の受け口）
├── shared.ts           msg(), labelValidator(), 共通ヘルパー
├── sentence.ts         time_frame, modal_wrapper, imperative_wrapper, question_wrapper, time_chip_*
├── verbs.ts            createVerbCategoryBlock, createExtVerbCategoryBlock
├── verbModifiers.ts    negation/frequency/manner/locative/time_adverb wrapper, preposition_verb
├── nouns.ts            pronoun, human/animal/object/place/abstract, createExtNounCategoryBlock
├── nounModifiers.ts    determiner_unified, adjective_*, preposition_noun, coordination_noun_*
├── question.ts         wh_placeholder, wh_adverb, choice_question
├── logic.ts            fact_wrapper, logic_and/or/not/if/because
└── toolbox.ts          createToolbox(), buildNounToolboxContents(), buildVerbToolboxContents()
```

**⚠ 注意点**: `definitions.ts` はトップレベルで副作用を実行している:

- `Blockly.Blocks['x'] = {...}` の代入（41箇所）
- `(['motion', ...]).forEach(createVerbCategoryBlock)`（L400）と同 adjective（L1003）
- `registerExtensionBlocks()`（L530）
- `addDictChangeListener(...)`（L539）

`BlocklyWorkspace.tsx` は `import '../blocks/definitions'` という**副作用 import** に依存している。分割時は `blocks/index.ts` がすべてを再 import する形にして、import 側を `import '../blocks'` に変えるだけで済むようにする。**登録順に依存がないかは要確認**（ツールボックス構築が定義済みブロックを参照するため、`toolbox.ts` は最後）。

---

## Phase 4: 構造的な改善【要設計・要相談】

ここからは振る舞いや設計思想に触れる。Phase 0 のテストが厚くなってから着手する。

### 4-1. `tracker` のモジュールグローバル解消

`english/renderer.ts` の `let tracker = new DerivationTracker()` を引数（または `RenderContext`）で引き回す形に変える。
`renderer/types.ts` には既に `RenderContext` 型が定義されているが、**現在ほとんど使われていない**。この型を実際の引き回しに使うのが素直。

### 4-2. 英日レンダラーの共通骨格の抽出 ★ 最も戦略的

TODO.md の **「パラメータベースのレンダラー設計（架空言語ビルダー）」**（原理とパラメータ理論：語順 SVO/SOV/VSO…、主要部位置、pro-drop、Wh 移動、冠詞有無、格助詞使用）への布石。

現状、英語と日本語のレンダラーは節タイプごとの走査を**それぞれ独立に実装**している。共通化できるのは:

- 節タイプによるディスパッチ（declarative / interrogative / imperative / fact）
- VP チェーンの走査（等位接続・論理演算の再帰）
- 引数スロット（valency）の走査
- 名詞句の走査

言語固有なのは**語順の組み立てと表層形の選択**だけ。「走査（visitor）」と「言語パラメータ」を分離すれば、`conlang/` を足すのが新しい visitor ではなくパラメータ表の追加で済む。

> TODO.md には「架空言語は `dictionary-core.ts` を使わずゼロベースで構築」という方針が書かれている。この方針と共通骨格の抽出をどう両立させるかは**設計判断が必要**。

### 4-3. `japanese/lexicon.ts`（962行）のデータ / ロジック分離

翻訳マップ（データ）と参照ロジックが同居している。`data/` 配下に日本語 Forms 相当を切り出すと、`dictionary-core` + `dictionary-{en,ja}` という対称な構造になる。多言語化の際の型も揃う。

### 4-4. UI 層

- `App.tsx` の state 12個 → 関連するもの（`asts` / `sentences` / `japaneseSentences` / `grammarLogs` は同時に更新される）を `useReducer` か単一の派生 state に統合。現状は `BlocklyWorkspace` が4つのコールバックで別々に流している
- **Blockly の動的 import で code-split** — バンドル 1,123 KB / gzip 305 KB の大半が Blockly。`editorMode === 'blocks'` のときだけ読み込めば初期表示が大幅に軽くなる

---

## 想定される順序と粒度

| Phase | 内容 | リスク | 前提 |
|---|---|---|---|
| 0 | テスト・Lint 基盤 | なし（振る舞い不変） | — |
| 1 | 死んだコード削除 | 低 | Phase 0 |
| 2 | 巨大関数の分割 | 中 | Phase 0 |
| 3 | `definitions.ts` の分割 | 中（副作用 import に注意） | Phase 0 |
| 4 | 設計変更 | 高 | Phase 0–3 + 個別の設計合意 |

Phase 1–3 は独立しているので並行または任意の順で実施できる。Phase 4 は 4-2（共通骨格）が他を巻き込むため、着手前に方針を固める。

各 Phase は `claude/*` ブランチ + PR の既存運用に乗せ、完了時に CHANGELOG.md と TODO.md を更新する（CLAUDE.md の規約）。
