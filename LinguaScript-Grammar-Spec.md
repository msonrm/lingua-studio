# LinguaScript 文法仕様書

英文法をLisp風の関数構文で表現する仕様。Blocklyによるビジュアルプログラミングで英文を組み立てる **lingua-studio** の基盤。

---

## 記法規約

### リテラル vs メタ値

| 記法 | 意味 | 例 |
|------|------|-----|
| `'word` | リテラル（出力される語彙） | `'apple`, `'the`, `'quickly` |
| `symbol` | メタ値（クォートなし = 出力されない制御値） | `plural`, `uncountable` |

```lisp
;; リテラル: 実際に出力される（クォート付き）
noun(det:'the, head:'apple)   ;; → "the apple"

;; メタ値: 出力されないが意味を持つ（クォートなし）
noun(post:plural, head:'apple)   ;; → "apples"（pluralは出力されない）
noun(post:uncountable, head:'water)   ;; → "water"（量を指定しない）
```

**Lisp慣習**: クォート付き `'x` は引用（リテラル）、クォートなし `x` はシンボル（評価される値）。

### 組み合わせ演算子

| 記法 | 意味 | 例 |
|------|------|-----|
| `A + B` | 両方適用 | `past + perfect` = 過去完了 |

```lisp
;; 時制 + 相の組み合わせ
past+simple(eat(...))           ;; 過去単純
present+progressive(eat(...))   ;; 現在進行
past+perfect(eat(...))          ;; 過去完了
future+perfectProgressive(...)  ;; 未来完了進行
```

### 意味注釈

同じ表層形に対応する複数の意味を区別するため、`意味:表層形` の記法を使用する。

```lisp
;; must は2つの意味を持つ
modal(obligation:must, ...)   ;; 義務: 「〜しなければならない」
modal(certainty:must, ...)    ;; 確信: 「〜に違いない」

;; 時制により表層形が変化
modal(ability:can, ...)       ;; 現在: can
modal(ability:could, ...)     ;; 過去: could
modal(volition:will, ...)     ;; 現在: will
modal(volition:was_going_to, ...) ;; 過去: was going to
```

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
not(modal('certainty, ...))   ;; → 「〜とは限らない」（確信の否定）
not(modal('obligation, ...))  ;; → 「〜しなくてもよい」（義務の否定）
```

### 3. 判断 modal（省略可）

言語非依存の意味概念として8つのモダリティを定義する。`意味:表層形` 記法で出力される。

```lisp
modal(ability:can, ...)       ;; 能力: can
modal(permission:may, ...)    ;; 許可: may
modal(possibility:might, ...) ;; 可能性: might
modal(obligation:must, ...)   ;; 義務: must
modal(certainty:must, ...)    ;; 確信: must（obligationと同じ表層形だが意味が異なる）
modal(advice:should, ...)     ;; 助言: should
modal(volition:will, ...)     ;; 意志: will
modal(prediction:will, ...)   ;; 予測: will
```

時制との連動により、適切な英語形式に変換される:

| 意味概念 | 現在 | 過去 |
|---------|------|------|
| ability | can | could |
| permission | may | could |
| possibility | might | might |
| obligation | must | had_to |
| certainty | must | must_have |
| advice | should | should_have |
| volition | will | was_going_to |
| prediction | will | would |

### 4. sentence()（必須）

命題（事実の記述）のルート。基本は平叙文としてここから始める。

### 5. 時制+相 tense+aspect

時制と相は `+` 演算子で組み合わせて表現する。

| 時制 | 相 | 組み合わせ記法 |
|------|------|---------------|
| past | simple | `past+simple()` |
| past | progressive | `past+progressive()` |
| past | perfect | `past+perfect()` |
| past | perfectProgressive | `past+perfectProgressive()` |
| present | simple | `present+simple()` |
| present | progressive | `present+progressive()` |
| present | perfect | `present+perfect()` |
| present | perfectProgressive | `present+perfectProgressive()` |
| future | simple | `future+simple()` |
| future | progressive | `future+progressive()` |
| future | perfect | `future+perfect()` |
| future | perfectProgressive | `future+perfectProgressive()` |

**デフォルト**: 省略時は `present+simple`

**注意**: 相は排他的（4択から1つ選ぶ）

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

### 基本役割

動詞の必須引数（項）として機能する意味役割。

| 役割 | 説明 | 例 |
|------|------|-----|
| `agent` | 動作主 | I, she |
| `theme` | 対象 | apple, book |
| `recipient` | 受け手 | you, him |
| `source` | 起点 | from the store |
| `goal` | 着点 | to the station |

**注意**: `source`/`goal` は移動・授与動詞の必須項として使用する。任意の場所表現は `pp()` で表現する。

### 拡張役割

動詞の種類によっては、追加の意味役割を使用する。

| 役割 | 説明 | 使用する動詞 | 例 |
|------|------|-------------|-----|
| `patient` | 状態変化を被る対象 | 動作動詞（eat, break等） | I eat **an apple**. |
| `experiencer` | 心理状態の主体 | 心理動詞（like, know等） | **I** like apples. |
| `stimulus` | 心理状態の原因 | 心理動詞（like, know等） | I like **apples**. |
| `beneficiary` | 利益を受ける者 | 授与動詞 | I bought a gift for **you**. |
| `possessor` | 所有者 | have, own等 | **I** have a car. |
| `attribute` | 属性・状態 | コピュラ動詞（be） | She is **happy**. |

### コピュラ動詞（be）の構造

コピュラ動詞では、主語は `theme`（属性が述べられる対象）として扱う。

```lisp
be(theme:'she, attribute:'happy)
;; → "She is happy."

be(theme:'this, attribute:'my_book)
;; → "This is my book."
```

### theme vs patient の使い分け

```lisp
;; theme: 移動・変化を伴わない対象（giveのもの、seeの目撃対象）
give(agent:'I, theme:'book, recipient:'you)
see(agent:'I, theme:'bird)

;; patient: 動作の影響を直接受ける対象（eatの食べられるもの）
eat(agent:'I, patient:'apple)
break(agent:'I, patient:'window)
```

### agentの必須/任意

| 態 | agent | 例 |
|----|-------|-----|
| 能動態 | 必須 | I eat an apple. |
| 受動態 | 任意 | The apple was eaten. / The apple was eaten by me. |
| 命令文 | 省略 | Eat the apple!（暗黙の'you） |

---

## 付加詞（Adjuncts）

場所・時間・様態・理由などは、動詞の必須引数（項）ではなく、任意の修飾要素（付加詞）として扱う。
これらは意味役割ではなく、別の構文機構で表現する。

### 時間副詞（Time Adverbials）

時間表現は `time()` ラッパーまたは時間副詞で表現する。

```lisp
;; 具体的な時間
time('yesterday, sentence(eat(agent:'I, patient:'apple)))
;; → "Yesterday, I ate an apple."

;; 相的時間（アスペクトに関連）
time('just_now, sentence(perfect(eat(agent:'I, patient:'apple))))
;; → "I have just eaten an apple."

;; 時間副詞の種類
'yesterday, 'today, 'tomorrow           ;; 具体的
'now, 'just_now, 'already, 'yet, 'still ;; 相的
'recently, 'lately, 'soon               ;; 相対的
```

### 時間副詞と時制・相の制約

特定の時間副詞は特定の時制・相と共起する。コンパイラはこれを検証し、UIでは不適切な組み合わせを制限できる。

| 時間副詞 | 推奨される時制・相 | 非文法的な組み合わせ |
|---------|------------------|---------------------|
| yesterday, last week | past + simple | ~~present perfect~~ |
| just, already, yet | present + perfect | - |
| now | present + progressive | - |
| tomorrow | future | ~~past~~ |

```lisp
;; OK: 過去の具体時点 + 過去単純
time('yesterday, sentence(past+simple(eat(...))))

;; NG: 過去の具体時点 + 現在完了（英語では非文法的）
time('yesterday, sentence(present+perfect(eat(...))))
;; → コンパイラが警告または自動修正
```

### 様態副詞（Manner Adverbs）

動作の様態は `manner()` ラッパーで表現する。

```lisp
manner('quickly, eat(agent:'I, patient:'apple))
;; → "I quickly eat an apple." / "I eat an apple quickly."

manner('carefully, open(agent:'she, patient:'door))
;; → "She carefully opens the door."
```

### 頻度副詞（Frequency Adverbs）

頻度は `frequency()` ラッパーで表現する。

```lisp
frequency('always, eat(agent:'I, patient:'apple))
;; → "I always eat an apple."

frequency('never, drink(agent:'he, patient:'coffee))
;; → "He never drinks coffee."

;; 頻度副詞の種類（高→低）
'always, 'usually, 'often, 'sometimes, 'rarely, 'never
```

### 前置詞句（Prepositional Phrases）

場所・方向・関係などは前置詞句で表現する。

```lisp
;; 場所
pp('in, 'park, eat(agent:'I, patient:'apple))
;; → "I eat an apple in the park."

;; 方向
pp('to, 'station, run(agent:'I))
;; → "I run to the station."

;; 道具
pp('with, 'knife, cut(agent:'I, patient:'bread))
;; → "I cut the bread with a knife."

;; 前置詞の種類
'in, 'on, 'at           ;; 場所
'to, 'from, 'into       ;; 方向
'with, 'by, 'for        ;; 手段・関係
'about, 'of             ;; 関連
```

### 付加詞の語順

付加詞は文の様々な位置に置ける。コンパイラが適切な位置を決定する。

```lisp
;; 複数の付加詞
time('yesterday, manner('quickly, pp('in, 'park, eat(agent:'I, patient:'apple))))
;; → "Yesterday, I quickly ate an apple in the park."
```

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

#### 意味役割への疑問

| 空欄の位置 | 疑問詞 | 例 |
|-----------|--------|-----|
| `agent:?` | Who | Who ate the apple? |
| `theme:?` / `patient:?` | What | What did you eat? |
| `recipient:?` | Whom / To whom | Whom did you give the book to? |
| `goal:?` | Where (着点) | Where did you go? |
| `source:?` | Where (起点) | Where did you come from? |

#### 付加詞への疑問

| 構文 | 疑問詞 | 例 |
|------|--------|-----|
| `pp(?where, ...)` | Where | Where did you eat? |
| `time(?, ...)` | When | When did you eat? |
| `manner(?, ...)` | How | How did you do it? |
| `pp(?why, ...)` | Why | Why did you eat? |

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
sentence(present+simple(eat(agent:'I, theme:'apple)))
;; → "I eat an apple."
```

### 過去形

```lisp
sentence(past+simple(eat(agent:'I, theme:'apple)))
;; → "I ate an apple."
```

### 進行形

```lisp
sentence(present+progressive(eat(agent:'I, theme:'apple)))
;; → "I am eating an apple."
```

### 完了形

```lisp
sentence(present+perfect(eat(agent:'I, theme:'apple)))
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
modal(certainty:must_have, sentence(past+perfect(eat(agent:'you, theme:'apple))))
;; → "You must have eaten an apple."
```

### 結合価3の動詞（give）

```lisp
sentence(past+simple(give(agent:'I, theme:'book, recipient:'you)))
;; → "I gave you a book."
```

### 複雑な例

```lisp
?(not(modal(possibility:might, sentence(past+perfect(passive(not(eat(agent:'I, theme:'apple))))))))
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
sentence(present+simple(active(eat(agent:'I, theme:'apple))))
```

### 過去形だけ指定

```lisp
;; ユーザー記述
sentence(past(eat(agent:'I, theme:'apple)))

;; コンパイラ展開後
sentence(past+simple(active(eat(agent:'I, theme:'apple))))
```

### 受動態での by 句生成

受動態で `agent` が指定されている場合、コンパイラが自動的に by 句を生成する。

```lisp
;; ユーザー記述（agentなし）
sentence(passive(eat(patient:'apple)))
;; → "The apple was eaten."

;; ユーザー記述（agentあり）
sentence(passive(eat(agent:'I, patient:'apple)))
;; → "The apple was eaten by me."
;; （agentが自動的にby句に変換される）
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

## 限定詞システム（Determiner System）

英語の限定詞は3層構造で表現する。

### 構造

```lisp
noun(pre:'all, det:'the, post:'three, head:'apples)
;; → "all the three apples"
```

### 限定詞の3層

| 層 | 名前 | 要素 |
|----|------|------|
| pre | 前置限定詞 | all, both, half |
| det | 中央限定詞 | the, this, that, a/an, my, your, his, her, its, our, their, no |
| post | 後置限定詞 | one, two, three, many, few, some, several, plural, uncountable |

### 制約

```lisp
;; 固有名詞は限定詞なし
noun(head:'Tokyo)

;; 不可算名詞は一部の後置限定詞のみ
noun(det:'the, head:'water)           ;; OK
noun(post:'three, head:'water)        ;; NG

;; 相互排他的な組み合わせ
noun(det:'a, post:plural)            ;; NG（a + 複数は矛盾）
noun(pre:'all, det:'a)                ;; NG（all + a は矛盾）
```

### 例

```lisp
noun(det:'the, head:'apple)
;; → "the apple"

noun(det:'a, head:'apple)
;; → "an apple"（母音の前は自動で an）

noun(pre:'all, det:'my, head:'friends)
;; → "all my friends"

noun(post:plural, head:'apple)
;; → "apples"（限定詞なしの複数形、pluralは出力されない）

noun(post:uncountable, head:'water)
;; → "water"（不可算名詞のマーク）
```

---

## 等位接続（Coordination）

名詞句と動詞句の等位接続をサポートする。

### 名詞句の等位接続

```lisp
;; "I and you"
and('I, 'you)

;; "an apple or an orange"
or(noun(det:'a, head:'apple), noun(det:'a, head:'orange))

;; 3項以上の場合はフラット化
and('I, 'you, 'he)
;; → "I, you, and he"
```

### 動詞句の等位接続

```lisp
;; "I eat and drink."
sentence(and(eat(agent:'I), drink(agent:'I)))

;; "I run or walk."
sentence(or(run(agent:'I), walk(agent:'I)))
```

### ネスト時の処理

```lisp
;; 同じ接続詞はフラット化
and(and('a, 'b), 'c) → and('a, 'b, 'c)
;; → "a, b, and c"

;; 異なる接続詞は構造を保持
and(or('a, 'b), 'c)
;; → "a or b, and c"
```

---

## 代名詞と極性感応（Pronouns & Polarity）

### 代名詞の種類

```lisp
;; 人称代名詞
'I, 'you, 'he, 'she, 'it, 'we, 'they

;; 所有代名詞（名詞句として使用）
'mine, 'yours, 'his, 'hers, 'ours, 'theirs

;; 指示代名詞
'this, 'that, 'these, 'those

;; 不定代名詞
'someone, 'something, 'everyone, 'everything
'anyone, 'anything, 'nobody, 'nothing
```

**注意**: 所有代名詞と所有限定詞（my, your 等）は異なる。
- 所有限定詞: 名詞を修飾 → `noun(det:'my, head:'book)` → "my book"
- 所有代名詞: 名詞句として使用 → `'mine` → "mine"

```lisp
;; "This book is mine."
be(theme:'this_book, attribute:'mine)

;; "Mine is bigger."
be(theme:'mine, attribute:'bigger)
```

### 格変化

主語位置と目的語位置で自動的に格が変化する。

```lisp
see(agent:'I, theme:'he)
;; → "I see him."（heは目的語なのでhimに変化）

see(agent:'he, theme:'I)
;; → "He sees me."（Iは目的語なのでmeに変化）
```

### 極性感応代名詞

否定文では不定代名詞が自動的に適切な形に変換される。

| 肯定文 | 否定文 |
|--------|--------|
| someone | nobody |
| something | nothing |
| somewhere | nowhere |

```lisp
;; 肯定文
sentence(see(agent:'I, theme:'someone))
;; → "I see someone."

;; 否定文
sentence(not(see(agent:'I, theme:'someone)))
;; → "I see nobody."（自動変換）
;; または "I don't see anyone."（文脈による）
```

---

## 形容詞の語順（Adjective Ordering）

複数の形容詞がある場合、意味カテゴリに基づいて自動的に語順が決定される。

### 標準的な英語形容詞の語順

| 順序 | カテゴリ | 例 |
|------|---------|-----|
| 1 | 評価 (opinion) | beautiful, nice, lovely |
| 2 | サイズ (size) | big, small, large |
| 3 | 年齢 (age) | old, new, young |
| 4 | 形状 (shape) | round, square, flat |
| 5 | 色 (color) | red, blue, green |
| 6 | 起源 (origin) | Japanese, French |
| 7 | 素材 (material) | wooden, metal, cotton |
| 8 | 目的 (purpose) | sleeping (bag), running (shoes) |

**注意**: この語順は目安であり、強制ではない。ユーザーが指定した順序を尊重しつつ、デフォルトではこの順序を適用する。

### 例

```lisp
noun(adj:['big, 'red], head:'apple)
;; → "big red apple"（size → color の順）

noun(adj:['beautiful, 'old, 'wooden], head:'table)
;; → "beautiful old wooden table"（opinion → age → material の順）

noun(adj:['small, 'Japanese, 'wooden], head:'box)
;; → "small Japanese wooden box"（size → origin → material の順）
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

- 接続詞（but, because 等）による複文
- 関係節（the man who ate 等）
- 単文のみを対象とする（ただし単文内の等位接続 and/or はサポート）

---

## 多言語対応の可能性

LinguaScriptは言語中立的な抽象表現（インターリンガ）として機能しうる。

```lisp
;; この抽象表現は言語に依存しない
sentence(past+simple(eat(agent:'I, theme:'apple)))
```

| 言語 | コンパイル結果 |
|------|---------------|
| 英語 | I ate an apple. |
| 日本語 | 私はリンゴを食べた。 |
| ドイツ語 | Ich aß einen Apfel. |
| スペイン語 | Comí una manzana. |

---

## BNF風の形式文法

### 現行実装の文法

```bnf
;; ============================================
;; 文レベル（最外殻から内側へ）
;; ============================================

<utterance>     ::= <time-adv>? <attitude>? "sentence(" <clause> ")"

<attitude>      ::= "imperative("    ;; 命令文

<time-adv>      ::= "time('" <time-word> ", " <utterance-body> ")"
<time-word>     ::= "yesterday" | "today" | "tomorrow" | "now" | "just_now"
                  | "already" | "yet" | "still" | "recently" | "lately" | "soon"

;; ============================================
;; 節レベル（sentence内部）
;; ============================================

<clause>        ::= <tense-aspect> "(" <negation>? <verb-expr> ")"

<tense-aspect>  ::= <tense> "+" <aspect>
<tense>         ::= "past" | "present" | "future"
<aspect>        ::= "simple" | "progressive" | "perfect" | "perfectProgressive"
<negation>      ::= "not("

;; ============================================
;; 動詞句（付加詞でラップ）
;; ============================================

<verb-expr>     ::= <verb-adjuncts>* <verb-core>
<verb-adjuncts> ::= <frequency-adv> | <manner-adv> | <prep-phrase>

<frequency-adv> ::= "frequency('" <freq-word> ", "
<freq-word>     ::= "always" | "usually" | "often" | "sometimes" | "rarely" | "never"

<manner-adv>    ::= "manner('" <manner-word> ", "
<manner-word>   ::= "quickly" | "slowly" | "carefully" | "badly" | "well" | ...

<prep-phrase>   ::= "pp('" <preposition> ", " <noun-expr> ", "
<preposition>   ::= "in" | "on" | "at" | "to" | "from" | "with" | "by" | "for" | "about" | ...

;; ============================================
;; 動詞コア（等位接続対応）
;; ============================================

<verb-core>     ::= <verb-phrase> | <verb-coord>
<verb-coord>    ::= "and(" <verb-expr> ", " <verb-expr> ")"
                  | "or(" <verb-expr> ", " <verb-expr> ")"

<verb-phrase>   ::= <verb-lemma> "(" <arguments>? ")"
<verb-lemma>    ::= "eat" | "give" | "run" | "see" | "like" | "have" | "be" | ...

<arguments>     ::= <argument> ("," <argument>)*
<argument>      ::= <role> ":" <value>

;; ============================================
;; 意味役割
;; ============================================

<role>          ::= <basic-role> | <extended-role>
<basic-role>    ::= "agent" | "theme" | "recipient" | "source" | "goal"
<extended-role> ::= "patient" | "experiencer" | "stimulus"
                  | "beneficiary" | "possessor" | "attribute"

;; ============================================
;; 値（名詞句・形容詞句・疑問）
;; ============================================

<value>         ::= <noun-expr> | <adj-expr> | <question>
<question>      ::= "?" | "?or(" <value> ", " <value> ")"

;; ============================================
;; 名詞句（等位接続対応）
;; ============================================

<noun-expr>     ::= <noun-phrase> | <noun-coord> | <pronoun>

<noun-coord>    ::= "and(" <noun-expr> ", " <noun-expr> ("," <noun-expr>)* ")"
                  | "or(" <noun-expr> ", " <noun-expr> ("," <noun-expr>)* ")"

;; ============================================
;; 名詞句（3層限定詞 + 形容詞 + ヘッド + 後置修飾）
;; ============================================

<noun-phrase>   ::= "noun(" <np-parts> ")"
<np-parts>      ::= <pre-det>? <det>? <post-det>? <adj-part>? <head-part> <np-post-mod>?

<pre-det>       ::= "pre:'" <pre-det-word>
<pre-det-word>  ::= "all" | "both" | "half"

<det>           ::= "det:'" <det-word>
<det-word>      ::= "the" | "a" | "this" | "that" | "these" | "those"
                  | "my" | "your" | "his" | "her" | "its" | "our" | "their" | "no"

<post-det>      ::= "post:'" <post-det-word> | "post:" <meta-value>
<post-det-word> ::= "one" | "two" | "three" | "many" | "few" | "some" | "several"
<meta-value>    ::= "plural" | "uncountable"

<adj-part>      ::= "adj:'" <adjective>                              ;; 単一形容詞
                  | "adj:['" <adjective> ("," "'" <adjective>)* "]"  ;; 複数形容詞

<head-part>     ::= "head:'" <noun-lemma>
<noun-lemma>    ::= "apple" | "book" | "teacher" | "park" | ...

<np-post-mod>   ::= "post:pp('" <preposition> ", " <noun-expr> ")"   ;; 前置詞句修飾
                  | "post:than(" <noun-expr> ")"                     ;; 比較
                  | "post:as('" <adjective> ", " <noun-expr> ")"     ;; 同等比較

;; ============================================
;; 代名詞（クォート付きリテラル）
;; ============================================

<pronoun>       ::= "'" <pronoun-word>
<pronoun-word>  ::= <personal> | <possessive-pron> | <demonstrative-pron> | <indefinite-pron>

<personal>      ::= "I" | "you" | "he" | "she" | "it" | "we" | "they"
<possessive-pron> ::= "mine" | "yours" | "his" | "hers" | "ours" | "theirs"
<demonstrative-pron> ::= "this" | "that" | "these" | "those"
<indefinite-pron> ::= "someone" | "something" | "everyone" | "everything"
                    | "anyone" | "anything" | "nobody" | "nothing"

;; ============================================
;; 形容詞句（attribute役割用）
;; ============================================

<adj-expr>      ::= "'" <adjective>                                  ;; 単純形容詞
                  | "degree('" <degree-word> ", '" <adjective> ")"   ;; 程度修飾

<degree-word>   ::= "very" | "extremely" | "quite" | "rather" | "fairly" | ...
<adjective>     ::= "big" | "small" | "happy" | "sad" | "red" | "old" | ...
```

### 現行実装（モダリティ）

```bnf
;; モダリティ（意味:表層形 記法）
<modal>         ::= "modal(" <modal-type> ":" <surface-form> ", " <sentence> ")"
<modal-type>    ::= "ability" | "permission" | "possibility" | "obligation"
                  | "certainty" | "advice" | "volition" | "prediction"
<surface-form>  ::= "can" | "could" | "may" | "might" | "must" | "must_have"
                  | "should" | "should_have" | "will" | "would"
                  | "had_to" | "was_going_to"

;; モダリティの否定
<neg-modal>     ::= "not(" <modal> ")"

;; 命令文
<attitude>      ::= "imperative("
```

### 将来拡張（未実装）

以下の構文は仕様として定義されているが、現行実装では未対応。

```bnf
;; 疑問文
<attitude>      ::= "?("           ;; Yes/No疑問文・Wh疑問文

;; 態（受動態・使役）
<voice>         ::= "passive(" | "causative("
```

---

## クイックリファレンス

### 現行実装

```lisp
;; 基本構文
sentence(<tense>+<aspect>(<verb>(role:'value, ...)))

;; 例: "I eat an apple."
sentence(present+simple(eat(agent:'I, theme:noun(det:'a, head:'apple))))

;; 過去形: "I ate an apple."
sentence(past+simple(eat(agent:'I, theme:noun(det:'a, head:'apple))))

;; 進行形: "I am eating an apple."
sentence(present+progressive(eat(agent:'I, theme:noun(det:'a, head:'apple))))

;; 完了形: "I have eaten an apple."
sentence(present+perfect(eat(agent:'I, theme:noun(det:'a, head:'apple))))

;; 否定: "I don't eat an apple."
sentence(present+simple(not(eat(agent:'I, theme:noun(det:'a, head:'apple)))))

;; 命令文: "Eat the apple!"
imperative(sentence(present+simple(eat(theme:noun(det:'the, head:'apple)))))

;; 時間副詞: "Yesterday, I ate an apple."
time('yesterday, sentence(past+simple(eat(agent:'I, theme:noun(det:'a, head:'apple)))))

;; 頻度副詞: "I always eat apples."
sentence(present+simple(frequency('always, eat(agent:'I, theme:noun(post:plural, head:'apple)))))

;; 様態副詞: "I quickly eat an apple."
sentence(present+simple(manner('quickly, eat(agent:'I, theme:noun(det:'a, head:'apple)))))

;; 前置詞句: "I eat an apple in the park."
sentence(present+simple(pp('in, noun(det:'the, head:'park), eat(agent:'I, theme:noun(det:'a, head:'apple)))))

;; 等位接続（名詞）: "I and you"
and('I, 'you)

;; 等位接続（動詞）: "I eat and drink."
sentence(present+simple(and(eat(agent:'I), drink(agent:'I))))

;; 名詞句: "all the three big red apples"
noun(pre:'all, det:'the, post:'three, adj:['big, 'red], head:'apple)

;; コピュラ: "She is very happy."
sentence(present+simple(be(theme:'she, attribute:degree('very, 'happy))))

;; モダリティ: "I can run."
modal(ability:can, sentence(present+simple(run(agent:'I))))

;; モダリティ + 過去: "I could run."
modal(ability:could, sentence(past+simple(run(agent:'I))))

;; モダリティの否定: "I don't have to run."
not(modal(obligation:must, sentence(present+simple(run(agent:'I)))))
```

### 現行実装（モダリティ）

```lisp
;; モダリティ（意味:表層形 記法）
modal(ability:can, sentence(...))      ;; "I can run."
modal(obligation:must, sentence(...))  ;; "I must run."
modal(volition:will, sentence(...))    ;; "I will run."（意志）

;; 時制連動（表層形が変化）
modal(ability:could, sentence(past+simple(eat(...))))
;; → "I could eat."

modal(volition:was_going_to, sentence(past+simple(eat(...))))
;; → "I was going to eat."

;; モダリティの否定（義務なし）
not(modal(obligation:must, sentence(...)))
;; → "I don't have to run."（しなくてもよい）

;; 過去時制でのモダリティ否定
time('yesterday, not(modal(obligation:had_to, sentence(past+simple(eat(...))))))
;; → "Yesterday, I didn't have to eat."
```

### 将来拡張（未実装）

```lisp
;; 疑問文
?(sentence(...))           ;; Yes/No疑問文
sentence(verb(theme:?))    ;; Wh疑問文

;; 受動態
sentence(passive(verb(theme:'x)))
```
