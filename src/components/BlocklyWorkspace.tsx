import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import '../blocks/definitions';
import { createToolbox } from '../blocks/definitions';
import { generateMultipleAST } from '../compiler/astGenerator';
import { renderToEnglishWithLogs } from '../compiler/englishRenderer';
import { TransformLog, BlockChange } from '../types/grammarLog';
import { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';

interface BlocklyWorkspaceProps {
  onASTChange: (asts: SentenceNode[]) => void;
  onSentenceChange: (sentences: string[]) => void;
  onLogsChange: (logs: TransformLog[]) => void;
  onBlockChanges: (changes: BlockChange[]) => void;
  initialState?: object | null;
}

export interface BlocklyWorkspaceHandle {
  saveState: () => object | null;
}

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, BlocklyWorkspaceProps>(
  function BlocklyWorkspace({ onASTChange, onSentenceChange, onLogsChange, onBlockChanges, initialState }, ref) {
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
        'ASPECT': 'Aspect',
        'VERB': 'Verb',
        'PREP_VALUE': 'Preposition',
        'MANNER_VALUE': 'Manner',
        'LOCATIVE_VALUE': 'Location',
        'TIME_ADVERB': 'Time',
        'CENTRAL_DET': 'Determiner',
        'ADJ_VALUE': 'Adjective',
      };
      return fieldMappings[fieldName] || fieldName;
    };

    // ブロック変更イベントを処理
    const handleBlockChange = useCallback((event: Blockly.Events.Abstract) => {
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

      // Send pending block changes and clear
      if (pendingChangesRef.current.length > 0) {
        onBlockChanges([...pendingChangesRef.current]);
        pendingChangesRef.current = [];
      } else {
        onBlockChanges([]);
      }
    }, [onASTChange, onSentenceChange, onLogsChange, onBlockChanges, ui.ERROR_INCOMPLETE]);

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

        const verbBlock = workspace.newBlock('verb_motion');
        verbBlock.initSvg();
        verbBlock.render();

        // MOTION verbをSENTENCEのactionスロットに接続
        const connection = sentenceBlock.getInput('ACTION')?.connection;
        if (connection) {
          connection.connect(verbBlock.previousConnection);
        }

        // PRONOUN "I" を作成してMOTION verbのARG_0（agent）に接続
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

      return () => {
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
