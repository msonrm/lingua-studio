import { useState, useMemo } from 'react';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';
import { SentenceNode } from './types/schema';
import { renderToLinguaScript } from './compiler/linguaScriptRenderer';
import './App.css';

type EditorMode = 'blocks' | 'linguascript';

function App() {
  const [asts, setASTs] = useState<SentenceNode[]>([]);
  const [sentences, setSentences] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('blocks');
  const [showAST, setShowAST] = useState(false);

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
        <div className="header-left">
          <h1>Lingua Studio</h1>
          <p className="subtitle">IDE for Natural Language</p>
        </div>
        <div className="header-center">
          <div className="mode-tabs">
            <button
              className={`mode-tab ${editorMode === 'blocks' ? 'active' : ''}`}
              onClick={() => setEditorMode('blocks')}
            >
              🧱 Blocks
            </button>
            <button
              className={`mode-tab ${editorMode === 'linguascript' ? 'active' : ''}`}
              onClick={() => setEditorMode('linguascript')}
              disabled
              title="Coming soon"
            >
              📝 LinguaScript
            </button>
          </div>
        </div>
        <div className="header-right">
          <label className="ast-toggle">
            <input
              type="checkbox"
              checked={showAST}
              onChange={(e) => setShowAST(e.target.checked)}
            />
            AST
          </label>
        </div>
      </header>

      <main className="main">
        <div className="workspace-area">
          {editorMode === 'blocks' ? (
            <div className="workspace-container">
              <BlocklyWorkspace
                onASTChange={setASTs}
                onSentenceChange={setSentences}
              />
            </div>
          ) : (
            <div className="linguascript-editor">
              <p className="coming-soon">LinguaScript Editor - Coming Soon</p>
            </div>
          )}
        </div>

        <div className="bottom-panel">
          <div className="output-panel">
            <div className="output-section">
              <h2>Output</h2>
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
          </div>

          <div className="console-panel">
            <div className="output-section">
              <h2>Grammar Console</h2>
              <div className="console-output">
                <p className="console-placeholder">
                  Grammar explanations will appear here...
                </p>
              </div>
            </div>
          </div>

          {showAST && (
            <div className="ast-panel">
              <div className="output-section">
                <h2>AST</h2>
                <pre className="ast-output">
                  {asts.length > 0
                    ? JSON.stringify(asts.length === 1 ? asts[0] : asts, null, 2)
                    : '// No AST generated yet'
                  }
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
