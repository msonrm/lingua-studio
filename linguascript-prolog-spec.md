# Lingua Studio AST → Prolog 変換仕様書

## 1. 概要

### 1.1 目的
Lingua Studioの内部ASTをProlog形式に変換し、論理的推論を可能にする。

### 1.2 アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                     Lingua Studio                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Blockly ─────→ 内部AST ─────┬────→ Prolog             │
│                               │                          │
│                               └────→ LinguaScript        │
│                                           ↓              │
│                                     人間 / 生成AI         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.3 各層の役割

| 層 | 役割 |
|----|------|
| Blockly | ビジュアルエディタ（入力UI） |
| 内部AST | 正規化された意味表現（Single Source of Truth） |
| Prolog | 機械推論エンジン向け出力 |
| LinguaScript | 人間・生成AI向けテキスト表現（プロトコル） |

### 1.4 LinguaScriptの位置づけ

LinguaScriptは**中間表現ではない**。
- 内部ASTの「レンダリング結果」
- 人間と生成AIが読み書きするためのプロトコル
- パースして戻す必要はない（ASTから直接Prologへ変換）

### 1.5 スコープ
- 対象：modal()を含まない平叙文（事実・規則）
- 非対象：質問文、命令文、モーダル表現（将来拡張）

---

## 2. 内部AST仕様

### 2.1 概要

Blocklyから生成される内部ASTが変換元となる。
以下、AST構造とそのLinguaScript表現を併記する。

### 2.2 基本述語：fact

事実を表す最小単位。

**AST：**
```json
{
  "type": "fact",
  "predicate": "bird",
  "arguments": ["tweety"]
}
```

**LinguaScript表現：**
```
fact(bird(tweety))
```

### 2.3 論理演算子

| 型 | 意味 | 子要素 |
|----|------|--------|
| `and` | 論理積 | children: 2つ以上 |
| `or` | 論理和 | children: 2つ以上 |
| `not` | 否定 | child: 1つ |
| `if` | 条件 | condition, consequence |
| `because` | 因果 | cause, effect |

### 2.4 変数

大文字で始まる識別子は変数として扱う。

```json
{ "type": "fact", "predicate": "bird", "arguments": ["X"] }
```

### 2.5 複合構造の例

**AST：**
```json
{
  "type": "if",
  "condition": {
    "type": "and",
    "children": [
      { "type": "fact", "predicate": "bird", "arguments": ["X"] },
      { "type": "not", "child": { "type": "fact", "predicate": "penguin", "arguments": ["X"] } }
    ]
  },
  "consequence": { "type": "fact", "predicate": "flies", "arguments": ["X"] }
}
```

**LinguaScript表現：**
```
IF(
  AND(
    fact(bird(X)),
    NOT(fact(penguin(X)))
  ),
  fact(flies(X))
)
```

---

## 3. 出力仕様（Prolog）

### 3.1 事実（Fact）

```prolog
predicate(arguments).
```

### 3.2 規則（Rule）

```prolog
head :- body.
```

### 3.3 論理演算子

| LinguaScript | Prolog |
|--------------|--------|
| `AND(A, B)` | `A, B` |
| `OR(A, B)` | `A; B` |
| `NOT(A)` | `\+ A` |
| `IF(A, B)` | `B :- A` |
| `BECAUSE(A, B)` | `B :- A` |

---

## 4. 変換ルール

### 4.1 fact() → 事実

```
fact(bird(tweety))
```
↓
```prolog
bird(tweety).
```

### 4.2 AND() → 連言

```
AND(fact(A), fact(B), fact(C))
```
↓
```prolog
A, B, C
```

### 4.3 OR() → 選言

```
OR(fact(A), fact(B))
```
↓
```prolog
A; B
```

※ Prologでは選言に注意が必要。必要に応じて括弧で囲む。

### 4.4 NOT() → 否定（失敗としての否定）

```
NOT(fact(penguin(X)))
```
↓
```prolog
\+ penguin(X)
```

※ Prologの否定は「閉世界仮説に基づく否定（Negation as Failure）」

### 4.5 IF() → 規則

```
IF(
  fact(condition),
  fact(consequence)
)
```
↓
```prolog
consequence :- condition.
```

結果（consequence）が頭部、条件（condition）が本体になる点に注意。

### 4.6 BECAUSE() → 規則（因果）

```
BECAUSE(
  fact(cause),
  fact(effect)
)
```
↓
```prolog
effect :- cause.
```

論理的にはIF()と同じ変換。メタデータとして因果関係であることを保持したい場合は別途注釈を付与。

### 4.7 入れ子構造

```
IF(
  AND(
    fact(bird(X)),
    NOT(fact(penguin(X)))
  ),
  fact(flies(X))
)
```
↓
```prolog
flies(X) :- bird(X), \+ penguin(X).
```

---

## 5. 型定義（TypeScript）

### 5.1 ノード型定義

```typescript
type ASTNode =
  | FactNode
  | AndNode
  | OrNode
  | NotNode
  | IfNode
  | BecauseNode;

interface FactNode {
  type: 'fact';
  predicate: string;
  arguments: string[];
}

interface AndNode {
  type: 'and';
  children: ASTNode[];
}

interface OrNode {
  type: 'or';
  children: ASTNode[];
}

interface NotNode {
  type: 'not';
  child: ASTNode;
}

interface IfNode {
  type: 'if';
  condition: ASTNode;
  consequence: ASTNode;
}

interface BecauseNode {
  type: 'because';
  cause: ASTNode;
  effect: ASTNode;
}
```

※ 実際のLingua Studio内部ASTと整合させる必要あり

---

## 6. API設計

### 6.1 変換器

```typescript
function toProlog(ast: ASTNode[]): string
```

### 6.2 Prologエンジン統合

```typescript
interface PrologEngine {
  consult(program: string): void;
  query(goal: string): Promise<Answer[]>;
}

interface Answer {
  success: boolean;
  bindings: Record<string, string>;
}
```

### 6.3 統合API

```typescript
async function reason(
  ast: ASTNode[],     // 内部ASTから直接
  queryAst: ASTNode   // クエリもAST形式
): Promise<ReasoningResult>

interface ReasoningResult {
  success: boolean;
  answers: Answer[];
  proof?: string;     // 導出過程（オプション）
}
```

---

## 7. 実装例

### 7.1 変換関数（TypeScript）

```typescript
function nodeToProlog(node: ASTNode): string {
  switch (node.type) {
    case 'fact':
      return `${node.predicate}(${node.arguments.join(', ')})`;
    
    case 'and':
      return node.children.map(nodeToProlog).join(', ');
    
    case 'or':
      return `(${node.children.map(nodeToProlog).join('; ')})`;
    
    case 'not':
      return `\\+ ${nodeToProlog(node.child)}`;
    
    case 'if':
      return `${nodeToProlog(node.consequence)} :- ${nodeToProlog(node.condition)}`;
    
    case 'because':
      return `${nodeToProlog(node.effect)} :- ${nodeToProlog(node.cause)}`;
  }
}

function toProlog(nodes: ASTNode[]): string {
  return nodes.map(n => nodeToProlog(n) + '.').join('\n');
}
```

### 7.2 使用例

```typescript
import pl from 'tau-prolog';

// Blocklyから生成された内部AST（例）
const ast: ASTNode[] = [
  { type: 'fact', predicate: 'bird', arguments: ['tweety'] },
  { type: 'fact', predicate: 'penguin', arguments: ['tux'] },
  { type: 'fact', predicate: 'bird', arguments: ['tux'] },
  {
    type: 'if',
    condition: {
      type: 'and',
      children: [
        { type: 'fact', predicate: 'bird', arguments: ['X'] },
        { type: 'not', child: { type: 'fact', predicate: 'penguin', arguments: ['X'] } }
      ]
    },
    consequence: { type: 'fact', predicate: 'flies', arguments: ['X'] }
  }
];

// AST → Prolog変換
const prolog = toProlog(ast);
// bird(tweety).
// penguin(tux).
// bird(tux).
// flies(X) :- bird(X), \+ penguin(X).

// 実行
const session = pl.create();
session.consult(prolog);
session.query('flies(Who).');
session.answer(a => console.log(pl.format_answer(a)));
// → Who = tweety
```

### 7.3 Lingua Studio統合イメージ

```typescript
// Lingua Studio内での利用
class ReasoningModule {
  private session: pl.type.Session;

  constructor() {
    this.session = pl.create();
  }

  // BlocklyのワークスペースからASTを取得して推論
  async reason(workspace: Blockly.Workspace, query: string): Promise<Answer[]> {
    const ast = workspaceToAST(workspace);  // 既存の変換関数
    const prolog = toProlog(ast);
    
    this.session.consult(prolog);
    this.session.query(query);
    
    const answers: Answer[] = [];
    await this.session.answer(a => answers.push(a));
    return answers;
  }
}
```

---

## 8. 制限事項

### 8.1 現バージョンの制限

| 項目 | 状態 | 備考 |
|------|------|------|
| modal() | 非対応 | 将来拡張 |
| 時制 | 非対応 | メタデータとして保持検討 |
| 量化子（ALL, SOME） | 部分対応 | 変数で暗黙的に表現 |
| 質問文 | 非対応 | クエリ生成として拡張予定 |
| リスト構造 | 非対応 | Prolog構文追加で対応可能 |

### 8.2 Prolog側の制限

- 否定は「失敗としての否定」（CWA準拠）
- 無限ループの可能性（再帰規則に注意）
- 選言の評価順序に依存する場合あり

### 8.3 意味論的ギャップ

| LinguaScript | Prolog | 差異 |
|--------------|--------|------|
| BECAUSE（因果） | :- （含意） | 因果の方向性が失われる |
| 時制情報 | なし | 時間的順序が失われる |
| 意味役割 | 引数順序 | 明示的ラベルが失われる |

---

## 9. 拡張計画

### 9.1 Phase 1（現行）
- 基本事実と規則
- AND, OR, NOT, IF, BECAUSE

### 9.2 Phase 2
- 量化子（FORALL, EXISTS）の明示的サポート
- 質問文 → Prologクエリ変換

### 9.3 Phase 3
- modal()対応（可能性、必然性）
- 時制の保持と時間推論
- 因果推論（因果グラフ統合）

### 9.4 Phase 4
- Semantic Matrixとの統合
- 「UNKNOWN」判定の厳密化（証明不可能性として）

---

## 10. 参考

- Tau Prolog: http://tau-prolog.org/
- ISO Prolog: ISO/IEC 13211-1
- LinguaScript仕様: （別途ドキュメント）
