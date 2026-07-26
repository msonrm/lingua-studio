/**
 * ブロック定義の集約
 *
 * このモジュールを import すると、副作用としてすべてのブロックが
 * `Blockly.Blocks` に登録される。利用側は `import '../blocks'` するだけでよい。
 *
 * ⚠ import の順序に意味がある:
 *   1. shared / blockData / prepositions … 依存のないデータと基盤
 *   2. 各カテゴリのブロック定義      … Blockly.Blocks への登録
 *   3. extensions                    … 拡張辞書ブロックの初期登録とリスナー設定
 *   4. toolbox                       … 登録済みのブロックを参照してツールボックスを組む
 */

// --- ブロック定義（副作用 import）---
import './sentence';
import './verbs';
import './verbModifiers';
import './nouns';
import './determiner';
import './nounModifiers';
import './question';
import './logic';
import './extensions';

// --- 公開 API ---
export { createToolbox } from './toolbox';
export { setToolboxUpdateCallback } from './extensions';
export { TIME_CHIP_DATA, DETERMINER_DATA } from './blockData';
