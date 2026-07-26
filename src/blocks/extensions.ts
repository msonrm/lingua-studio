/**
 * ユーザー拡張辞書に対応する動的ブロック生成
 *
 * 辞書が変わるたびにブロックを登録し直し、ツールボックスの再生成を要求する。
 */

import * as Blockly from 'blockly';
import type { VerbCategory, NounCategory } from '../types/schema';
import { getExtVerbs, getExtNouns, addChangeListener as addDictChangeListener } from '../userDictionary';
import { COLORS, msg } from './shared';
import { VERB_CATEGORY_KEYS } from './verbs';

// ============================================
// 拡張辞書用の動的ブロック生成
// ============================================

// 拡張動詞ブロックを登録済みかどうかを追跡
const registeredExtVerbBlocks = new Set<string>();
const registeredExtNounBlocks = new Set<string>();

// 拡張動詞ブロックを生成（カテゴリ別）
function createExtVerbCategoryBlock(category: VerbCategory) {
  const blockType = `verb_${category}_ext`;

  // 既に登録済みならスキップ
  if (registeredExtVerbBlocks.has(blockType)) {
    return;
  }

  const config = VERB_CATEGORY_KEYS[category];

  Blockly.Blocks[blockType] = {
    init: function() {
      // 初期化時に拡張辞書から動詞を取得
      const extVerbs = getExtVerbs().filter(v => v.category === category);

      // ベースブロックと同じラベル形式（+マークで区別）
      const label = msg(config.msgKey, config.fallback) + '+';

      this.appendDummyInput()
          .appendField(label)
          .appendField(new Blockly.FieldDropdown(() => {
            // ドロップダウン展開時に最新の拡張辞書を取得
            const currentExtVerbs = getExtVerbs().filter(v => v.category === category);
            return currentExtVerbs.length > 0
              ? currentExtVerbs.map(v => [v.lemma, v.lemma] as [string, string])
              : [['(empty)', '__empty__'] as [string, string]];
          }, this.updateShape.bind(this)), "VERB");

      this.setPreviousStatement(true, "verb");
      this.setColour(config.color);
      this.setTooltip(`${label} verb (user-defined)`);

      // 初期形状を設定
      if (extVerbs.length > 0) {
        this.updateShape(extVerbs[0].lemma);
      }
    },

    updateShape: function(verbLemma: string) {
      if (verbLemma === '__empty__') return verbLemma;

      const extVerbs = getExtVerbs();
      const verb = extVerbs.find(v => v.lemma === verbLemma);
      if (!verb) return verbLemma;

      // 既存のスロットを削除（ARG_で始まるもの）
      const existingInputs = this.inputList
        .filter((input: Blockly.Input) => input.name.startsWith("ARG_"))
        .map((input: Blockly.Input) => input.name);
      existingInputs.forEach((name: string) => this.removeInput(name));

      // 新しいスロットを追加（ベースブロックと同じ形式: ARG_0, ARG_1, ...）
      verb.valency.forEach((slot: { role: string; label?: string; required: boolean }, index: number) => {
        const inputName = `ARG_${index}`;
        const labelKey = slot.label || slot.role;
        const roleKey = `ROLE_${labelKey.toUpperCase()}`;
        const translatedLabel = msg(roleKey, labelKey);
        // ベースブロックと同じチェックタイプ
        const checkType = slot.role === 'attribute'
          ? ['noun', 'nounPhrase', 'adjective', 'coordinatedNounPhrase']
          : ['noun', 'nounPhrase', 'coordinatedNounPhrase'];
        // ベースブロックと同じラベル形式
        const displayLabel = slot.required ? `${translatedLabel}:` : `(${translatedLabel}):`;

        this.appendValueInput(inputName)
            .setCheck(checkType)
            .appendField(displayLabel);
      });

      return verbLemma;
    }
  };

  registeredExtVerbBlocks.add(blockType);
}

// 拡張名詞ブロックを生成（カテゴリ別）
function createExtNounCategoryBlock(category: NounCategory) {
  const blockType = `noun_${category}_ext`;

  if (registeredExtNounBlocks.has(blockType)) {
    return;
  }

  Blockly.Blocks[blockType] = {
    init: function() {

      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown(() => {
            const currentExtNouns = getExtNouns().filter(n => n.category === category);
            return currentExtNouns.length > 0
              ? currentExtNouns.map(n => [n.lemma, n.lemma] as [string, string])
              : [['(empty)', '__empty__'] as [string, string]];
          }), "LEMMA");

      this.setOutput(true, "noun");
      this.setColour(COLORS.person);
      this.setTooltip(`User-defined ${category} noun`);
    }
  };

  registeredExtNounBlocks.add(blockType);
}

// 拡張辞書に単語があるカテゴリのブロックを登録
function registerExtensionBlocks() {
  const extVerbs = getExtVerbs();
  const extNouns = getExtNouns();

  // 動詞: 各カテゴリのブロックを登録
  const verbCategories = new Set(extVerbs.map(v => v.category));
  verbCategories.forEach(cat => createExtVerbCategoryBlock(cat as VerbCategory));

  // 名詞: 各カテゴリのブロックを登録
  const nounCategories = new Set(extNouns.map(n => n.category));
  nounCategories.forEach(cat => createExtNounCategoryBlock(cat as NounCategory));
}

// 初期登録
registerExtensionBlocks();

// 拡張辞書の変更を監視して再登録
let toolboxUpdateCallback: (() => void) | null = null;

export function setToolboxUpdateCallback(callback: (() => void) | null) {
  toolboxUpdateCallback = callback;
}

addDictChangeListener(() => {
  registerExtensionBlocks();
  if (toolboxUpdateCallback) {
    toolboxUpdateCallback();
  }
});

