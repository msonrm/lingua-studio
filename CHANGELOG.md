# CHANGELOG

> **Note**: このファイルは [TODO.md](./TODO.md) と連動しています。機能実装完了時は両方を更新してください。

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
