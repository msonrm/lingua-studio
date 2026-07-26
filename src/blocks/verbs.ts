/**
 * カテゴリ別の動詞ブロック（motion / action / transfer / cognition / communication / state）
 *
 * 動詞の valency（結合価）に応じて引数スロットを動的に生成する。
 */

import * as Blockly from 'blockly';
import type { VerbCategory } from '../types/schema';
import { getVerbCoresByCategory } from '../concepts';
import { COLORS, msg } from './shared';

// ============================================
// カテゴリ別動詞ブロック
// ============================================
export const VERB_CATEGORY_KEYS: Record<VerbCategory, { msgKey: string; fallback: string; color: string }> = {
  motion: { msgKey: 'VERB_MOTION', fallback: 'MOTION', color: COLORS.verbMotion },
  action: { msgKey: 'VERB_ACTION', fallback: 'ACTION', color: COLORS.verbAction },
  transfer: { msgKey: 'VERB_TRANSFER', fallback: 'TRANSFER', color: COLORS.verbTransfer },
  cognition: { msgKey: 'VERB_COGNITION', fallback: 'COGNITION', color: COLORS.verbCognition },
  communication: { msgKey: 'VERB_COMMUNICATION', fallback: 'COMMUNICATION', color: COLORS.verbCommunication },
  state: { msgKey: 'VERB_STATE', fallback: 'STATE', color: COLORS.verbState },
};

// カテゴリ別動詞ブロック生成関数
function createVerbCategoryBlock(category: VerbCategory) {
  const config = VERB_CATEGORY_KEYS[category];
  const categoryVerbs = getVerbCoresByCategory(category);

  Blockly.Blocks[`verb_${category}`] = {
    init: function() {
      const verbOptions: [string, string][] = categoryVerbs.map(v => [v.lemma, v.lemma]);
      const label = msg(config.msgKey, config.fallback);

      this.appendDummyInput()
          .appendField(label)
          .appendField(new Blockly.FieldDropdown(verbOptions, this.updateShape.bind(this)), "VERB");

      this.setPreviousStatement(true, "verb");
      this.setColour(config.color);
      this.setTooltip(`${label} verb`);

      // 初期形状を設定
      if (categoryVerbs.length > 0) {
        this.updateShape(categoryVerbs[0].lemma);
      }
    },

    updateShape: function(verbLemma: string) {
      const verb = categoryVerbs.find(v => v.lemma === verbLemma);
      if (!verb) return verbLemma;

      // 既存のスロットを削除（ARG_で始まるもの）
      const existingInputs = this.inputList
        .filter((input: Blockly.Input) => input.name.startsWith("ARG_"))
        .map((input: Blockly.Input) => input.name);

      existingInputs.forEach((name: string) => this.removeInput(name));

      // 新しいスロットを追加
      verb.valency.forEach((slot: { role: string; label?: string; required: boolean }, index: number) => {
        const inputName = `ARG_${index}`;
        const labelKey = slot.label || slot.role;
        const roleKey = `ROLE_${labelKey.toUpperCase()}`;
        const translatedLabel = msg(roleKey, labelKey);
        const checkType = slot.role === 'attribute' ? ['noun', 'nounPhrase', 'adjective', 'coordinatedNounPhrase'] : ['noun', 'nounPhrase', 'coordinatedNounPhrase'];
        const displayLabel = slot.required ? `${translatedLabel}:` : `(${translatedLabel}):`;
        this.appendValueInput(inputName)
            .setCheck(checkType)
            .appendField(displayLabel);
      });

      return verbLemma;
    }
  };
}

// 6カテゴリの動詞ブロックを生成
(['motion', 'action', 'transfer', 'cognition', 'communication', 'state'] as VerbCategory[]).forEach(createVerbCategoryBlock);

