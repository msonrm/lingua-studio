import { useState, useCallback } from 'react';
import './LinguaScriptBar.css';

interface LinguaScriptBarProps {
  code: string;
  placeholder?: string;
}

export function LinguaScriptBar({ code, placeholder = '// Build a sentence...' }: LinguaScriptBarProps) {
  const [copied, setCopied] = useState(false);

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
          <span className="bar-placeholder">{placeholder}</span>
        ) : (
          <code className="bar-code">{code}</code>
        )}
      </div>
    </div>
  );
}
