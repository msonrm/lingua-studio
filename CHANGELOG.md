# CHANGELOG

> **Note**: このファイルは [TODO.md](./TODO.md) と連動しています。機能実装完了時は両方を更新してください。

## 2026-07-26

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

### Phase 0 で発見した不具合（未修正・現状をスナップショットで固定）

すべて再現テスト付き。詳細は REFACTORING-PLAN.md「Phase 0 実施結果」。

- [ ] 入れ子 VP 等位接続 `or(and(A, B), C)` で B が AST から消える
  - `parseTimeFrameBlock:303` と `toVerbPhraseWithLogic:420` が内側の `coordinatedWith` を上書きしている
  - 2026-01-31 の修正は左辺 VP の構築までは正しいが、消費側2箇所で潰れる
- [ ] 繋辞の形容詞が日本語訳されない（`renderFiller()` が `translateAdjective()` を通していない）
- [ ] 日本語レンダラーが `logicOp` を扱わない（AND/OR/IF/BECAUSE の右オペランドが落ちる）
- [ ] 日本語がモダリティ否定を無視する
- [ ] 日本語がモダリティ使用時に相を落とす
- [ ] `japanese/renderer.ts` の `verb` 変数の結果が使われていない（2パス方式リファクタの残骸）

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
