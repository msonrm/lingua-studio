# LinguaScript 文法仕様書

英文法をLisp風の関数構文で表現する仕様。Blocklyによるビジュアルプログラミングで英文を組み立てる **lingua-studio** の基盤。

---

## 全体構造

```
[ラッパー層]（話者の態度・判断）
    態度 (? / imperative)
    否定A (not)
    判断 (modal)
        ↓
[sentence()]（命題のルート）
    時制 (past / present / future) ← 省略可（default: present）
    相 (simple / progressive / perfect / perfectProgressive) ← 省略可（default: simple）
    態 (passive / causative)
    否定B (not)
    核心 (verb(...))
```

---

## レイヤー仕様

### 1. 態度（最外殻・省略可）

| 記法 | 意味 |
|------|------|
| 省略 | 平叙文（デフォルト） |
| `?()` | 疑問文 |
| `imperative()` | 命令文 |

### 2. 否定A（モダリティの否定・省略可）

```lisp
not(modal('must, ...))  ;; → 「〜とは限らない」
```

### 3. 判断 modal（省略可）

```lisp
modal('must, ...)
modal('can, ...)
modal('may, ...)
modal('should, ...)
modal('will, ...)
modal('would, ...)
modal('could, ...)
modal('might, ...)
```

### 4. sentence()（必須）

命題（事実の記述）のルート。基本は平叙文としてここから始める。

### 5. 時制 tense（省略可 = present）

| 記法 | 意味 |
|------|------|
| `past()` | 過去 |
| `present()` | 現在（デフォルト） |
| `future()` | 未来 |

### 6. 相 aspect（省略可 = simple・排他的）

| 記法 | 意味 |
|------|------|
| `simple()` | 単純（デフォルト） |
| `progressive()` | 進行 |
| `perfect()` | 完了 |
| `perfectProgressive()` | 完了進行 |

**注意**: 入れ子禁止（4択から1つ選ぶ）

### 7. 態 voice（省略可 = active）

| 記法 | 意味 |
|------|------|
| 省略 | 能動態（デフォルト） |
| `passive()` | 受動態 |
| `causative()` | 使役 |

### 8. 否定B（動作の否定・省略可）

```lisp
not(eat(...))  ;; → 「食べない」
```

### 9. 核心 verb（必須）

```lisp
verb(agent:'x, theme:'y, ...)
```

名前付き引数で意味役割を明示。

---

## 意味役割（Semantic Roles）

| 役割 | 説明 | 例 |
|------|------|-----|
| `agent` | 動作主 | I, she |
| `theme` | 対象 | apple, book |
| `recipient` | 受け手 | you, him |
| `source` | 起点 | store, Tokyo |
| `goal` | 着点 | station, home |
| `instrument` | 道具 | knife, pen |
| `location` | 場所 | park, room |
| `time` | 時間 | yesterday, now |
| `manner` | 様態 | quickly |
| `reason` | 理由 | because... |

### agentの必須/任意

| 態 | agent | 例 |
|----|-------|-----|
| 能動態 | 必須 | I eat an apple. |
| 受動態 | 任意 | The apple was eaten. / The apple was eaten by me. |
| 命令文 | 省略 | Eat the apple!（暗黙の'you） |

---

## 疑問文

### Yes/No疑問文 vs Wh疑問文

```lisp
;; Yes/No疑問文: 空欄なし
?(sentence(past(simple(eat(agent:'you, theme:'apple)))))
;; → Did you eat the apple?

;; Wh疑問文: 空欄あり
?(sentence(past(simple(eat(agent:'you, theme:?)))))
;; → What did you eat?
```

### 疑問プレースホルダー `?`

| 空欄の位置 | 疑問詞 | 例 |
|-----------|--------|-----|
| `agent:?` | Who | Who ate the apple? |
| `theme:?` | What | What did you eat? |
| `recipient:?` | Whom / To whom | Whom did you give the book to? |
| `location:?` | Where | Where did you eat? |
| `time:?` | When | When did you eat? |
| `manner:?` | How | How did you do it? |
| `reason:?` | Why | Why did you eat? |

### 記法ルール

```lisp
;; クォートあり = 具体的な語彙
theme:'apple    // "apple" という単語

;; クォートなし = 特殊プレースホルダー
theme:?                    // 疑問（What?）
theme:?or('tea, 'coffee)   // 選択疑問（Which, tea or coffee?）
```

### `?()` と `?` の関係

| `?()` | `?` | 結果 |
|-------|-----|------|
| あり | なし | Yes/No疑問文 |
| あり | あり | Wh疑問文 |
| なし | あり | → `?()` を自動補完 |
| なし | なし | 平叙文 |

---

## 省略とデフォルト値

| レイヤー | 省略可 | デフォルト値 |
|---------|--------|-------------|
| 態度 | ✓ | 省略（平叙） |
| 否定A | ✓ | なし（肯定） |
| 判断 | ✓ | なし（直説法） |
| **sentence()** | **必須** | - |
| 時制 | ✓ | `present` |
| 相 | ✓ | `simple` |
| 態 | ✓ | `active` |
| 否定B | ✓ | なし（肯定） |
| **核心（verb）** | **必須** | - |

---

## 例文集

### 最小構成

```lisp
sentence(eat(agent:'I, theme:'apple))
;; → "I eat an apple."
;; （時制=present, 相=simple が補完される）
```

### 明示的に時制・相を指定

```lisp
sentence(present(simple(eat(agent:'I, theme:'apple))))
;; → "I eat an apple."
```

### 過去形

```lisp
sentence(past(simple(eat(agent:'I, theme:'apple))))
;; → "I ate an apple."
```

### 進行形

```lisp
sentence(present(progressive(eat(agent:'I, theme:'apple))))
;; → "I am eating an apple."
```

### 完了形

```lisp
sentence(present(perfect(eat(agent:'I, theme:'apple))))
;; → "I have eaten an apple."
```

### 疑問文

```lisp
?(sentence(past(simple(eat(agent:'you, theme:'apple)))))
;; → "Did you eat an apple?"
```

### 受動態

```lisp
sentence(past(simple(passive(eat(theme:'apple)))))
;; → "The apple was eaten."
```

### モダリティ付き

```lisp
modal('must, sentence(past(perfect(eat(agent:'you, theme:'apple)))))
;; → "You must have eaten an apple."
```

### 結合価3の動詞（give）

```lisp
sentence(past(simple(give(agent:'I, theme:'book, recipient:'you))))
;; → "I gave you a book."
```

### 複雑な例

```lisp
?(not(modal('must, sentence(past(perfect(passive(not(eat(agent:'I, theme:'apple)))))))))
;; → "Might the apple not have been eaten?"
```

---

## コンパイル展開

ユーザーが省略した部分はコンパイラがデフォルト値で補完する。

### 最小形 → 展開後

```lisp
;; ユーザー記述
sentence(eat(agent:'I, theme:'apple))

;; コンパイラ展開後（内部表現）
sentence(present(simple(active(eat(agent:'I, theme:'apple)))))
```

### 過去形だけ指定

```lisp
;; ユーザー記述
sentence(past(eat(agent:'I, theme:'apple)))

;; コンパイラ展開後
sentence(past(simple(active(eat(agent:'I, theme:'apple)))))
```

---

## 名詞句（比較級・最上級）

専用構文を設けず、名詞句の形容詞・後置修飾として表現する。

```lisp
;; "the bigger apple"
noun(det:'the, adj:'bigger, head:'apple)

;; "the biggest apple"
noun(det:'the, adj:'biggest, head:'apple)

;; "an apple bigger than that one"
noun(det:'a, head:'apple, post:than('that_one))

;; "an apple as big as that one"
noun(det:'a, head:'apple, post:as('big, 'that_one))
```

---

## 設計思想

- チョムスキー生成文法を教育向けに簡略化
- モンタギュー文法的な関数適用による意味構成
- 構文の統一性: 基本は `機能(引数, 下位構造)`
- 「命題」と「話者の態度」の明確な分離

### 対象言語

- 現時点では英語に特化
- 文法的性・格変化等は未対応

### スコープ外

- 接続詞（and, but, because 等）による複文
- 関係節（the man who ate 等）
- 単文のみを対象とする

---

## 多言語対応の可能性

LinguaScriptは言語中立的な抽象表現（インターリンガ）として機能しうる。

```lisp
;; この抽象表現は言語に依存しない
sentence(past(simple(eat(agent:'I, theme:'apple))))
```

| 言語 | コンパイル結果 |
|------|---------------|
| 英語 | I ate an apple. |
| 日本語 | 私はリンゴを食べた。 |
| ドイツ語 | Ich aß einen Apfel. |
| スペイン語 | Comí una manzana. |

---

## BNF風の形式文法

```bnf
<utterance>     ::= <attitude>? <negA>? <modal>? <sentence>

<attitude>      ::= "?" | "imperative"
<negA>          ::= "not(" <modal>? <sentence> ")"
<modal>         ::= "modal('" <modal-type> ", " <sentence> ")"
<modal-type>    ::= "must" | "can" | "may" | "should" | "will" | "would" | "could" | "might"

<sentence>      ::= "sentence(" <tense>? <aspect>? <voice>? <negB>? <verb-phrase> ")"

<tense>         ::= "past(" | "present(" | "future("
<aspect>        ::= "simple(" | "progressive(" | "perfect(" | "perfectProgressive("
<voice>         ::= "passive(" | "causative("
<negB>          ::= "not("

<verb-phrase>   ::= <verb> "(" <arguments> ")"
<verb>          ::= "eat" | "give" | "run" | "see" | ...
<arguments>     ::= <argument> ("," <argument>)*
<argument>      ::= <role> ":" <value>
<role>          ::= "agent" | "theme" | "recipient" | "source" | "goal" | "instrument" | "location" | "time" | "manner" | "reason"
<value>         ::= "'" <word> | "?" | "?or(" <value> "," <value> ")"

<noun-phrase>   ::= "noun(" <np-args> ")"
<np-args>       ::= "det:" <value>? ", " "adj:" <value>? ", " "head:" <value> (", " "post:" <post-mod>)?
<post-mod>      ::= "than(" <value> ")" | "as(" <value> ", " <value> ")"
```

---

## クイックリファレンス

```lisp
;; 基本構文
sentence(<tense>(<aspect>(<voice>(<verb>(arg1, arg2, ...)))))

;; 最小形（省略あり）
sentence(verb(agent:'x, theme:'y))

;; 疑問文
?(sentence(...))           ;; Yes/No
sentence(verb(theme:?))    ;; Wh（自動で?()補完）

;; モダリティ
modal('must, sentence(...))

;; 受動態
sentence(passive(verb(theme:'x)))

;; 否定
sentence(not(verb(...)))        ;; 動作の否定
not(modal('must, sentence(...))) ;; モダリティの否定
```
