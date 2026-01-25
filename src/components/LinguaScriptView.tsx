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
  const codeRef = useRef<HTMLDivElement>(null);
  const isEmpty = !code;

  // フォーマット済みコード
  const formattedCode = code ? formatLinguaScript(code) : '';

  // 行に分割してハイライト
  const lines = formattedCode ? formattedCode.split('\n') : [];

  // シンタックスハイライトを適用
  useEffect(() => {
    if (codeRef.current && lines.length > 0) {
      const lineElements = codeRef.current.querySelectorAll('.line-content');
      lineElements.forEach((el, i) => {
        if (lines[i] !== undefined) {
          el.innerHTML = Prism.highlight(
            lines[i],
            Prism.languages.linguascript,
            'linguascript'
          ) || '&nbsp;'; // 空行はnbsp
        }
      });
    }
  }, [formattedCode, lines]);

  return (
    <div className="linguascript-view-container">
      {isEmpty ? (
        <div className="linguascript-view-code">
          <span className="placeholder-text">{placeholder}</span>
        </div>
      ) : (
        <div ref={codeRef} className="linguascript-view-code line-numbers">
          {lines.map((line, i) => (
            <div key={i} className="code-line">
              <span className="line-number">{i + 1}</span>
              <code className="line-content">{line || '\u00A0'}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
