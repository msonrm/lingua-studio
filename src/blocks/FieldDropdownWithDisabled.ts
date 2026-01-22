import * as Blockly from 'blockly';

/**
 * 無効化オプション付きのカスタムドロップダウンフィールド
 * 教育目的: 選択できない理由を表示することで文法ルールを学習できる
 */

export interface DropdownOptionWithReason {
  label: string;
  value: string;
  disabled?: boolean;
  reason?: string;  // 無効化の理由（日本語/英語）
}

type OptionGenerator = () => DropdownOptionWithReason[];

export class FieldDropdownWithDisabled extends Blockly.FieldDropdown {
  private optionGeneratorWithReason: OptionGenerator | null = null;
  private currentOptions: DropdownOptionWithReason[] = [];

  constructor(
    menuGenerator: OptionGenerator,
    validator?: Blockly.FieldDropdownValidator
  ) {
    // Blockly.FieldDropdown expects [string, string][] format
    // We'll convert our format in getOptions()
    const wrappedGenerator = () => {
      const options = menuGenerator();
      this.currentOptions = options;
      return options.map(o => [o.label, o.value] as [string, string]);
    };

    super(wrappedGenerator, validator);
    this.optionGeneratorWithReason = menuGenerator;
  }

  /**
   * オプションが無効化されているかチェック
   */
  private isOptionDisabled(value: string): DropdownOptionWithReason | undefined {
    return this.currentOptions.find(o => o.value === value && o.disabled);
  }

  /**
   * メニューを表示（オーバーライド）
   */
  protected showEditor_(e?: MouseEvent): void {
    // オプションを更新
    if (this.optionGeneratorWithReason) {
      this.currentOptions = this.optionGeneratorWithReason();
    }

    // 親クラスのshowEditorを呼び出す
    super.showEditor_(e);

    // メニューアイテムにスタイルを適用（遅延実行）
    setTimeout(() => {
      this.applyDisabledStyles();
    }, 0);
  }

  /**
   * 無効化アイテムにスタイルを適用
   */
  private applyDisabledStyles(): void {
    // Blocklyのドロップダウンメニューを取得
    const dropdownDiv = Blockly.DropDownDiv.getContentDiv();
    if (!dropdownDiv) return;

    const menuItems = dropdownDiv.querySelectorAll('.blocklyMenuItem');

    menuItems.forEach((item, index) => {
      const option = this.currentOptions[index];
      if (!option) return;

      const element = item as HTMLElement;

      if (option.disabled) {
        // 無効化スタイルを適用
        element.classList.add('blocklyMenuItemDisabled');
        element.style.color = '#999';
        element.style.cursor = 'not-allowed';
        element.style.fontStyle = 'italic';

        // ツールチップを追加
        if (option.reason) {
          element.title = option.reason;

          // 理由を表示するサブテキストを追加
          const existingReason = element.querySelector('.disabledReason');
          if (!existingReason) {
            const reasonSpan = document.createElement('span');
            reasonSpan.className = 'disabledReason';
            reasonSpan.style.cssText = `
              display: block;
              font-size: 10px;
              color: #c66;
              margin-top: 2px;
              font-style: normal;
            `;
            reasonSpan.textContent = `  ${option.reason}`;
            element.appendChild(reasonSpan);
          }
        }

        // クリックを無効化
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      }
    });
  }

  /**
   * 値の設定（無効化チェック付き）
   */
  setValue(newValue: string): void {
    // ブロックが完全に初期化されていない場合はスキップ
    // （初期化中はsourceBlock_がnullまたはworkspaceがない）
    const sourceBlock = this.getSourceBlock();
    if (!sourceBlock || !sourceBlock.workspace) {
      super.setValue(newValue);
      return;
    }

    // 現在のオプションを取得（安全に）
    try {
      if (this.optionGeneratorWithReason) {
        this.currentOptions = this.optionGeneratorWithReason();
      }

      // 無効化されているオプションは設定しない
      const disabledOption = this.isOptionDisabled(newValue);
      if (disabledOption) {
        // 無効化されている場合は何もしない
        return;
      }
    } catch {
      // エラーが発生した場合は通常の設定を行う
    }

    super.setValue(newValue);
  }

  /**
   * フィールドをクローン
   */
  static fromJson(_options: object): FieldDropdownWithDisabled {
    // JSON からの復元は標準のドロップダウンを使用
    return new FieldDropdownWithDisabled(() => []);
  }
}

// Blocklyに登録
Blockly.fieldRegistry.register('field_dropdown_disabled', FieldDropdownWithDisabled);
