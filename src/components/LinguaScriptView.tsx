import { useEffect, useRef } from 'react';
import Prism from '../lib/prism-linguascript';
import './LinguaScriptBar.css'; // 共通のハイライトスタイルを使用

interface LinguaScriptViewProps {
  code: string;
  placeholder?: string;
}

/**
 * LinguaScriptをインデント付きでフォーマットする
 * 括弧の深さに応じてインデントを追加
 */
function formatLinguaScript(code: string): string {
  let result = '';
  let indent = 0;
  const indentStr = '  '; // 2スペース

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];

    if (char === '(') {
      // 開き括弧の後に改行してインデント増加
      result += char + '\n';
      indent++;
      result += indentStr.repeat(indent);
    } else if (char === ')') {
      // 閉じ括弧の前に改行してインデント減少
      indent--;
      result += '\n' + indentStr.repeat(indent) + char;
    } else if (char === ',') {
      // カンマの後は改行
      result += char + '\n' + indentStr.repeat(indent);
      // 次がスペースならスキップ
      if (nextChar === ' ') {
        i++;
      }
    } else if (char === ';') {
      // セミコロン（複数文の区切り）は改行2つ
      result += char + '\n\n';
      // 次がスペースならスキップ
      if (nextChar === ' ') {
        i++;
      }
    } else {
      result += char;
    }
  }

  return result;
}

export function LinguaScriptView({ code, placeholder = '// Build a sentence...' }: LinguaScriptViewProps) {
  const codeRef = useRef<HTMLElement>(null);
  const isEmpty = !code;

  // フォーマット済みコード
  const formattedCode = code ? formatLinguaScript(code) : '';

  // シンタックスハイライトを適用
  useEffect(() => {
    if (codeRef.current && formattedCode) {
      codeRef.current.innerHTML = Prism.highlight(
        formattedCode,
        Prism.languages.linguascript,
        'linguascript'
      );
    }
  }, [formattedCode]);

  return (
    <div className="linguascript-view-container">
      {isEmpty ? (
        <pre className="linguascript-view-code">
          <code className="placeholder-text">{placeholder}</code>
        </pre>
      ) : (
        <pre className="linguascript-view-code">
          <code ref={codeRef} className="language-linguascript">{formattedCode}</code>
        </pre>
      )}
    </div>
  );
}
