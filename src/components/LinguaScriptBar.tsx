import { useState, useCallback } from 'react';
import { useLocale } from '../locales';
import './LinguaScriptBar.css';

interface LinguaScriptBarProps {
  code: string;
  placeholder?: string;
}

export function LinguaScriptBar({ code, placeholder = '// Build a sentence...' }: LinguaScriptBarProps) {
  const [copied, setCopied] = useState(false);
  const { ui } = useLocale();

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
  const copyLabel = copied ? ui.COPIED : ui.COPY;

  return (
    <div className="linguascript-bar">
      <button
        className="copy-button"
        onClick={handleCopy}
        disabled={isEmpty}
        title={copied ? ui.COPIED : ui.COPY_FOR_AI}
      >
        <span className="copy-icon">{copied ? '✓' : '📋'}</span>
        <span className="copy-label">{copyLabel}</span>
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
