# Architecture

Lingua Studio の内部構造リファレンス。コードを読む前の地図として使う。

> 最終更新: 2026-07-26（リファクタリング Phase 3 まで反映）

---

## 1. データフロー

中核は **Blockly のブロック配置を AST に変換し、AST から3種類の出力を生成する**単方向パイプライン。

```
Blockly Workspace (ユーザー操作)
        │
        │  workspace.addChangeListener → handleWorkspaceChange()
        │  components/BlocklyWorkspace.tsx
        ▼
generateMultipleAST(workspace)              renderer/astGenerator.ts
        │
        ▼
   SentenceNode[]                           types/schema.ts
        │
        ├──► renderToEnglishWithLogs(ast)   renderer/english/renderer.ts  → { output, logs }
        ├──► renderToJapanese(ast)          renderer/japanese/renderer.ts → string
        └──► renderToLinguaScript(ast)      renderer/linguaScriptRenderer.ts → string
```

**呼び出し元の非対称性に注意**:

- 英語・日本語は `BlocklyWorkspace.tsx` の `handleWorkspaceChange()` 内で生成し、コールバックで `App` の state に流す。
- LinguaScript だけは `App.tsx` の `useMemo(() => asts.map(renderToLinguaScript), [asts])` で生成する。パイプラインの経路が1つだけ違う。

すべてのレンダラーは `SentenceNode` を受け取り文字列を返す**純関数**（後述の tracker を除く）。テストを書く際の最大の資産。

---

## 2. モジュール構成

```
src/
├── App.tsx                    ルート。state 12個を直接保持、LocaleContext.Provider
├── main.tsx                   エントリポイント
│
├── blocks/                    ★ Blockly ブロック定義（カテゴリ別に分割）
│   ├── index.ts               登録の集約。`import '../blocks'` でこれらが副作用登録される
│   ├── shared.ts              COLORS / msg() / labelValidator
│   ├── blockData.ts           TimeChip・限定詞のデータ（Blockly 非依存。astGenerator も参照）
│   ├── prepositions.ts        前置詞データ（動詞用・名詞用の両方が使う）
│   ├── sentence.ts            time_frame / modal・imperative・question ラッパー / time_chip_*
│   ├── verbs.ts               カテゴリ別の動詞ブロック
│   ├── verbModifiers.ts       否定・頻度・様態・場所・時間ラッパー / 前置詞句 / 等位接続
│   ├── nouns.ts               代名詞 / human・animal・object・place・abstract
│   ├── determiner.ts          determiner_unified（3プルダウン + 自動補正）
│   ├── nounModifiers.ts       形容詞 / 前置詞句 / 等位接続
│   ├── question.ts            choice_question / wh_placeholder / wh_adverb
│   ├── logic.ts               fact_wrapper / logic_*（命題論理）
│   ├── extensions.ts          拡張辞書ブロックの動的生成
│   ├── toolbox.ts             createToolbox()
│   ├── initialWorkspace.ts    初回起動時に置くブロック
│   └── det-rules-en.ts        限定詞（a/the/some…）の選択ルール
│
├── concepts/                  ★ 言語非依存の概念（valency・可算性・カテゴリ）
│   └── index.ts
│
├── languages/                 ★ 語彙と形態論（言語パック。下記 §3）
│   ├── types.ts               LanguagePack の契約
│   ├── index.ts               レジストリ
│   ├── en/
│   │   ├── lexicon.ts         英語の語形 + lookup
│   │   ├── morphology.ts      動詞活用（conjugateVerb）
│   │   ├── determiners.ts     限定詞の選択ルール
│   │   └── index.ts           LanguagePack 実装
│   └── ja/
│       ├── lexicon.ts         日本語の表層形 + lookup（活用タイプ込み）
│       ├── morphology.ts      五段/一段/サ変/カ変の活用
│       └── index.ts           LanguagePack 実装
│
├── userDictionary/            ユーザー拡張辞書
│   ├── format.ts              保存形式と旧形式からの移行
│   ├── store.ts               メモリ上の辞書 + localStorage
│   └── index.ts
│
├── renderer/
│   ├── astGenerator.ts        Blockly ブロック木 → AST（1,187行）
│   ├── linguaScriptRenderer.ts AST → LinguaScript テキスト
│   ├── DerivationTracker.ts   文法導出ステップの記録クラス
│   ├── types.ts               RenderContext / DerivationStep 等の型
│   ├── english/
│   │   ├── renderer.ts        AST → 英文
│   │   ├── nounPhrase.ts      名詞句の組み立て
│   │   └── coordination.ts    等位接続
│   └── japanese/
│       ├── renderer.ts        AST → 日本語（SOV 語順・格助詞）
│       └── index.ts           バレル
│
├── components/
│   ├── BlocklyWorkspace.tsx   Blockly の inject / 変更検知（初期配置は blocks/initialWorkspace.ts）
│   ├── GrammarPanel.tsx       Grammar Console（導出ログ表示）+ TenseAspectDiagram
│   ├── DictionaryPanel.tsx    ユーザー辞書の追加・削除・エクスポート UI
│   ├── LinguaScriptView.tsx   LinguaScript 表示（Prism ハイライト）
│   └── LinguaScriptBar.tsx    ヘッダー下の1行表示
│
├── locales/
│   ├── types.ts               UIMessages / BlocklyMessages / GrammarMessages
│   ├── en.ts, ja.ts, ja-hira.ts  各290キー、完全に並行した構造
│   └── index.ts               locales レジストリ + LocaleContext + applyBlocklyLocale
│
├── types/
│   ├── schema.ts              辞書エントリ型 + AST ノード型（下記 §4）
│   └── grammarLog.ts          TransformLog（UI 表示用の旧形式ログ）
│
└── lib/
    └── prism-linguascript.ts  LinguaScript の Prism 文法定義
```

---

## 3. 語彙と形態論（言語パック）

### 役割分担

```
concepts/          言語非依存の概念（valency・可算性・カテゴリ）
     ↓
languages/<code>/  語彙と形態論。この言語で語をどう綴り、どう活用するか
     ↓
renderer/<lang>/   語順の組み立て。どの順で並べ、何を省略するか
```

語彙・形態論と語順の組み立てを分けているのは、後者だけが言語ごとに大きく違う一方、
前者は「lemma を引いて語形を得る」という同じ形をしているため。

### 語形の型は言語ごとに違う

語形を「言語コード → 文字列」の1つのマップに押し込めない。

| 言語 | 語形 |
|---|---|
| 英語 | `{ base, past, pp, ing, thirdSg }` |
| 日本語 | `{ ja, type: 五段 \| 一段 \| サ変 \| カ変 }` |
| フランス語（将来） | 活用群 + 性 |

とくに**日本語の活用タイプは表層形から推論できない**。走る（五段）と食べる（一段）は
語尾が同じ「る」だが活用が違う。そのため `LanguagePack` は語形の型を型パラメータで受け取り、
ユーザー辞書では活用タイプを必須入力にしている。

### lookup の一元化

語を引く経路（ベース辞書 → ユーザー辞書 → 機械的な導出）はすべて `lookup*` の内側に閉じる。
レンダラーは語がどこから来たかを知らなくてよい。

```
1. ベース辞書
2. ユーザー辞書（forms[言語コード] を読む）
3. 規則変化からの導出（英語のみ。日本語は活用タイプが推論できないため不可）
```

ユーザー辞書の保存形式は `forms[言語コード]` の文字列マップで、キーは
言語パックの `userEntryFields` が宣言するものと一致する。
旧形式は `migratePackage()` が読み込み時に自動変換する。

未登録なら `undefined` を返す。lemma をそのまま返して「引けた」と誤認しないことを
`languagePacks.test.ts` の契約テストで担保している。

### 言語を追加するとき

`languages/<code>/` を作り `LanguagePack` を実装して `languages/index.ts` に登録する。
`DictionaryPanel` は `userEntryFields` を見て入力欄を動的に描くので、UI 側の追記は要らない。

## 4. AST スキーマの要点

`types/schema.ts`。設計上とくに注意が必要な点だけ挙げる。

```ts
SentenceNode {
  clause: ClauseNode
  sentenceType: "declarative" | "imperative" | "interrogative" | "fact"
  timeAdverbial?: string        // TimeChip 由来（"Yesterday" 等）。文末に付与される
}

ClauseNode {
  verbPhrase, tense, aspect
  polarity: "affirmative" | "negative"        // 動詞否定: "I do NOT run"
  modal?: ModalType
  modalPolarity?: "affirmative" | "negative"  // モダリティ否定: "I need NOT run"
}
```

### VerbPhraseNode に結合機構が3つ同居している

これが最も理解しづらい箇所。

| フィールド | 用途 | 出力 |
|---|---|---|
| `CoordinatedVerbPhraseNode` | **等位接続**（統語論）。小文字 and/or の n項ツリー | "I eat and drink" |
| `logicOp` | **命題論理**（Logic Extension）。大文字 AND/OR/NOT/IF/BECAUSE | `AND(P, Q)` |
| `polarity` | VP 個別の否定。`ClauseNode.polarity` とは別物 | "I do not eat and I drink" |

`ClauseNode.polarity`（節レベル）と `VerbPhraseNode.polarity`（VP レベル）の両方が negative のとき **二重否定**として扱われる（`english/renderer.ts` の `renderClause()` 内 `doubleNegation`）。

### 等位接続は n項ツリー（名詞句と対称）

`ClauseNode.verbPhrase` は `VerbPhraseConjunct`（単一の `VerbPhraseNode`、または
`CoordinatedVerbPhraseNode`）。名詞句の `CoordinatedNounPhraseNode` と同じ形で、
入れ子はそのまま `conjuncts` に入る。

```
or(and(A, B), C)  →  { or, conjuncts: [ { and, conjuncts: [A, B] }, C ] }
and(A, or(B, C))  →  { and, conjuncts: [ A, { or, conjuncts: [B, C] } ] }
```

同じ接続詞が続く場合は1グループに畳まれる（`and(and(A,B),C)` → `and(A,B,C)`）。

以前は `VerbPhraseNode.coordinatedWith` の連結リストで表現していたため、
上の2つが同じ鎖に潰れ、LinguaScript が別の命題を出力していた（2026-07-27 に修正）。

---

## 5. 文法導出ログ（Grammar Console）

```
english/renderer.ts の各レンダリング関数
        │  tracker.recordMorphology() / tracker.recordSyntax()
        ▼
DerivationTracker（DerivationStep[] を蓄積）
        │  toLegacyLogs()
        ▼
TransformLog[]  ──►  App の grammarLogs state  ──►  GrammarPanel が表示
```

- `DerivationStep` は `MorphologyStep`（agreement / tense / aspect / case / article / modal / negation）と `SyntaxStep`（do-support / inversion / wh-movement / imperative / word-order）の判別共用体。
- UI は `toLegacyLogs()` が返す平坦な `TransformLog` しか使っていない。形態論/統語論の区別や位置情報は捨てられている（TODO.md の「Grammar Console 詳細表示モード」が未実装のため）。

**`DerivationTracker` の public メソッドは7つが 0 参照**: `diff()` / `getStepsByType()` / `applyMorphology()` / `getDerivation()` / `getMorphologySteps()` / `getSyntaxSteps()` / `setInput()`。実際に使われているのは `recordMorphology()` / `recordSyntax()` / `toLegacyLogs()` のみ。
ただしこれらは **TODO.md の「Grammar Console 詳細表示モード」に対応する意図的な先行実装**であり、削除対象ではない（REFACTORING-PLAN.md 参照）。

**⚠ 落とし穴**: `english/renderer.ts` の先頭に **モジュールレベルの可変シングルトン** `let tracker = new DerivationTracker()` がある。`renderToEnglishWithLogs()` が冒頭で毎回作り直すが、レンダリング中の全関数がこのモジュール変数を暗黙に参照している。`DerivationTracker.ts` のクラスコメントは「グローバル状態ではなく、レンダリングごとにインスタンスを作成」と書いているが、**レンダラー側の実際の使い方はモジュールグローバル**。複数 AST を並行レンダリングすると壊れる（現状は同期的に順次実行しているため顕在化していない）。

---

## 6. ロケール

3ロケール（`en` / `ja` / `ja-hira`）× 3系統のメッセージ:

| 系統 | 用途 | 適用方法 |
|---|---|---|
| `ui` | React コンポーネントのラベル | `useLocale()` で Context から取得 |
| `blockly` | ブロック上のラベル・ツールチップ | `applyBlocklyLocale()` が `Blockly.Msg[key]` に流し込む |
| `grammar` | Grammar Console の文法用語 | `GrammarPanel` が参照 |

ロケール切り替え時は `Blockly.Msg` を書き換えたうえで **`workspaceKey` を +1 してワークスペースごと再マウント**する（`App.tsx` の `handleLocaleChange`）。既存ブロックのラベルは動的に更新できないため。切り替え前に `saveState()` で状態を退避している。

---

## 7. 永続化（localStorage）

| キー | 内容 | 書き込み箇所 |
|---|---|---|
| `lingua-studio-workspace` | Blockly ワークスペースのシリアライズ状態 | `App.tsx`（500ms デバウンス） |
| `lingua-studio-locale` | 選択中のロケール | `locales/index.ts` |
| `lingua-studio-dictionary-ext` | ユーザー拡張辞書 | `data/dictionary-ext.ts` |

初回起動時（保存状態なし）は `BlocklyWorkspace.tsx` が **"I eat an apple."** のブロック（`time_frame` + `time_chip_abstract` + `verb_action` + `pronoun_block` + `determiner_unified` + `object_block`）を手続き的に組み立てる。

---

## 8. Blockly ブロックの分類

`blocks/` 以下に 41個。ツールボックスは 8カテゴリ:

`TOOLBOX_SENTENCE` / `SENTENCE_MODIFIER` / `VERBS` / `VERB_MODIFIERS` / `NOUNS` / `NOUN_MODIFIERS` / `QUESTION` / `LOGIC`

構造上のパターン:

- **ラッパーブロック** — `negation_wrapper`, `frequency_wrapper`, `manner_wrapper`, `locative_wrapper`, `time_adverb_wrapper`, `preposition_verb`, `wh_adverb_block`。いずれも内側に VERB を1つ取り、`astGenerator.parseVerbChain()` が再帰的に剥がしていく。
- **カテゴリ別動的生成** — `verb_{category}`（6種、`verbs.ts`）、`adjective_{category}`（6種、`nounModifiers.ts`）はループで生成。
- **拡張ブロック** — `verb_*_ext`, `noun_*_ext` は辞書変更リスナーで動的に再登録される（`extensions.ts` の `registerExtensionBlocks()`）。

---

## 9. 現状（2026-07-26 / リファクタリング Phase 3 完了時点）

| 項目 | 状況 |
|---|---|
| テスト | **691件 / スナップショット120**（`src/test/`、2層のゴールデンテスト） |
| Lint | ESLint + typescript-eslint。エラー0 / 警告1（`LinguaScriptView.tsx` の exhaustive-deps） |
| 未参照 export | **0件**（`npm run knip` が CI のゲート） |
| CI | GitHub Actions で tsc / eslint / vitest / build / knip |
| 最大の関数 | `createScope` 58行（`english/conjugation.ts`）。データ定義を除く |
| 最大のファイル | `english/renderer.ts` 1,327行 / `astGenerator.ts` 1,187行 / `japanese/lexicon.ts` 1,010行 |
| バンドル | 1,123 KB / gzip 305 KB（code-split なし、Vite の警告あり） |

### 残っている技術的負債

- **`english/renderer.ts` の `tracker` がモジュールグローバル**（§5 の落とし穴）。Phase 4-1 で解消予定
- **英語・日本語レンダラーの走査骨格が重複**。Phase 4-2 で共通化を検討（架空言語ビルダーへの布石）
- **`japanese/lexicon.ts` がデータとロジックの混在**（1,010行）。Phase 4-3
- **Blockly が code-split されていない**。バンドルの大半を占める。Phase 4-4
- **既知の不具合が `TODO.md` に集約されている**（等位接続のカンマ、モダリティの迂言形式、`degree` の未配線など）

Phase 0〜3 で解消した項目（未参照 export 47件、`VisualizationPanel.tsx`、`BlockChange` 収集経路、
`parseVerbChain` 426行、`conjugateVerb` 322行、`definitions.ts` 1,703行）は
[CHANGELOG.md](../CHANGELOG.md) を参照。