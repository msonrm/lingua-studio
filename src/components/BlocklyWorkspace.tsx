import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import '../blocks/definitions';
import { createToolbox } from '../blocks/definitions';
import { generateMultipleAST } from '../compiler/astGenerator';
import { renderToEnglish } from '../compiler/englishRenderer';
import { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';

interface BlocklyWorkspaceProps {
  onASTChange: (asts: SentenceNode[]) => void;
  onSentenceChange: (sentences: string[]) => void;
  initialState?: object | null;
}

export interface BlocklyWorkspaceHandle {
  saveState: () => object | null;
}

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, BlocklyWorkspaceProps>(
  function BlocklyWorkspace({ onASTChange, onSentenceChange, initialState }, ref) {
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

      const sentences = asts.map(ast => {
        try {
          return renderToEnglish(ast);
        } catch {
          return ui.ERROR_INCOMPLETE;
        }
      });
      onSentenceChange(sentences);
    }, [onASTChange, onSentenceChange, ui.ERROR_INCOMPLETE]);

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
      workspace.addChangeListener(handleWorkspaceChange);

      // 初期状態を反映させるため、最初に一度呼び出す
      handleWorkspaceChange();

      return () => {
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
