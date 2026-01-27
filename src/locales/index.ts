import * as Blockly from 'blockly/core';
import { createContext, useContext } from 'react';
import type { LocaleCode, LocaleData, UIMessages, BlocklyMessages, GrammarMessages } from './types';
import { en } from './en';
import { ja } from './ja';
import { jaHira } from './ja-hira';

// Available locales
export const locales: Record<LocaleCode, LocaleData> = {
  en,
  ja,
  'ja-hira': jaHira,
};

// Get locale from localStorage or default to 'en'
export function getStoredLocale(): LocaleCode {
  const stored = localStorage.getItem('lingua-studio-locale');
  if (stored === 'en' || stored === 'ja' || stored === 'ja-hira') {
    return stored;
  }
  return 'en';
}

// Store locale preference
export function setStoredLocale(code: LocaleCode): void {
  localStorage.setItem('lingua-studio-locale', code);
}

// Apply Blockly locale
export function applyBlocklyLocale(code: LocaleCode): void {
  const locale = locales[code];
  if (!locale) return;

  // Set all Blockly messages from our locale
  Object.entries(locale.blockly).forEach(([key, value]) => {
    Blockly.Msg[key] = value;
  });
}

// Get current locale data
export function getLocale(code: LocaleCode): LocaleData {
  return locales[code] || locales.en;
}

// React Context for UI messages
interface LocaleContextValue {
  code: LocaleCode;
  ui: UIMessages;
  blockly: BlocklyMessages;
  grammar: GrammarMessages;
  setLocale: (code: LocaleCode) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  code: 'en',
  ui: en.ui,
  blockly: en.blockly,
  grammar: en.grammar,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

// Export types
export type { LocaleCode, LocaleData, UIMessages, BlocklyMessages, GrammarMessages };
