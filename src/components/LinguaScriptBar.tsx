import { useState, useEffect, useRef, useCallback } from 'react';
import Prism from '../lib/prism-linguascript';
import './LinguaScriptBar.css';

interface LinguaScriptBarProps {
  code: string;
  placeholder?: string;
}

export function LinguaScriptBar({ code, placeholder = '// Build a sentence...' }: LinguaScriptBarProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  // シンタックスハイライトを適用
  useEffect(() => {
    if (codeRef.current && code) {
      codeRef.current.innerHTML = Prism.highlight(
        code,
        Prism.languages.linguascript,
        'linguascript'
      );
    }
  }, [code]);

  // クリップボードにコピー
  const handleCopy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  const isEmpty = !code;

  return (
    <div className="linguascript-bar">
      <button
        className="copy-button"
        onClick={handleCopy}
        disabled={isEmpty}
        title={copied ? 'Copied!' : 'Copy for AI'}
      >
        {copied ? '✓' : '📋'}
      </button>
      <div className="code-container">
        {isEmpty ? (
          <span className="placeholder-text">{placeholder}</span>
        ) : (
          <code ref={codeRef} className="language-linguascript">{code}</code>
        )}
      </div>
    </div>
  );
}
