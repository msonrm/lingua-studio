import { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import '../blocks/definitions';
import { toolbox } from '../blocks/definitions';
import { generateAST } from '../compiler/astGenerator';
import { renderToEnglish } from '../compiler/englishRenderer';
import { SentenceNode } from '../types/schema';

interface BlocklyWorkspaceProps {
  onASTChange: (ast: SentenceNode | null) => void;
  onSentenceChange: (sentence: string) => void;
}

export function BlocklyWorkspace({ onASTChange, onSentenceChange }: BlocklyWorkspaceProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const handleWorkspaceChange = useCallback(() => {
    if (!workspaceRef.current) return;

    const ast = generateAST(workspaceRef.current);
    onASTChange(ast);

    if (ast) {
      try {
        const sentence = renderToEnglish(ast);
        onSentenceChange(sentence);
      } catch {
        onSentenceChange('(incomplete)');
      }
    } else {
      onSentenceChange('');
    }
  }, [onASTChange, onSentenceChange]);

  useEffect(() => {
    if (!blocklyDiv.current) return;

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

    // 初期ブロックを配置（SENTENCE + VERB）
    const sentenceBlock = workspace.newBlock('time_frame');
    sentenceBlock.initSvg();
    sentenceBlock.render();
    sentenceBlock.moveBy(50, 50);

    const verbBlock = workspace.newBlock('verb');
    verbBlock.initSvg();
    verbBlock.render();

    // VERBをSENTENCEのpredicateスロットに接続
    const connection = sentenceBlock.getInput('ACTION')?.connection;
    if (connection) {
      connection.connect(verbBlock.previousConnection);
    }

    // 変更リスナーを追加
    workspace.addChangeListener(handleWorkspaceChange);

    return () => {
      workspace.dispose();
    };
  }, [handleWorkspaceChange]);

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
