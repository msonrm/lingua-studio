import { useState, useMemo, useCallback, useRef } from 'react';
import { BlocklyWorkspace, BlocklyWorkspaceHandle } from './components/BlocklyWorkspace';
import { LinguaScriptBar } from './components/LinguaScriptBar';
import { LinguaScriptView } from './components/LinguaScriptView';
import { VisualizationPanel } from './components/VisualizationPanel';
import { GrammarPanel } from './components/GrammarPanel';
import { SentenceNode } from './types/schema';
import { renderToLinguaScript } from './compiler/linguaScriptRenderer';
import { TransformLog, BlockChange } from './types/grammarLog';
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

type EditorMode = 'blocks' | 'linguascript' | 'ast';
type SidePanelTab = 'timeline' | 'grammar';

function App() {
  const [asts, setASTs] = useState<SentenceNode[]>([]);
  const [sentences, setSentences] = useState<string[]>([]);
  const [grammarLogs, setGrammarLogs] = useState<TransformLog[]>([]);
  const [_blockChanges, setBlockChanges] = useState<BlockChange[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('blocks');
  const [localeCode, setLocaleCode] = useState<LocaleCode>(getStoredLocale());
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('grammar');
  const [workspaceState, setWorkspaceState] = useState<object | null>(null);
  const workspaceRef = useRef<BlocklyWorkspaceHandle>(null);

  // 現在のロケールデータ
  const currentLocale = useMemo(() => getLocale(localeCode), [localeCode]);

  // ロケール切り替え
  const handleLocaleChange = useCallback((code: LocaleCode) => {
    // 現在のワークスペース状態を保存
    const state = workspaceRef.current?.saveState() ?? null;
    setWorkspaceState(state);

    setStoredLocale(code);
    applyBlocklyLocale(code);
    setLocaleCode(code);
    // ワークスペースを再作成してブロックを更新
    setWorkspaceKey(prev => prev + 1);
  }, []);

  // エディターモード切り替え（ブロック/LinguaScript）
  const handleEditorModeChange = useCallback((newMode: EditorMode) => {
    if (newMode === editorMode) return;

    // blocksモードから離れる時、現在のワークスペース状態を保存
    if (editorMode === 'blocks') {
      const state = workspaceRef.current?.saveState() ?? null;
      setWorkspaceState(state);
    }

    // blocksモードに戻る時、ワークスペースを再作成
    if (newMode === 'blocks') {
      setWorkspaceKey(prev => prev + 1);
    }

    setEditorMode(newMode);
  }, [editorMode]);

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
      grammar: currentLocale.grammar,
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
                onClick={() => handleEditorModeChange('blocks')}
              >
                {t.TAB_BLOCKS}
              </button>
              <button
                className={`mode-tab ${editorMode === 'linguascript' ? 'active' : ''}`}
                onClick={() => handleEditorModeChange('linguascript')}
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
            <button
              className={`side-panel-toggle ${showSidePanel ? 'active' : ''}`}
              onClick={() => setShowSidePanel(!showSidePanel)}
              title="Toggle Side Panel"
            >
              <span className="toggle-icon">{showSidePanel ? '»' : '«'}</span>
            </button>
          </div>
        </header>

        {/* LinguaScript Bar - URL-like always-visible display */}
        <LinguaScriptBar
          code={linguaScripts.join('; ')}
          placeholder={t.PLACEHOLDER_LINGUASCRIPT}
        />

        <main className="main">
          <div className="editor-area">
            {/* Main Editor - switches based on mode */}
            <div className="main-editor">
              {editorMode === 'blocks' && (
                <div className="workspace-container">
                  <BlocklyWorkspace
                    ref={workspaceRef}
                    key={workspaceKey}
                    onASTChange={setASTs}
                    onSentenceChange={setSentences}
                    onLogsChange={setGrammarLogs}
                    onBlockChanges={setBlockChanges}
                    initialState={workspaceState}
                  />
                </div>
              )}
              {editorMode === 'linguascript' && (
                <LinguaScriptView
                  code={linguaScripts.join('; ')}
                  placeholder={t.PLACEHOLDER_LINGUASCRIPT}
                />
              )}
              {editorMode === 'ast' && (
                <div className="ast-view">
                  <pre className="ast-code">
                    {asts.length > 0
                      ? JSON.stringify(asts.length === 1 ? asts[0] : asts, null, 2)
                      : t.PLACEHOLDER_AST
                    }
                  </pre>
                </div>
              )}
            </div>

            {/* Side Panel */}
            {showSidePanel && (
              <div className="side-panel">
                <div className="side-panel-tabs">
                  <button
                    className={`side-tab ${sidePanelTab === 'grammar' ? 'active' : ''}`}
                    onClick={() => setSidePanelTab('grammar')}
                  >
                    {t.TAB_GRAMMAR}
                  </button>
                  <button
                    className={`side-tab ${sidePanelTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setSidePanelTab('timeline')}
                  >
                    {t.TAB_TIMELINE}
                  </button>
                </div>
                <div className="side-panel-content">
                  {sidePanelTab === 'grammar' && (
                    <GrammarPanel logs={grammarLogs} />
                  )}
                  {sidePanelTab === 'timeline' && (
                    <VisualizationPanel asts={asts} />
                  )}
                </div>
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
            </div>
          </div>
        </main>
      </div>
    </LocaleContext.Provider>
  );
}

export default App;
