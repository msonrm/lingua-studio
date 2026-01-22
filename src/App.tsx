import { useState, useMemo } from 'react';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';
import { SentenceNode } from './types/schema';
import { renderToLinguaScript } from './compiler/linguaScriptRenderer';
import './App.css';

function App() {
  const [asts, setASTs] = useState<SentenceNode[]>([]);
  const [sentences, setSentences] = useState<string[]>([]);

  // ASTs から LinguaScripts を生成
  const linguaScripts = useMemo(() => {
    return asts.map(ast => {
      try {
        return renderToLinguaScript(ast);
      } catch {
        return '// Error generating LinguaScript';
      }
    });
  }, [asts]);

  return (
    <div className="app">
      <header className="header">
        <h1>Lingua Studio</h1>
        <p className="subtitle">IDE for Natural Language</p>
      </header>

      <main className="main">
        <div className="workspace-container">
          <BlocklyWorkspace
            onASTChange={setASTs}
            onSentenceChange={setSentences}
          />
        </div>

        <div className="output-panel">
          <div className="output-section">
            <h2>Generated Sentence{sentences.length > 1 ? 's' : ''}</h2>
            <div className="sentence-output">
              {sentences.length > 0
                ? sentences.map((s, i) => <div key={i}>{s}</div>)
                : <span className="placeholder">Build a sentence using blocks...</span>
              }
            </div>
          </div>

          <div className="output-section">
            <h2>LinguaScript</h2>
            <pre className="linguascript-output">
              {linguaScripts.length > 0
                ? linguaScripts.join('\n')
                : '// Build a sentence to see LinguaScript'
              }
            </pre>
          </div>

          <div className="output-section">
            <h2>AST{asts.length > 1 ? 's' : ''}</h2>
            <pre className="ast-output">
              {asts.length > 0
                ? JSON.stringify(asts.length === 1 ? asts[0] : asts, null, 2)
                : '// No AST generated yet'
              }
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
