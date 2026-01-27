/**
 * DerivationTracker - 変形記録クラス
 *
 * レンダリング中の変形（形態論・統語論）を記録する。
 * グローバル状態ではなく、レンダリングごとにインスタンスを作成。
 */

import type {
  DerivationStep,
  MorphologyStep,
  SyntaxStep,
  TransformationType,
  Derivation,
  DerivationDiff,
  StepWithStatus,
} from './types';
import type { TransformLog, TransformType } from '../types/grammarLog';

export class DerivationTracker {
  private steps: DerivationStep[] = [];
  private inputScript: string = '';

  /**
   * 入力（LinguaScript）を設定
   */
  setInput(script: string): void {
    this.inputScript = script;
  }

  /**
   * 形態論的変形を記録
   *
   * @param type - 変形の種類
   * @param before - 変形前の語
   * @param after - 変形後の語
   * @param rule - ルール名
   * @param description - 変形の説明
   * @param trigger - 変形のトリガー（オプション）
   * @returns 変形後の語（チェーン用）
   */
  recordMorphology(
    type: TransformationType,
    before: string,
    after: string,
    rule: string,
    description: string,
    trigger?: string
  ): string {
    // 変化がある場合のみ記録
    if (before !== after) {
      const step: MorphologyStep = {
        category: 'morphology',
        type,
        rule,
        description,
        before,
        after,
        trigger,
      };
      this.steps.push(step);
    }
    return after;
  }

  /**
   * 形態論的変形を適用して記録
   *
   * transform関数を実行し、結果を記録する。
   * 変化がなくても関数は実行される。
   *
   * @param type - 変形の種類
   * @param before - 変形前の語
   * @param transform - 変形関数
   * @param rule - ルール名
   * @param description - 変形の説明
   * @param trigger - 変形のトリガー（オプション）
   * @returns 変形後の語
   */
  applyMorphology(
    type: TransformationType,
    before: string,
    transform: (input: string) => string,
    rule: string,
    description: string,
    trigger?: string
  ): string {
    const after = transform(before);
    return this.recordMorphology(type, before, after, rule, description, trigger);
  }

  /**
   * 統語論的変形を記録
   *
   * @param type - 変形の種類
   * @param operation - 操作の種類
   * @param rule - ルール名
   * @param description - 変形の説明
   * @param options - 追加オプション
   */
  recordSyntax(
    type: TransformationType,
    operation: SyntaxStep['operation'],
    rule: string,
    description: string,
    options?: {
      element?: string;
      position?: string;
      before?: string[];
      after?: string[];
    }
  ): void {
    const step: SyntaxStep = {
      category: 'syntax',
      type,
      rule,
      description,
      operation,
      ...options,
    };
    this.steps.push(step);
  }

  /**
   * 記録された全ステップを取得
   */
  getSteps(): DerivationStep[] {
    return [...this.steps];
  }

  /**
   * 完全な変形記録を取得
   */
  getDerivation(output: string): Derivation {
    return {
      input: this.inputScript,
      output,
      steps: this.getSteps(),
    };
  }

  /**
   * 記録をクリア
   */
  clear(): void {
    this.steps = [];
    this.inputScript = '';
  }

  /**
   * 形態論ステップのみ取得
   */
  getMorphologySteps(): MorphologyStep[] {
    return this.steps.filter(
      (step): step is MorphologyStep => step.category === 'morphology'
    );
  }

  /**
   * 統語論ステップのみ取得
   */
  getSyntaxSteps(): SyntaxStep[] {
    return this.steps.filter(
      (step): step is SyntaxStep => step.category === 'syntax'
    );
  }

  /**
   * 特定の種類のステップを取得
   */
  getStepsByType(type: TransformationType): DerivationStep[] {
    return this.steps.filter((step) => step.type === type);
  }

  /**
   * 旧形式（TransformLog）への変換
   * 後方互換性のため、既存のUI（GrammarConsole）で使用可能な形式に変換
   */
  toLegacyLogs(): TransformLog[] {
    return this.steps.map((step): TransformLog => {
      if (step.category === 'morphology') {
        return {
          type: step.type as TransformType,
          from: step.before,
          to: step.after,
          trigger: step.description,
          rule: step.trigger || step.rule,
        };
      } else {
        // syntax step
        const from = step.before?.join(' ') || step.element || '';
        const to = step.after?.join(' ') || `${step.operation} ${step.element || ''}`;
        return {
          type: step.type as TransformType,
          from,
          to,
          trigger: step.description,
          rule: step.rule,
        };
      }
    });
  }

  /**
   * 2つの Derivation の差分を計算
   */
  static diff(current: Derivation, previous: Derivation): DerivationDiff {
    const result: StepWithStatus[] = [];
    let added = 0;
    let removed = 0;
    let changed = 0;
    let unchanged = 0;

    // 現在のステップをマップ化（type + rule をキーに）
    const currentMap = new Map<string, DerivationStep>();
    for (const step of current.steps) {
      const key = `${step.type}:${step.rule}`;
      currentMap.set(key, step);
    }

    // 前回のステップをマップ化
    const previousMap = new Map<string, DerivationStep>();
    for (const step of previous.steps) {
      const key = `${step.type}:${step.rule}`;
      previousMap.set(key, step);
    }

    // 現在のステップを処理
    for (const step of current.steps) {
      const key = `${step.type}:${step.rule}`;
      const prevStep = previousMap.get(key);

      if (!prevStep) {
        // 新規追加
        result.push({ step, status: 'added' });
        added++;
      } else if (stepsEqual(step, prevStep)) {
        // 変化なし
        result.push({ step, status: 'unchanged' });
        unchanged++;
      } else {
        // 変更あり
        result.push({ step, status: 'changed', previousStep: prevStep });
        changed++;
      }
    }

    // 削除されたステップを検出
    for (const step of previous.steps) {
      const key = `${step.type}:${step.rule}`;
      if (!currentMap.has(key)) {
        result.push({ step, status: 'removed' });
        removed++;
      }
    }

    return {
      steps: result,
      summary: { added, removed, changed, unchanged },
    };
  }
}

/**
 * 2つのステップが等しいかどうかを判定
 */
function stepsEqual(a: DerivationStep, b: DerivationStep): boolean {
  if (a.category !== b.category) return false;
  if (a.type !== b.type) return false;
  if (a.rule !== b.rule) return false;

  if (a.category === 'morphology' && b.category === 'morphology') {
    return a.before === b.before && a.after === b.after;
  }

  if (a.category === 'syntax' && b.category === 'syntax') {
    return (
      a.operation === b.operation &&
      a.element === b.element &&
      arraysEqual(a.before, b.before) &&
      arraysEqual(a.after, b.after)
    );
  }

  return false;
}

/**
 * 配列の等価性を判定
 */
function arraysEqual(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}
