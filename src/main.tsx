import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getStoredLocale, applyBlocklyLocale } from './locales'

// 初期ロケールを適用（Blocklyブロック定義より前に実行）
applyBlocklyLocale(getStoredLocale())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
