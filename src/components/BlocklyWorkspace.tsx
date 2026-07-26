import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import '../blocks/definitions';
import { createToolbox, setToolboxUpdateCallback } from '../blocks/definitions';
import { placeInitialBlocks } from '../blocks/initialWorkspace';
import { generateMultipleAST } from '../renderer/astGenerator';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { renderToJapanese } from '../renderer/japanese';
import { TransformLog } from '../types/grammarLog';
import { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';

interface BlocklyWorkspaceProps {
  onASTChange: (asts: SentenceNode[]) => void;
  onSentenceChange: (sentences: string[]) => void;
  onJapaneseSentenceChange: (sentences: string[]) => void;
  onLogsChange: (logs: TransformLog[]) => void;
  onResetNotice?: (notice: string | null) => void;
  initialState?: object | null;
}

export interface BlocklyWorkspaceHandle {
  saveState: () => object | null;
}

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, BlocklyWorkspaceProps>(
  function BlocklyWorkspace({ onASTChange, onSentenceChange, onJapaneseSentenceChange, onLogsChange, onResetNotice, initialState }, ref) {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const { ui } = useLocale();

    // 親コンポーネントから状態を保存できるようにする
    useImperativeHandle(ref, () => ({
      saveState: () => {
        if (!workspaceRef.current) return null;
        return Blockly.serialization.workspaces.save(workspaceRef.current);
      },
    }));

    const handleWorkspaceChange = useCallback(() => {
      if (!workspaceRef.current) return;

      const asts = generateMultipleAST(workspaceRef.current);
      onASTChange(asts);

      const allLogs: TransformLog[] = [];
      const sentences = asts.map(ast => {
        try {
          const result = renderToEnglishWithLogs(ast);
          allLogs.push(...result.logs);
          return result.output;
        } catch {
          return ui.ERROR_INCOMPLETE;
        }
      });
      onSentenceChange(sentences);

      // 日本語（統語論のみ）をレンダリング
      const japaneseSentences = asts.map(ast => {
        try {
          return renderToJapanese(ast);
        } catch {
          return '___';
        }
      });
      onJapaneseSentenceChange(japaneseSentences);

      onLogsChange(allLogs);

      // DETブロックのリセット通知をチェック
      if (onResetNotice) {
        const allBlocks = workspaceRef.current.getAllBlocks(false);
        let latestReset: { reason: string; time: number } | null = null;

        for (const block of allBlocks) {
          if (block.type === 'determiner_unified') {
            const blockAny = block as unknown as Record<string, unknown>;
            const resetTime = blockAny._lastResetTime as number | undefined;
            const resetReason = blockAny._lastResetReason as string | undefined;

            if (resetTime && resetReason) {
              // 1秒以内のリセットのみ表示
              if (Date.now() - resetTime < 1000) {
                if (!latestReset || resetTime > latestReset.time) {
                  latestReset = { reason: resetReason, time: resetTime };
                }
              }
              // 古いリセット情報をクリア
              if (Date.now() - resetTime > 1000) {
                blockAny._lastResetReason = undefined;
                blockAny._lastResetTime = undefined;
              }
            }
          }
        }

        onResetNotice(latestReset?.reason ?? null);
      }
    }, [onASTChange, onSentenceChange, onJapaneseSentenceChange, onLogsChange, onResetNotice, ui.ERROR_INCOMPLETE]);

    useEffect(() => {
      if (!blocklyDiv.current) return;

      // ツールボックスを動的に生成（現在のロケールを反映）
      const toolbox = createToolbox();

      // ワークスペースを作成
      const workspace = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
        trashcan: true,
      });

      workspaceRef.current = workspace;

      // 初期状態があれば復元、なければ初期ブロックを配置
      if (initialState) {
        Blockly.serialization.workspaces.load(initialState, workspace);
      } else {
        placeInitialBlocks(workspace);
      }

      // 変更リスナーを追加
      workspace.addChangeListener(handleWorkspaceChange);

      // 初期状態を反映させるため、最初に一度呼び出す
      handleWorkspaceChange();

      // 辞書変更時にツールボックスを更新
      setToolboxUpdateCallback(() => {
        if (workspaceRef.current) {
          workspaceRef.current.updateToolbox(createToolbox());
        }
      });

      // コンテナサイズ変更時にBlocklyをリサイズ
      const resizeObserver = new ResizeObserver(() => {
        Blockly.svgResize(workspace);
      });
      resizeObserver.observe(blocklyDiv.current);

      return () => {
        resizeObserver.disconnect();
        setToolboxUpdateCallback(null);
        workspace.dispose();
      };
    }, [handleWorkspaceChange, initialState]);

    return (
      <div
        ref={blocklyDiv}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
      />
    );
  }
);
