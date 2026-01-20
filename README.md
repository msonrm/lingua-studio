## コンセプト

**「意味から文を組み立てる」体験を提供する、自然言語のためのIDE**

プログラミングにおける「やりたいこと → コーディング → ビルド → 実行結果」の流れを、自然言語に適用する：

`伝えたい意味 → ブロック構築 → コンパイル → 自然言語文`

### 核心となる発想

- **動詞は関数**である
- **結合価（valency）はパラメータの型シグネチャ**である
- 動詞を選んだ瞬間、必要なスロット（主語・目的語等）が決まる
- IDEのコード補完のように、文法的に正しい選択肢のみが提示される

### 既存の英語学習との違い

| 従来 | このツール |
| --- | --- |
| 「SVOOは第4文型」→ 暗記 | `give(agent, theme, recipient)` → 体験的理解 |
| 文法規則を覚えてから文を作る | ブロックを組み立てると文法が自然に身につく |

---

## 対象ユーザーと用途

| ユーザー | 用途 |
| --- | --- |
| 英語学習者 | 構造を視覚的に理解、試行錯誤で文法を学ぶ |
| 英文作成者 | 意味から文を構築する補助ツール |
| 架空言語作成者 | 単語登録による独自言語構築 |
| 研究者・開発者 | 多言語翻訳の中間言語実験 |
| AI活用者 | 意図を正確に伝える論理構造構築 |

### 段階的な体験

1. **ブロック構築モード**: 自由にパーツを組み立てて英文生成を楽しむ
2. **中間言語観察モード**: 生成されるAST（抽象構文木）を眺めて構造を理解
3. **補完モード**: IDEのようにコード補完で英作文を効率化

---

## 技術スタック

- **Frontend**: React + TypeScript
- **ブロックUI**: Blockly
- **ホスティング**: Vercel
- **データ**: JSON辞書（AI生成）

---

## 包括関係（何が何をラップできるか）

### 文レベルの構造

`文 (Sentence)
 └─ 時制ブロック (Tense)
     └─ 否定ブロック (Negation) [省略可]
         └─ 副詞ブロック (Adverb) [省略可・複数可]
             └─ 動詞ブロック (Verb)
                 ├─ スロット: 名詞グループ (agent等)
                 ├─ スロット: 名詞グループ (patient等)
                 └─ スロット: 名詞グループ/形容詞グループ (attribute等)`

### 名詞グループの構造

`名詞グループ (NounPhrase)
 └─ 限定詞ブロック (Determiner) [省略可]
     └─ 形容詞ブロック (Adjective) [省略可・複数ネスト可]
         └─ 名詞ブロック (Noun) / 代名詞ブロック (Pronoun)`

### ラップ関係サマリー

| ラップする側 | ラップできる対象 |
| --- | --- |
| Tense | Negation, Adverb, Verb |
| Negation | Adverb, Verb |
| Adverb (様態・頻度) | Adverb, Verb |
| Adverb (程度) | Adjective, Adverb |
| Determiner | Adjective, Noun |
| Adjective | Adjective, Noun |
| Verb.slot | NounPhrase, AdjectivePhrase |

### 末端ノード（ラップしない）

- Noun
- Pronoun

---

## Phase 1 スコープ

### できること

- 動作動詞（run, kick, give, put 等）
- 繋辞動詞（be, seem, become 等）
- 時制（past / present / future）
- 相（simple / progressive / perfect / perfect progressive）
- 否定文
- 命令文（agentスロットが空の場合）
- 形容詞・副詞の修飾
- 様々な結合価パターン（1項〜3項）

### できないこと（Phase 2以降）

- 疑問文
- 受動態
- 複文・接続詞
- 関係節
- 不定詞・動名詞
- 仮定法
- 比較級・最上級

---

## スキーマ定義

### 動詞エントリ

typescript

`interface VerbEntry {
  lemma: string;
  forms: {
    base: string;
    past: string;
    pp: string;        // past participle
    ing: string;       // present participle
    s: string;         // third person singular
    irregular?: Record<string, string>;  // be動詞用
  };
  type: "action" | "copula";
  valency: ArgumentSlot[];
  alternateFrames?: string[];  // 二重目的語構文など
}

interface ArgumentSlot {
  role: SemanticRole;
  required: boolean;
  preposition?: string;  // "to", "on", "at" など
}

type SemanticRole =
  | "agent"        // 動作主
  | "patient"      // 被動者
  | "theme"        // 主題
  | "experiencer"  // 経験者
  | "stimulus"     // 刺激
  | "recipient"    // 受領者
  | "beneficiary"  // 受益者
  | "goal"         // 到達点
  | "source"       // 起点
  | "location"     // 場所
  | "instrument"   // 道具
  | "attribute";   // 属性（繋辞動詞用）`

### 名詞エントリ

typescript

`interface NounEntry {
  lemma: string;
  plural: string;
  category?: "human" | "animal" | "thing" | "place" | "abstract" | "time";
  countable: boolean;
}`

### 形容詞エントリ

typescript

`interface AdjectiveEntry {
  lemma: string;
  comparative?: string;  // bigger
  superlative?: string;  // biggest
}`

### 副詞エントリ

typescript

`interface AdverbEntry {
  lemma: string;
  type: "manner" | "frequency" | "degree" | "time" | "place";
}`

### ASTノード（中間言語）

typescript

`interface SentenceNode {
  type: "sentence";
  clauses: ClauseNode[];
  sentenceType: "declarative" | "imperative";
}

interface ClauseNode {
  type: "clause";
  verbPhrase: VerbPhraseNode;
  tense: "past" | "present" | "future";
  aspect: "simple" | "progressive" | "perfect" | "perfectProgressive";
  polarity: "affirmative" | "negative";
}

interface VerbPhraseNode {
  type: "verbPhrase";
  verb: { lemma: string; valencyRef: string };
  arguments: FilledArgumentSlot[];
  adverbs: { lemma: string; advType: string }[];
}

interface FilledArgumentSlot {
  role: SemanticRole;
  filler: NounPhraseNode | AdjectivePhraseNode | null;
}

interface NounPhraseNode {
  type: "nounPhrase";
  determiner?: { kind: string; lexeme?: string };
  adjectives: { lemma: string }[];
  head: { type: "noun"; lemma: string; number: "singular" | "plural" }
      | { type: "pronoun"; person: 1|2|3; number: "singular" | "plural" };
}

interface AdjectivePhraseNode {
  type: "adjectivePhrase";
  degree?: { lemma: string };  // very, extremely
  head: { lemma: string };
}`

---

## 開発計画

### 辞書構築（4〜5日）

| タスク | 日数 | 方法 |
| --- | --- | --- |
| 動詞辞書（300〜400語） | 2〜3日 | AI生成 + レビュー |
| 名詞辞書（1,000語） | 0.5日 | AI生成 |
| 形容詞辞書（300語） | 0.5日 | AI生成 |
| 副詞辞書（100語） | 0.5日 | AI生成 |
| 機能語（限定詞・前置詞等） | 0.5日 | AI生成 |
| 統合・検証 | 0.5日 |  |

### アプリ構築

| Phase | 内容 |
| --- | --- |
| 1 | Blockly基本セットアップ、動詞ブロック実装 |
| 2 | 名詞グループ、時制・否定の実装 |
| 3 | 英語レンダラー（AST → 英文） |
| 4 | UI改善、補完機能 |
| 5 | 中間言語表示機能 |

---

## 先行研究・参考

| 名称 | 関連性 |
| --- | --- |
| Grammatical Framework (GF) | 抽象構文 → 多言語生成の学術的実装 |
| WordBricks | Scratch風ブロックで文法学習 |
| VerbNet | 動詞の結合価データベース（参考） |
| 依存文法 (Tesnière) | 理論的基盤 |

---

## 次のアクション

1. **リポジトリ作成**（GitHub）
2. **動詞辞書の生成開始**（50語ずつバッチ処理）
3. **Blockly + React のボイラープレート構築**
