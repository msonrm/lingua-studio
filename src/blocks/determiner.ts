/**
 * 統合限定詞ブロック（determiner_unified）
 *
 * 前置・中央・後置の3つのプルダウンを持ち、接続された名詞の種類
 * （可算/不可算/固有名詞）に応じて選択肢と値を自動補正する。
 */

import * as Blockly from 'blockly';
import { findNounCore } from '../concepts';
import {
  getPreDeterminers, getCentralDeterminers, getPostDeterminers,
  calculateNounTypeValues, wouldBeValidCombination,
  type DetField, type NounType, type DeterminerOption,
} from '../languages/en/determiners';
import { COLORS, msg } from './shared';

// ============================================
// 統合限定詞ブロック（3つのプルダウン）- 新設計版
// ============================================
Blockly.Blocks['determiner_unified'] = {
  init: function() {
    // Blockly の init は this がブロックを指す。以降のクロージャから参照するため退避する。
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const block = this;

    // 接続された名詞のプロパティを取得（形容詞チェーンを辿る）
    const getConnectedNounInfo = (): { countable: boolean; proper: boolean; zeroArticle: boolean } | null => {
      const nounInput = block.getInput('NOUN');
      if (!nounInput) return null;
      const connection = nounInput.connection;
      if (!connection || !connection.targetBlock()) return null;
      let targetBlock = connection.targetBlock();
      if (!targetBlock) return null;

      // 形容詞ブロックのチェーンを辿って名詞ブロックを探す
      while (targetBlock && targetBlock.type.startsWith('adjective_')) {
        const adjNounInput = targetBlock.getInput('NOUN');
        if (!adjNounInput || !adjNounInput.connection) {
          return null; // 形容詞の先に何も接続されていない
        }
        targetBlock = adjNounInput.connection.targetBlock();
      }
      if (!targetBlock) return null;

      const fieldMap: Record<string, string> = {
        'human_block': 'HUMAN_VALUE',
        'animal_block': 'ANIMAL_VALUE',
        'object_block': 'OBJECT_VALUE',
        'place_block': 'PLACE_VALUE',
        'abstract_block': 'ABSTRACT_VALUE',
      };
      const fieldName = fieldMap[targetBlock.type];
      if (!fieldName) return null;
      const nounLemma = targetBlock.getFieldValue(fieldName);
      if (!nounLemma || nounLemma.startsWith('__')) return null;
      const nounEntry = findNounCore(nounLemma);
      if (!nounEntry) return null;
      return {
        countable: nounEntry.countable,
        proper: nounEntry.proper === true,
        zeroArticle: nounEntry.zeroArticle === true,
      };
    };

    // 名詞タイプを判定
    const getNounType = (): NounType | null => {
      const nounInfo = getConnectedNounInfo();
      if (!nounInfo) return null;
      if (nounInfo.proper) return 'proper';
      if (nounInfo.zeroArticle) return 'zeroArticle';
      if (!nounInfo.countable) return 'uncountable';
      return 'countable';
    };

    // 現在のDET値を取得
    const getCurrentValues = () => ({
      PRE: block.getFieldValue('PRE') || '__none__',
      CENTRAL: block.getFieldValue('CENTRAL') || '__none__',
      POST: block.getFieldValue('POST') || '__none__',
    });

    // 無効マーク付きラベルを生成
    const markInvalid = (label: string) => `× ${label}`;

    // 一括更新中の目標値（更新完了まで参照用）
    let targetValues: { PRE: string; CENTRAL: string; POST: string } | null = null;

    // オプション生成時に使う値を取得（更新中は目標値を優先）
    const getValuesForOptions = () => targetValues ?? getCurrentValues();

    // オプション生成（共通ロジック）
    // 名詞タイプ別の有効リストを使って判定（単一の真実のソース）
    const getOptionsForField = (
      field: DetField,
      determiners: DeterminerOption[]
    ): [string, string][] => {
      const values = getValuesForOptions();
      const nounType = getNounType();

      return determiners.map(o => {
        // ラベル行は有効性チェックをスキップ（そのまま表示）
        if (o.value.startsWith('__label_')) {
          return [o.label, o.value];
        }

        // 組み合わせの有効性チェック（名詞タイプ別リストに基づく）
        if (!wouldBeValidCombination(field, o.value, values, nounType)) {
          return [markInvalid(o.label), o.value];
        }

        return [o.label, o.value];
      });
    };

    // 各フィールドのオプション生成
    const getPreOptions = (): [string, string][] =>
      getOptionsForField('PRE', getPreDeterminers());

    const getCentralOptions = (): [string, string][] =>
      getOptionsForField('CENTRAL', getCentralDeterminers());

    const getPostOptions = (): [string, string][] =>
      getOptionsForField('POST', getPostDeterminers());

    // 一括更新モードフラグ（バリデーターをバイパスするため）
    let bulkUpdateMode = false;

    // バリデータ：無効なオプション（×マーク付き）とラベル行を選んだら拒否
    const createValidator = (
      getOptions: () => [string, string][]
    ) => {
      return function(this: Blockly.FieldDropdown, newValue: string) {
        // 一括更新モード中はバリデーションをスキップ
        if (bulkUpdateMode) {
          return newValue;
        }

        // ラベル行（__label_で始まる）の選択を拒否
        if (newValue.startsWith('__label_')) {
          return null;
        }

        const options = getOptions();
        const selected = options.find(([, v]) => v === newValue);
        if (selected && selected[0].startsWith('×')) {
          return null;  // 選択を拒否
        }

        return newValue;
      };
    };

    this.appendValueInput("NOUN")
        .setCheck(["noun", "adjective"])
        .appendField(msg('DETERMINER_LABEL', 'DET'))
        .appendField(new Blockly.FieldDropdown(getPreOptions, createValidator(getPreOptions)), "PRE")
        .appendField(new Blockly.FieldDropdown(getCentralOptions, createValidator(getCentralOptions)), "CENTRAL")
        .appendField(new Blockly.FieldDropdown(getPostOptions, createValidator(getPostOptions)), "POST");

    this.setOutput(true, "nounPhrase");
    this.setColour(COLORS.determiner);
    this.setTooltip(msg('DETERMINER_TOOLTIP', 'Determiner: pre + central + post'));

    // 内部関数を保存（onchangeで使用）
    this._getNounType = getNounType;
    this._getCurrentValues = getCurrentValues;

    // 一括更新関数（バリデーションをスキップして値をまとめて設定）
    this._bulkSetValues = (values: { PRE: string; CENTRAL: string; POST: string }) => {
      targetValues = values;  // 更新中は目標値を参照させる
      bulkUpdateMode = true;
      try {
        block.setFieldValue(values.PRE, 'PRE');
        block.setFieldValue(values.CENTRAL, 'CENTRAL');
        block.setFieldValue(values.POST, 'POST');
      } finally {
        bulkUpdateMode = false;
        targetValues = null;  // 更新完了後はクリア
      }
    };
  },

  // 接続変更・名詞変更時に名詞タイプ制約を適用
  onchange: function(e: Blockly.Events.Abstract) {
    if (!this.workspace) return;

    // 接続された名詞ブロックを取得
    const nounInput = this.getInput('NOUN');
    const connectedBlock = nounInput?.connection?.targetBlock();

    // BLOCK_MOVE: ブロック接続/切断
    // BLOCK_CHANGE: 接続中の名詞ブロック内のドロップダウン変更
    const isRelevantEvent =
      e.type === Blockly.Events.BLOCK_MOVE ||
      (e.type === Blockly.Events.BLOCK_CHANGE &&
       connectedBlock &&
       (e as Blockly.Events.BlockChange).blockId === connectedBlock.id);

    if (!isRelevantEvent) return;

    const nounType = this._getNounType?.() as NounType | null;
    if (!nounType) return;

    const currentValues = this._getCurrentValues?.() as { PRE: string; CENTRAL: string; POST: string };
    if (!currentValues) return;

    // 名詞タイプに基づいて新しい値を計算
    const newValues = calculateNounTypeValues(nounType, currentValues);
    if (newValues) {
      // 計算した値を一括で適用（バリデーションをバイパス）
      this._bulkSetValues?.(newValues);
    }

    // ドロップダウンの表示を強制更新（×マーク状態が変わる可能性があるため）
    // 値が変わらなくても、名詞タイプ変更で有効/無効が変わることがある
    const forceRefreshDropdowns = () => {
      const preField = this.getField('PRE') as Blockly.FieldDropdown;
      const centralField = this.getField('CENTRAL') as Blockly.FieldDropdown;
      const postField = this.getField('POST') as Blockly.FieldDropdown;

      // キャッシュをバイパスしてオプションを再取得し、setValue で表示を更新
      // 参考: https://github.com/google/blockly/issues/3099
      [preField, centralField, postField].forEach(field => {
        if (field) {
          field.getOptions(false);  // キャッシュをクリア
          const currentValue = field.getValue();
          if (currentValue) {
            field.setValue(currentValue);  // 同じ値を再設定して表示を更新
          }
        }
      });
    };

    // 値の変更後にUIを更新（setTimeoutで確実に値の反映後に実行）
    setTimeout(forceRefreshDropdowns, 0);
  },
};

