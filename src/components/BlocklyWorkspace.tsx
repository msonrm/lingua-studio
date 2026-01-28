import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import '../blocks/definitions';
import { createToolbox } from '../blocks/definitions';
import { generateMultipleAST } from '../renderer/astGenerator';
import { renderToEnglishWithLogs } from '../renderer/english/renderer';
import { TransformLog, BlockChange } from '../types/grammarLog';
import { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';

interface BlocklyWorkspaceProps {
  onASTChange: (asts: SentenceNode[]) => void;
  onSentenceChange: (sentences: string[]) => void;
  onLogsChange: (logs: TransformLog[]) => void;
  onBlockChanges: (changes: BlockChange[]) => void;
  onResetNotice?: (notice: string | null) => void;
  initialState?: object | null;
}

export interface BlocklyWorkspaceHandle {
  saveState: () => object | null;
}

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, BlocklyWorkspaceProps>(
  function BlocklyWorkspace({ onASTChange, onSentenceChange, onLogsChange, onBlockChanges, onResetNotice, initialState }, ref) {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const pendingChangesRef = useRef<BlockChange[]>([]);
    const { ui } = useLocale();

    // 親コンポーネントから状態を保存できるようにする
    useImperativeHandle(ref, () => ({
      saveState: () => {
        if (!workspaceRef.current) return null;
        return Blockly.serialization.workspaces.save(workspaceRef.current);
      },
    }));

    // フィールド名を人間が読みやすい形式に変換
    const getReadableFieldName = (fieldName: string): string => {
      // Common field name mappings
      const fieldMappings: Record<string, string> = {
        'PRONOUN_VALUE': 'Subject',
        'TENSE': 'Tense',
        'TENSE_VALUE': 'Tense',
        'ASPECT': 'Aspect',
        'ASPECT_VALUE': 'Aspect',
        'ABSTRACT_VALUE': 'Tense/Aspect',
        'VERB': 'Verb',
        'PREP_VALUE': 'Preposition',
        'MANNER_VALUE': 'Manner',
        'LOCATIVE_VALUE': 'Location',
        'TIME_ADVERB': 'Time',
        'TIME_VALUE': 'Time',
        'CENTRAL_DET': 'Determiner',
        'ADJ_VALUE': 'Adjective',
      };
      return fieldMappings[fieldName] || fieldName;
    };

    // ブロック変更イベントを処理
    const handleBlockChange = useCallback((event: Blockly.Events.Abstract) => {
      // フィールド値の変更（プルダウン等）
      if (event.type === Blockly.Events.BLOCK_CHANGE) {
        const changeEvent = event as Blockly.Events.BlockChange;
        if (changeEvent.element === 'field' && changeEvent.name) {
          const fieldName = getReadableFieldName(changeEvent.name);
          const oldValue = String(changeEvent.oldValue || '');
          const newValue = String(changeEvent.newValue || '');

          // Skip label values and unchanged values
          if (oldValue !== newValue && !oldValue.startsWith('__label_')) {
            pendingChangesRef.current.push({
              field: fieldName,
              from: oldValue,
              to: newValue,
            });
          }
        }
      }

      // ブロックの接続/切断
      if (event.type === Blockly.Events.BLOCK_MOVE) {
        const moveEvent = event as Blockly.Events.BlockMove;
        // 親が変わった（接続/切断された）
        if (moveEvent.oldParentId !== moveEvent.newParentId) {
          const block = workspaceRef.current?.getBlockById(moveEvent.blockId || '');
          const blockType = block?.type || 'block';

          // ブロックタイプを読みやすい名前に変換
          const getBlockLabel = (type: string): string => {
            const labels: Record<string, string> = {
              'pronoun_block': 'Subject',
              'noun_block': 'Noun',
              'verb_motion': 'Verb',
              'verb_action': 'Verb',
              'verb_transfer': 'Verb',
              'verb_cognition': 'Verb',
              'verb_communication': 'Verb',
              'verb_state': 'Verb',
              'adjective_block': 'Adjective',
              'preposition_verb': 'Preposition',
              'preposition_noun': 'Preposition',
            };
            return labels[type] || type;
          };

          const label = getBlockLabel(blockType);

          if (moveEvent.oldParentId && !moveEvent.newParentId) {
            // 切断された
            pendingChangesRef.current.push({
              field: label,
              from: 'connected',
              to: 'disconnected',
            });
          } else if (!moveEvent.oldParentId && moveEvent.newParentId) {
            // 接続された
            pendingChangesRef.current.push({
              field: label,
              from: 'disconnected',
              to: 'connected',
            });
          }
        }
      }
    }, []);

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
      onLogsChange(allLogs);

      // Send pending block changes and clear (only update if there are changes)
      if (pendingChangesRef.current.length > 0) {
        onBlockChanges([...pendingChangesRef.current]);
        pendingChangesRef.current = [];
      }
      // Note: Don't clear blockChanges when empty - keep showing last change

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
    }, [onASTChange, onSentenceChange, onLogsChange, onBlockChanges, onResetNotice, ui.ERROR_INCOMPLETE]);

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
        // 初期ブロックを配置（SENTENCE + MOTION verb + PRONOUN "I"）
        const sentenceBlock = workspace.newBlock('time_frame');
        sentenceBlock.initSvg();
        sentenceBlock.render();
        sentenceBlock.moveBy(50, 50);

        const verbBlock = workspace.newBlock('verb_action');
        verbBlock.initSvg();
        verbBlock.render();

        // ACTION verbをSENTENCEのactionスロットに接続
        const connection = sentenceBlock.getInput('ACTION')?.connection;
        if (connection) {
          connection.connect(verbBlock.previousConnection);
        }

        // PRONOUN "I" を作成してACTION verbのARG_0（agent）に接続
        const pronounBlock = workspace.newBlock('pronoun_block');
        pronounBlock.setFieldValue('I', 'PRONOUN_VALUE');
        pronounBlock.initSvg();
        pronounBlock.render();

        const agentConnection = verbBlock.getInput('ARG_0')?.connection;
        if (agentConnection) {
          agentConnection.connect(pronounBlock.outputConnection);
        }
      }

      // 変更リスナーを追加
      workspace.addChangeListener(handleBlockChange);
      workspace.addChangeListener(handleWorkspaceChange);

      // 初期状態を反映させるため、最初に一度呼び出す
      handleWorkspaceChange();

      // コンテナサイズ変更時にBlocklyをリサイズ
      const resizeObserver = new ResizeObserver(() => {
        Blockly.svgResize(workspace);
      });
      resizeObserver.observe(blocklyDiv.current);

      return () => {
        resizeObserver.disconnect();
        workspace.dispose();
      };
    }, [handleWorkspaceChange, handleBlockChange, initialState]);

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
