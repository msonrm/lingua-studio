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
| `question()` | 疑問文 |
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
| `source` | 起点 | leave the room |
| `goal` | 着点 | put X on the table |
| `location` | 位置 | live in Tokyo |

**注意**: `source`/`goal`/`location` は特定の動詞の必須項として使用する。任意の場所表現は `pp()` で表現する。

### 着点・位置を必須とする動詞

UGの観点から、これらの役割が必須項である動詞は valency で定義する（付加詞としての pp() ではない）。

```lisp
;; put: goal が必須
put(agent:'I, theme:'book, goal:'table)
;; → "I put the book on the table."

;; live: location が必須
live(agent:'I, location:'Tokyo)
;; → "I live in Tokyo."
```

| 動詞 | 必須役割 | 前置詞 |
|------|---------|--------|
| put, place, hang | goal | on |
| live, reside | location | in |
| stay | location | at |

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

### 主語ロールの決定

英語レンダラーは、動詞のvalencyで定義された役割の順序に基づいて主語を決定する。
優先順位: `agent` > `experiencer` > `possessor` > `theme`

```lisp
;; eat: valency = [agent, patient]
;; → agent が主語
eat(agent:'I, patient:'apple)
;; → "I eat an apple."

;; see: valency = [experiencer, stimulus]
;; → experiencer が主語
see(experiencer:'I, stimulus:'bird)
;; → "I see a bird."

;; say: valency = [agent, theme]
;; → agent が主語、theme が目的語
say(agent:'I, theme:'hello)
;; → "I say hello."

;; theme のみ指定（agent 欠損）
say(theme:'hello)
;; → "___ says hello."（主語位置に欠損マーカー）
```

**欠損引数の表示**: 必須引数が欠損している場合は `___` マーカーを表示する。
オプショナルな引数が欠損している場合は省略される。

---

## 付加詞（Adjuncts）

場所・時間・様態・理由などは、動詞の必須引数（項）ではなく、任意の修飾要素（付加詞）として扱う。
これらは意味役割ではなく、別の構文機構で表現する。

### 時間副詞（Time Adverbials）

時間表現は `time()` ラッパーで表現する。他の副詞ラッパー（manner, frequency, locative）と同じく動詞句を修飾する。
`time()` は `sentence()` の内側に配置する（他の副詞ラッパーと一貫性を保つため）。

```lisp
;; 具体的な時間
sentence(past+simple(time('yesterday, eat(agent:'I, patient:'apple))))
;; → "Yesterday, I ate an apple."

;; 相的時間（アスペクトに関連）
sentence(present+perfect(time('just_now, eat(agent:'I, patient:'apple))))
;; → "I have just eaten an apple."

;; 時間への疑問（Wh副詞）
sentence(past+simple(time(?when, arrive(agent:'they))))
;; → "When did they arrive?"

;; 時間副詞の種類
'yesterday, 'today, 'tomorrow           ;; 具体的
'now, 'just_now, 'already, 'yet, 'still ;; 相的
'recently, 'lately, 'soon               ;; 相対的
?when                                   ;; 疑問
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
sentence(past+simple(time('yesterday, eat(...))))

;; NG: 過去の具体時点 + 現在完了（英語では非文法的）
sentence(present+perfect(time('yesterday, eat(...))))
;; → コンパイラが警告または自動修正
```

### 様態副詞（Manner Adverbs）

動作の様態は `manner()` ラッパーで表現する。

```lisp
manner('quickly, eat(agent:'I, patient:'apple))
;; → "I quickly eat an apple." / "I eat an apple quickly."

manner('carefully, open(agent:'she, patient:'door))
;; → "She carefully opens the door."

;; 様態への疑問（Wh副詞）
sentence(past+simple(manner(?how, fix(agent:'you, theme:'car))))
;; → "How did you fix the car?"
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

### 場所副詞（Locative Adverbs）

場所は `locative()` ラッパーで表現する。前置詞句とは異なり、単独で場所を示す副詞。

```lisp
locative('here, eat(agent:'I, patient:'apple))
;; → "I eat an apple here."

locative('there, go(agent:'she))
;; → "She goes there."

locative('home, go(agent:'I))
;; → "I go home."

;; 場所への疑問（Wh副詞）
sentence(past+simple(locative(?where, run(agent:'I))))
;; → "Where did I run?"

;; 場所副詞の種類
'here, 'there              ;; 基本（直示的）
'somewhere, 'anywhere      ;; 不定（極性感応）
'everywhere, 'nowhere      ;; 全称・否定
'home                      ;; 特殊（方向も含む）
?where                     ;; 疑問
```

#### 極性感応（Polarity Sensitivity）

`somewhere` は否定文で `anywhere` に自動変換される。

```lisp
locative('somewhere, eat(agent:'I, patient:'apple))
;; → "I eat an apple somewhere."

not(locative('somewhere, eat(agent:'I, patient:'apple)))
;; → "I don't eat an apple anywhere."
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
;; Yes/No疑問文: 疑問詞プレースホルダーなし
question(sentence(past+simple(eat(agent:'you, theme:'apple))))
;; → "Did you eat the apple?"

;; Wh疑問文: 疑問詞プレースホルダーあり
question(sentence(past+simple(eat(agent:'you, theme:?what))))
;; → "What did you eat?"
```

### 疑問詞プレースホルダー

疑問詞は明示的なプレースホルダー（`?who`, `?what`, `?where` など）で指定する。
これにより、出力される疑問詞が一目瞭然となり、AI/人間ともに理解しやすい構文となる。

#### 意味役割への疑問

| 空欄の位置 | 疑問詞 | 例 |
|-----------|--------|-----|
| `agent:?who` | Who | Who ate the apple? |
| `theme:?what` / `patient:?what` | What | What did you eat? |
| `recipient:?whom` | Whom / To whom | Whom did you give the book to? |
| `goal:?where` | Where (着点) | Where did you go? |
| `source:?where` | Where (起点) | Where did you come from? |

```lisp
;; 主語への疑問
question(sentence(past+simple(eat(agent:?who, theme:'apple))))
;; → "Who ate the apple?"

;; 目的語への疑問
question(sentence(past+simple(eat(agent:'you, theme:?what))))
;; → "What did you eat?"

;; 着点への疑問
question(sentence(past+simple(go(agent:'you, goal:?where))))
;; → "Where did you go?"
```

#### 付加詞への疑問

| 構文 | 疑問詞 | 例 |
|------|--------|-----|
| `time(?when, ...)` | When | When did you eat? |
| `manner(?how, ...)` | How | How did you do it? |
| `locative(?where, ...)` | Where | Where did you run? |

```lisp
;; 場所への疑問
sentence(past+simple(locative(?where, run(agent:'I))))
;; → "Where did I run?"

;; 時間への疑問
sentence(past+simple(time(?when, arrive(agent:'they))))
;; → "When did they arrive?"

;; 様態への疑問
sentence(past+simple(manner(?how, fix(agent:'you, theme:'car))))
;; → "How did you fix the car?"
```

**注意**: Wh副詞が存在する場合、`question()` ラッパーは省略可能（自動検出される）。

### 選択疑問

選択肢を提示する疑問文は `?which()` を使用する。

```lisp
question(sentence(present+simple(want(agent:'you, theme:?which('tea, 'coffee)))))
;; → "Which do you want, tea or coffee?"

question(sentence(future+simple(go(agent:'we, goal:?which('beach, 'mountain)))))
;; → "Which will we go to, the beach or the mountain?"
```

### 疑問詞一覧

| プレースホルダー | 出力 | 用途 |
|-----------------|------|------|
| `?who` | Who | 人（主語・目的語） |
| `?whom` | Whom | 人（目的語、フォーマル） |
| `?what` | What | 物・事 |
| `?where` | Where | 場所 |
| `?when` | When | 時間 |
| `?how` | How | 様態・方法 |
| `?why` | Why | 理由 |
| `?which(A, B)` | Which | 選択 |

### `question()` と疑問詞の関係

| `question()` | 疑問詞 | 結果 |
|--------------|--------|------|
| あり | なし | Yes/No疑問文 |
| あり | あり | Wh疑問文 |
| なし | あり | Wh疑問文（自動検出） |
| なし | なし | 平叙文 |

**疑問詞自動検出**: Wh疑問詞（`?who`, `?what`, `?where`, `?when`, `?how`）が文中に存在する場合、`question()` ラッパーがなくても自動的に疑問文として処理される。

```lisp
;; 明示的な question() ラッパー
question(sentence(past+simple(run(agent:?who))))
;; → "Who ran?"

;; question() なしでも同じ結果（自動検出）
sentence(past+simple(run(agent:?who)))
;; → "Who ran?"
```

### 複数Wh疑問詞の処理

英語では複数のWh疑問詞がある場合、最初の1つだけが文頭に移動し、残りは元の位置（in-situ）に留まる。

```lisp
sentence(present+simple(locative(?where, run(agent:?who))))
;; → "Who runs where?"
;; （?who が文頭に移動、?where は in-situ）

sentence(past+simple(give(agent:?who, theme:?what, recipient:'you)))
;; → "Who gave you what?"
;; （?who が文頭に移動、?what は in-situ）
```

**注意**: in-situ の Wh 語は `?` プレフィックスなしで出力される。

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
question(sentence(past+simple(eat(agent:'you, theme:'apple))))
;; → "Did you eat an apple?"
```

### 受動態

```lisp
sentence(past+simple(passive(eat(theme:'apple))))
;; → "The apple was eaten."
;; 注: passive() は未実装
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
question(not(modal(possibility:might, sentence(past+perfect(passive(not(eat(agent:'I, theme:'apple))))))))
;; → "Might the apple not have been eaten?"
;; 注: passive() は未実装
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

### 代名詞 + 修飾

代名詞に形容詞や前置詞句修飾がある場合は `pronoun()` でラップする。

```lisp
;; 単純な代名詞（修飾なし）
'someone
;; → "someone"

;; 不定代名詞 + 形容詞（後置）
pronoun('something, adj:'beautiful)
;; → "something beautiful"

;; 代名詞 + 前置詞句修飾
pronoun('someone, post:pp('in, noun(det:'the, head:'room)))
;; → "someone in the room"

;; 両方の修飾
pronoun('someone, adj:'important, post:pp('from, noun(head:'Tokyo)))
;; → "someone important from Tokyo"
```

**注意**: 修飾がない場合は単純なクォート形式 `'someone` を使用する。

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

<utterance>     ::= <attitude>? "sentence(" <clause> ")"

<attitude>      ::= "imperative(" | "question("    ;; 命令文・疑問文

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
<verb-adjuncts> ::= <frequency-adv> | <manner-adv> | <locative-adv> | <time-adv-wrap> | <prep-phrase>

<frequency-adv> ::= "frequency('" <freq-word> ", "
<freq-word>     ::= "always" | "usually" | "often" | "sometimes" | "rarely" | "never"

<manner-adv>    ::= "manner('" <manner-word> ", " | "manner(?how, "
<manner-word>   ::= "quickly" | "slowly" | "carefully" | "badly" | "well" | ...

<locative-adv>  ::= "locative('" <locative-word> ", " | "locative(?where, "
<locative-word> ::= "here" | "there" | "somewhere" | "anywhere" | "everywhere" | "nowhere" | "home"

<time-adv-wrap> ::= "time('" <time-word> ", " | "time(?when, "

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
<basic-role>    ::= "agent" | "theme" | "recipient" | "source" | "goal" | "location"
<extended-role> ::= "patient" | "experiencer" | "stimulus"
                  | "beneficiary" | "possessor" | "attribute"

;; ============================================
;; 値（名詞句・形容詞句・疑問詞）
;; ============================================

<value>         ::= <noun-expr> | <adj-expr> | <wh-noun>
<wh-noun>       ::= "?who" | "?whom" | "?what"
                  | "?which(" <value> ", " <value> ")"   ;; 選択疑問

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
;; 代名詞（クォート付きリテラル or 修飾付きラッパー）
;; ============================================

<pronoun>       ::= <simple-pronoun> | <modified-pronoun>
<simple-pronoun> ::= "'" <pronoun-word>
<modified-pronoun> ::= "pronoun('" <pronoun-word> ", " <pronoun-mods> ")"

<pronoun-mods>  ::= <pronoun-mod> ("," <pronoun-mod>)*
<pronoun-mod>   ::= <pron-adj> | <pron-pp>
<pron-adj>      ::= "adj:'" <adjective>
                  | "adj:['" <adjective> ("," "'" <adjective>)* "]"
<pron-pp>       ::= "post:pp('" <preposition> ", " <noun-expr> ")"

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

### 現行実装（疑問文）

```bnf
;; 疑問文ラッパー
<attitude>      ::= "question("    ;; Yes/No疑問文・Wh疑問文

;; 疑問詞プレースホルダー（名詞句位置）
<wh-noun>       ::= "?who" | "?whom" | "?what"
                  | "?which(" <value> ", " <value> ")"

;; 疑問詞プレースホルダー（副詞位置）
<wh-adverb>     ::= "?where" | "?when" | "?how"

;; Wh副詞は各ラッパーで使用
<locative-adv>  ::= "locative('" <locative-word> ", " | "locative(" <wh-adverb> ", "
<manner-adv>    ::= "manner('" <manner-word> ", " | "manner(" <wh-adverb> ", "
<time-adv>      ::= "time('" <time-word> ", " | "time(" <wh-adverb> ", "
```

### 将来拡張（未実装）

以下の構文は仕様として定義されているが、現行実装では未対応。

```bnf
;; 態（受動態・使役）
<voice>         ::= "passive(" | "causative("

;; Why疑問詞（設計検討中）
<wh-adverb>     ::= "?why"    ;; reason節との統一的扱いが必要
```

### 将来拡張（論理推論）

LinguaScriptを論理推論言語として拡張するための構文。LLMを推論エンジンとして活用できることが実験で確認されている。

#### 設計思想

- **生成文法からの原理**: 機能範疇の階層（CP > ModP > TP > VP）
- **依存文法からのパラメータ**: 動詞の結合価・意味役割
- **Prolog的な論理意味論**: 事実・ルール・クエリ

#### 真偽値システム

```bnf
;; アサーション（事実の宣言）
<assertion>     ::= "fact(" <proposition> ")"
                  | "fact(" <tense> ", " <proposition> ")"

;; 命題は真偽値を持つ
;; fact(P) は P := true を意味する
```

##### `fact()` と `sentence()` の関係

`fact()` と `sentence()` は**排他的**である。

| 構文 | 用途 | 出力 |
|------|------|------|
| `sentence(P)` | 自然言語文の生成 | "John eats an apple." |
| `fact(P)` | 論理的事実の宣言 | P は真である |

```lisp
;; sentence(): 文を出力（真偽値なし）
sentence(present+simple(eat(agent:'John, theme:'apple)))
;; → "John eats an apple."

;; fact(): 事実を宣言（論理的真理）
fact(eat(agent:'John, theme:'apple))
;; → "eat(John, apple) は真である"
```

##### `fact()` と `modal()` の関係

`fact()` と `modal()` は**排他的**である。モダリティ（能力、義務、可能性など）は話者の判断であり、客観的事実ではないため。

```lisp
;; ✅ OK: 事実の宣言
fact(eat(agent:'John, theme:'apple))

;; ❌ NG: モダリティは事実ではない
fact(modal(ability:can, eat(agent:'John, theme:'apple)))
;; → 「Johnがリンゴを食べられる」は能力の判断であり、事実宣言には不適切
```

##### 時制なし事実（Timeless Facts）

Prolog的な抽象的真理として、時制なしの事実を許容する。

```lisp
;; 時制なし（抽象的真理 - Prolog的）
fact(own(experiencer:'John, theme:'car))
;; → "own(John, car) は真である"（永遠の真理として）

;; 時制あり（特定時点での事実）
fact(past, own(experiencer:'John, theme:'car))
;; → "過去において own(John, car) は真であった"

fact(present, own(experiencer:'John, theme:'car))
;; → "現在 own(John, car) は真である"
```

| 形式 | 意味 | 用途 |
|------|------|------|
| `fact(P)` | 時制なし（timeless） | 論理推論、ルール定義 |
| `fact(past, P)` | 過去の事実 | 時系列推論 |
| `fact(present, P)` | 現在の事実 | 状態の明示 |

```lisp
;; 事実の宣言
fact(own(experiencer:'John, theme:'car))
;; → "own(John, car) は真である"

fact(give(agent:'Mary, theme:'book, recipient:'John))
;; → "give(Mary, book, John) は真である"
```

#### ブール演算（命題レベル）

命題レベルのブール演算は**大文字**で表記する。これは等位接続（小文字 `and`, `or`）と区別するため。

```bnf
<bool-expr>     ::= "AND(" <proposition> ", " <proposition> ")"
                  | "OR(" <proposition> ", " <proposition> ")"
                  | "NOT(" <proposition> ")"
```

##### 等位接続 vs ブール演算

| 構文 | 種類 | 用途 | 例 |
|------|------|------|-----|
| `and()` 小文字 | 等位接続 | NP/VPの接続 | `and('John, 'Mary)` → "John and Mary" |
| `AND()` 大文字 | 論理積 | 命題の論理演算 | `AND(P, Q)` → P ∧ Q |
| `or()` 小文字 | 等位接続 | NP/VPの接続 | `or('tea, 'coffee)` → "tea or coffee" |
| `OR()` 大文字 | 論理和 | 命題の論理演算 | `OR(P, Q)` → P ∨ Q |
| `not()` 小文字 | 動詞否定 | 文の否定 | `not(eat(...))` → "don't eat" |
| `NOT()` 大文字 | 論理否定 | 命題の否定 | `NOT(P)` → ¬P |

```lisp
;; 等位接続（小文字）- 自然言語の "and/or"
fact(like(experiencer:and('John, 'Mary), stimulus:'apple))
;; → "John and Mary like apples."

;; 論理積（大文字）- 命題レベル
fact(AND(own(experiencer:'John, theme:'car), own(experiencer:'Mary, theme:'book)))
;; → "John owns a car" ∧ "Mary owns a book"

;; 論理和（大文字）- 命題レベル
fact(OR(live(experiencer:'Tom, location:'Tokyo), live(experiencer:'Tom, location:'Osaka)))
;; → "Tom lives in Tokyo" ∨ "Tom lives in Osaka"

;; 論理否定（大文字）- 命題レベル
fact(NOT(own(experiencer:'John, theme:'bike)))
;; → ¬"John owns a bike"
```

##### 英語出力（⊨マーカー）

`fact()` の英語出力には記号論理学の `⊨`（double turnstile: "models"）を使用する。

```
⊨ John and Mary like apples.
⊨ John owns a car AND Mary owns a book.
⊨ Tom lives in Tokyo OR Tom lives in Osaka.
⊨ NOT: John owns a bike.
```

#### 含意・因果

条件（含意）と因果関係は**大文字**で表記する。これはブール演算（AND/OR/NOT）と一貫性を持たせるため。

```bnf
;; 条件（含意）
<conditional>   ::= "IF(" <proposition> ", then:" <proposition> ")"

;; 因果関係
<causal>        ::= "BECAUSE(" <proposition> ", effect:" <proposition> ")"
```

```lisp
;; ルール: 「誰かが誰かに何かを与えると、受け手はそれを持つ」
IF(give(agent:?A, theme:?T, recipient:?R),
   then:have(experiencer:?R, theme:?T))

;; 因果: 「雨が降ると地面が濡れる」
BECAUSE(rain(), effect:wet(theme:'ground))
```

##### 英語出力

```
;; IF → "if P, then Q"
IF(rain(), then:wet(theme:'ground))
;; → "if it rains, then the ground is wet"

;; BECAUSE → "Q because P"（結果を先に配置）
BECAUSE(rain(), effect:wet(theme:'ground))
;; → "the ground is wet because it rains"
```

##### ネスト対応

IF/BECAUSE は AND/OR/NOT とネストできる。

```lisp
;; 複合条件
IF(AND(rain(), cold()), then:stay(agent:'I, location:'home))
;; → "if it rains AND it is cold, then I stay home"

;; 複合結果
AND(fact(rain()), IF(rain(), then:wet(theme:'ground)))
;; → "it rains AND if it rains, then the ground is wet"
```

#### クエリ（論理的解釈）

既存の `question()` は論理的には存在量化クエリとして機能する。

```lisp
;; Wh疑問文 = 「文を真とする値を求めよ」
question(eat(agent:?who, theme:'apple))
;; → ∃X. eat(X, apple) を真にする X を求めよ

;; Yes/No疑問文 = 「命題は真か？」
question(eat(agent:'John, theme:'apple))
;; → eat(John, apple) は真か？
```

#### 変数

疑問詞（`?who`, `?what` 等）は論理変数として機能する。

```lisp
;; 変数は単一化（unification）の対象
eat(agent:?X, theme:'apple)
;; ?X は束縛可能な変数

;; 複数変数
give(agent:?who, theme:?what, recipient:'Mary)
;; → ?who = 'Tom, ?what = 'pen （知識ベースから導出）
```

#### 世界仮説（World Assumption）

知識ベースに宣言されていない事実をどう扱うかを選択できる。

##### 閉世界仮説（CWA: Closed World Assumption）

宣言されていない事実は**偽**とみなす（Negation as Failure）。Prolog的な論理プログラミングに適している。

```lisp
;; 知識ベース
fact(own(experiencer:'John, theme:'car))

;; クエリ
question(own(experiencer:'John, theme:'bike))
;; → false（宣言されていないので偽）

question(NOT(own(experiencer:'John, theme:'bike)))
;; → true（閉世界仮説による）
```

##### 開世界仮説（OWA: Open World Assumption）

宣言されていない事実は**不明**（unknown）とみなす。LLMや外部知識との連携に適している。

```lisp
;; 知識ベース
fact(own(experiencer:'John, theme:'car))

;; クエリ
question(own(experiencer:'John, theme:'bike))
;; → unknown（宣言されていないが、偽とは限らない）
;; → LLMや外部知識（Wikidata等）に問い合わせ可能
```

##### 時制 × 世界仮説のマトリクス

| | 閉世界 (CWA) | 開世界 (OWA) |
|---|---|---|
| **時制なし** | Prolog的論理DB | セマンティックWeb/Wikidata |
| **時制あり** | 時系列DB | LLM + 外部知識 |

##### 設定方法

世界仮説はビルドオプションとして設定する（将来実装）。

```lisp
;; ビルドオプション
:world-assumption closed  ;; CWA（デフォルト）
:world-assumption open    ;; OWA
```

##### LLMへの指示例

| 仮説 | LLMへの指示 |
|------|------------|
| CWA | 「以下の事実のみを前提とし、宣言されていない事実は偽とせよ」 |
| OWA | 「以下の事実を前提とし、必要に応じて一般知識も使ってよい」 |

#### LLM連携

LinguaScriptの構造化されたクエリは、LLMに直接投げることで推論エンジンとして活用できる。

```lisp
;; 知識ベース
fact(give(agent:'Mary, theme:'book, recipient:'John))

;; ルール
IF(give(agent:?A, theme:?T, recipient:?R),
   then:have(experiencer:?R, theme:?T))

;; クエリ
question(have(experiencer:'John, theme:?what))
;; → LLMが推論: ?what = 'book
```

**利点**:
- 構造化されたクエリは曖昧さが少ない
- 意味役割が明示されているため検索精度が向上
- 推論過程が人間に説明可能
- 外部知識（Google/Wikidata）との連携が可能

#### 型システム

| 構文 | 型 | 役割 |
|------|-----|------|
| `'John`, `'apple` | 定数（Entity） | 個体 |
| `?who`, `?what`, `?X` | 変数（Variable） | 未知・束縛対象 |
| `eat(...)`, `own(...)` | 命題（Proposition） | 真偽値を持つ |
| `fact(P)` | アサーション | P := true（論理的宣言） |
| `fact(tense, P)` | 時制付きアサーション | 特定時点での真理 |
| `sentence(P)` | 文出力 | 自然言語文を生成 |
| `question(P)` | クエリ | P は真か？/ P を真にする値は？ |
| `and`, `or` (小文字) | 等位接続 | NP/VPの接続 |
| `AND`, `OR`, `NOT` (大文字) | ブール演算子 | 命題の論理演算 |
| `IF(A, then:B)` (大文字) | 含意 | A → B |
| `BECAUSE(C, effect:E)` (大文字) | 因果 | C ⇒ E（因果的含意） |

##### 排他関係

| 構文A | 構文B | 関係 | 理由 |
|-------|-------|------|------|
| `fact()` | `sentence()` | 排他 | 宣言 vs 出力 |
| `fact()` | `modal()` | 排他 | 事実 vs 判断 |
| `fact()` | `question()` | 共存可 | 事実ベース + クエリ |
| `fact()` | `imperative()` | 排他 | 事実 vs 命令 |

#### BNF

```bnf
;; 論理拡張
<logic-expr>    ::= <assertion> | <bool-expr> | <conditional> | <causal>

;; アサーション（時制オプショナル）
<assertion>     ::= "fact(" <proposition> ")"
                  | "fact(" <fact-tense> ", " <proposition> ")"
<fact-tense>    ::= "past" | "present" | "future"

;; ブール演算（命題レベル・大文字）
<bool-expr>     ::= "AND(" <proposition> ", " <proposition> ")"
                  | "OR(" <proposition> ", " <proposition> ")"
                  | "NOT(" <proposition> ")"

;; 等位接続（NP/VPレベル・小文字）は別途定義済み
;; <noun-coord> ::= "and(" ... ")" | "or(" ... ")"
;; <verb-coord> ::= "and(" ... ")" | "or(" ... ")"

;; 条件・因果（大文字）
<conditional>   ::= "IF(" <proposition> ", then:" <proposition> ")"
<causal>        ::= "BECAUSE(" <proposition> ", effect:" <proposition> ")"

;; 命題（時制なしの動詞句、または入れ子の論理式）
<proposition>   ::= <verb-phrase> | <bool-expr> | <conditional> | <causal>

;; 変数（疑問詞と共通）
<variable>      ::= "?" <identifier>
```

#### 型の排他関係

```
┌─────────────────────────────────────────────────────┐
│ 最外殻（排他的選択）                                   │
├─────────────────────────────────────────────────────┤
│ sentence()  → 自然言語文の出力                        │
│ question()  → 疑問文（Yes/No または Wh）              │
│ imperative()→ 命令文                                 │
│ modal()     → モダリティ付き文                        │
│ fact()      → 論理的事実の宣言 ← 【排他】             │
├─────────────────────────────────────────────────────┤
│ fact() は sentence()/modal()/question()/imperative() │
│ と同時に使用できない                                   │
└─────────────────────────────────────────────────────┘
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
sentence(past+simple(time('yesterday, eat(agent:'I, theme:noun(det:'a, head:'apple)))))

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

### 現行実装（疑問文）

```lisp
;; Yes/No疑問文
question(sentence(present+simple(like(agent:'you, theme:'coffee))))
;; → "Do you like coffee?"

;; Wh疑問文（意味役割）
question(sentence(past+simple(eat(agent:?who, theme:'apple))))
;; → "Who ate the apple?"

question(sentence(past+simple(eat(agent:'you, theme:?what))))
;; → "What did you eat?"

;; Wh疑問文（question()省略可 - 自動検出）
sentence(past+simple(eat(agent:?who, theme:'apple)))
;; → "Who ate the apple?"

;; Wh疑問文（副詞疑問詞）
sentence(past+simple(locative(?where, run(agent:'I))))
;; → "Where did I run?"

sentence(past+simple(manner(?how, fix(agent:'you, theme:'car))))
;; → "How did you fix the car?"

sentence(past+simple(time(?when, arrive(agent:'they))))
;; → "When did they arrive?"

;; 複数Wh疑問詞（最初のみ文頭、残りはin-situ）
sentence(present+simple(locative(?where, run(agent:?who))))
;; → "Who runs where?"

;; 選択疑問
question(sentence(present+simple(want(agent:'you, theme:?which('tea, 'coffee)))))
;; → "Which do you want, tea or coffee?"
```

### 将来拡張（未実装）

```lisp
;; 受動態
sentence(passive(verb(theme:'x)))

;; Why疑問詞（設計検討中）
;; sentence(reason(?why, ...))
```
