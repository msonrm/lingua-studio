import { useState, useMemo, useCallback } from 'react';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';
import { SentenceNode } from './types/schema';
import { renderToLinguaScript } from './compiler/linguaScriptRenderer';
import {
  LocaleContext,
  LocaleCode,
  locales,
  getStoredLocale,
  setStoredLocale,
  applyBlocklyLocale,
  getLocale,
} from './locales';
import './App.css';

type EditorMode = 'blocks' | 'linguascript';

function App() {
  const [asts, setASTs] = useState<SentenceNode[]>([]);
  const [sentences, setSentences] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('blocks');
  const [showAST, setShowAST] = useState(false);
  const [localeCode, setLocaleCode] = useState<LocaleCode>(getStoredLocale());
  const [workspaceKey, setWorkspaceKey] = useState(0);

  // 現在のロケールデータ
  const currentLocale = useMemo(() => getLocale(localeCode), [localeCode]);

  // ロケール切り替え
  const handleLocaleChange = useCallback((code: LocaleCode) => {
    setStoredLocale(code);
    applyBlocklyLocale(code);
    setLocaleCode(code);
    // ワークスペースを再作成してブロックを更新
    setWorkspaceKey(prev => prev + 1);
  }, []);

  // UI用のショートカット
  const t = currentLocale.ui;

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
    <LocaleContext.Provider value={{
      code: localeCode,
      ui: currentLocale.ui,
      blockly: currentLocale.blockly,
      setLocale: handleLocaleChange,
    }}>
      <div className="app">
        <header className="header">
          <div className="header-left">
            <h1>{t.APP_TITLE}</h1>
            <p className="subtitle">{t.APP_SUBTITLE}</p>
          </div>
          <div className="header-center">
            <div className="mode-tabs">
              <button
                className={`mode-tab ${editorMode === 'blocks' ? 'active' : ''}`}
                onClick={() => setEditorMode('blocks')}
              >
                {t.TAB_BLOCKS}
              </button>
              <button
                className={`mode-tab ${editorMode === 'linguascript' ? 'active' : ''}`}
                onClick={() => setEditorMode('linguascript')}
                disabled
                title={t.TAB_COMING_SOON}
              >
                {t.TAB_LINGUASCRIPT}
              </button>
            </div>
          </div>
          <div className="header-right">
            <select
              className="locale-selector"
              value={localeCode}
              onChange={(e) => handleLocaleChange(e.target.value as LocaleCode)}
            >
              {Object.entries(locales).map(([code, locale]) => (
                <option key={code} value={code}>{locale.name}</option>
              ))}
            </select>
            <label className="ast-toggle">
              <input
                type="checkbox"
                checked={showAST}
                onChange={(e) => setShowAST(e.target.checked)}
              />
              {t.SHOW_AST}
            </label>
          </div>
        </header>

        <main className="main">
          <div className="workspace-area">
            {editorMode === 'blocks' ? (
              <div className="workspace-container">
                <BlocklyWorkspace
                  key={workspaceKey}
                  onASTChange={setASTs}
                  onSentenceChange={setSentences}
                />
              </div>
            ) : (
              <div className="linguascript-editor">
                <p className="coming-soon">LinguaScript Editor - {t.TAB_COMING_SOON}</p>
              </div>
            )}
          </div>

          <div className="bottom-panel">
            <div className="output-panel">
              <div className="output-section">
                <h2>{t.PANEL_OUTPUT}</h2>
                <div className="sentence-output">
                  {sentences.length > 0
                    ? sentences.map((s, i) => <div key={i}>{s}</div>)
                    : <span className="placeholder">{t.PLACEHOLDER_OUTPUT}</span>
                  }
                </div>
              </div>

              <div className="output-section">
                <h2>{t.PANEL_LINGUASCRIPT}</h2>
                <pre className="linguascript-output">
                  {linguaScripts.length > 0
                    ? linguaScripts.join('\n')
                    : t.PLACEHOLDER_LINGUASCRIPT
                  }
                </pre>
              </div>
            </div>

            <div className="console-panel">
              <div className="output-section">
                <h2>{t.PANEL_GRAMMAR_CONSOLE}</h2>
                <div className="console-output">
                  <p className="console-placeholder">
                    {t.PLACEHOLDER_GRAMMAR}
                  </p>
                </div>
              </div>
            </div>

            {showAST && (
              <div className="ast-panel">
                <div className="output-section">
                  <h2>{t.PANEL_AST}</h2>
                  <pre className="ast-output">
                    {asts.length > 0
                      ? JSON.stringify(asts.length === 1 ? asts[0] : asts, null, 2)
                      : t.PLACEHOLDER_AST
                    }
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </LocaleContext.Provider>
  );
}

export default App;
