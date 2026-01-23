# Lingua Studio

**「意味から文を組み立てる」自然言語のためのIDE**

ブロックを組み合わせて英文を生成する学習ツール。動詞の結合価（valency）に基づいて、文法的に正しい文だけが作れる。

## 特徴

- **動詞は関数** - 動詞を選ぶと必要なスロット（主語・目的語等）が決まる
- **視覚的な文法理解** - ブロックの組み立てで英文構造を体感
- **制約による正しさ** - 無効な組み合わせは選択不可

## LinguaScript

ブロックから生成される中間表現。LISP風の明示的な構文で、構造を正確に記述する。

名詞・代名詞はLISPのquoteのようにアポストロフィ `'` で始まる。

```
present(simple(run(the('cat))))
→ "The cat runs."

past(perfect(see('I, the('man))))
→ "I had seen the man."

present(simple(run(and(the('cat), the('dog)))))
→ "The cat and the dog run."
```

### 構文

| 関数 | 説明 | 例 |
|-----|------|-----|
| `'noun` | 名詞（quote） | `'cat`, `'dog` |
| `present`, `past`, `future` | 時制 | `past(...)` |
| `simple`, `perfect`, `progressive` | 相 | `perfect(...)` |
| `the`, `a` | 限定詞 | `the('cat)` |
| `not` | 否定 | `not(run(...))` |
| `and`, `or` | 等位接続 | `and(np1, np2)` |
| `to`, `with`, `in`... | 前置詞 | `to(go(...), the('park))` |

## 技術スタック

- React + TypeScript
- Blockly
- Vite

## 開発

```bash
npm install
npm run dev
```
