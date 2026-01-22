import { useState, useMemo } from 'react';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';
import { SentenceNode } from './types/schema';
import { renderToLinguaScript } from './compiler/linguaScriptRenderer';
import './App.css';

function App() {
  const [ast, setAST] = useState<SentenceNode | null>(null);
  const [sentence, setSentence] = useState<string>('');

  // AST から LinguaScript を生成
  const linguaScript = useMemo(() => {
    if (!ast) return null;
    try {
      return renderToLinguaScript(ast);
    } catch {
      return '// Error generating LinguaScript';
    }
  }, [ast]);

  return (
    <div className="app">
      <header className="header">
        <h1>Lingua Studio</h1>
        <p className="subtitle">IDE for Natural Language</p>
      </header>

      <main className="main">
        <div className="workspace-container">
          <BlocklyWorkspace
            onASTChange={setAST}
            onSentenceChange={setSentence}
          />
        </div>

        <div className="output-panel">
          <div className="output-section">
            <h2>Generated Sentence</h2>
            <div className="sentence-output">
              {sentence || <span className="placeholder">Build a sentence using blocks...</span>}
            </div>
          </div>

          <div className="output-section">
            <h2>LinguaScript</h2>
            <pre className="linguascript-output">
              {linguaScript || '// Build a sentence to see LinguaScript'}
            </pre>
          </div>

          <div className="output-section">
            <h2>AST (Abstract Syntax Tree)</h2>
            <pre className="ast-output">
              {ast ? JSON.stringify(ast, null, 2) : '// No AST generated yet'}
            </pre>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          Try building: <strong>"Colorless green ideas sleep furiously."</strong>
        </p>
        <p className="hint">
          Hint: Use SENTENCE → VERB(sleep) → NP(ideas, plural) with ADJ(colorless, green) → ADV(furiously)
        </p>
      </footer>
    </div>
  );
}

export default App;
