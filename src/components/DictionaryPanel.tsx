import { useState, useEffect, useRef } from 'react';
import { useLocale } from '../locales';
import {
  getExtVerbs, getExtNouns, getExtAdjectives, getExtAdverbs,
  addVerb, addNoun, addAdjective, addAdverb,
  removeVerb, removeNoun, removeAdjective, removeAdverb,
  importPackage, exportPackage, getExtWordCount,
  addChangeListener,
  type ExtVerbEntry, type ExtNounEntry, type ExtAdjectiveEntry, type ExtAdverbEntry,
  type DictionaryPackage,
} from '../userDictionary';
import type { VerbCategory, NounCategory, AdjectiveCategory } from '../types/schema';
import type { LanguageFormValues } from '../userDictionary';
import { LanguageFormFields, findMissingRequiredFields } from './LanguageFormFields';

type WordType = 'verb' | 'noun' | 'adjective' | 'adverb';

// Default valency patterns for common verb types
const defaultValencyPatterns = {
  intransitive: [{ role: 'agent' as const, required: true, label: 'agent' }],
  transitive: [
    { role: 'agent' as const, required: true, label: 'agent' },
    { role: 'patient' as const, required: true, label: 'patient' },
  ],
  ditransitive: [
    { role: 'agent' as const, required: true, label: 'agent' },
    { role: 'theme' as const, required: true, label: 'theme' },
    { role: 'recipient' as const, required: true, label: 'recipient' },
  ],
};

export function DictionaryPanel() {
  const { blockly: t } = useLocale();
  const [wordCount, setWordCount] = useState(getExtWordCount());
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<WordType>('verb');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add form state
  const [newLemma, setNewLemma] = useState('');
  const [newWordType, setNewWordType] = useState<WordType>('verb');
  const [newCategory, setNewCategory] = useState<string>('action');
  const [newValencyPattern, setNewValencyPattern] = useState<'intransitive' | 'transitive' | 'ditransitive'>('transitive');
  const [newCountable, setNewCountable] = useState(true);
  /** 言語コード → 入力値。言語パックの userEntryFields から動的に集める */
  const [newForms, setNewForms] = useState<Record<string, LanguageFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateForm = (languageCode: string, key: string, value: string) => {
    setNewForms(prev => ({
      ...prev,
      [languageCode]: { ...prev[languageCode], [key]: value },
    }));
  };

  /** 入力された語形を保存用に整える（空欄は捨てる） */
  const collectForms = (fallbackEn: LanguageFormValues) => {
    const forms: Record<string, LanguageFormValues> = {};
    for (const [code, values] of Object.entries(newForms)) {
      const filled = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v.trim() !== '')
      );
      if (Object.keys(filled).length > 0) forms[code] = filled;
    }
    // 英語は未入力なら規則変化から補う
    if (!forms.en && Object.keys(fallbackEn).length > 0) forms.en = fallbackEn;
    return forms;
  };

  // Listen for changes
  useEffect(() => {
    const unsubscribe = addChangeListener(() => {
      setWordCount(getExtWordCount());
    });
    return unsubscribe;
  }, []);

  // Generate regular forms from lemma
  const generateVerbForms = (lemma: string) => {
    const base = lemma.toLowerCase();
    // Simple heuristics for regular verbs
    const endsWithE = base.endsWith('e');
    const endsWithY = base.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(base[base.length - 2]);
    const endsWithConsonant = !['a', 'e', 'i', 'o', 'u'].includes(base[base.length - 1]);
    const shortVerb = base.length <= 3 && endsWithConsonant;

    let past: string, pp: string, ing: string, s: string;

    if (endsWithE) {
      past = base + 'd';
      pp = base + 'd';
      ing = base.slice(0, -1) + 'ing';
      s = base + 's';
    } else if (endsWithY) {
      past = base.slice(0, -1) + 'ied';
      pp = base.slice(0, -1) + 'ied';
      ing = base + 'ing';
      s = base.slice(0, -1) + 'ies';
    } else if (shortVerb) {
      // Double final consonant for short verbs (e.g., run -> running)
      past = base + base[base.length - 1] + 'ed';
      pp = base + base[base.length - 1] + 'ed';
      ing = base + base[base.length - 1] + 'ing';
      s = base + 's';
    } else {
      past = base + 'ed';
      pp = base + 'ed';
      ing = base + 'ing';
      s = base + 's';
    }

    // base は lemma と同じなので保存しない
    return { past, pp, ing, s };
  };

  const generateNounPlural = (lemma: string) => {
    const base = lemma.toLowerCase();
    if (base.endsWith('s') || base.endsWith('x') || base.endsWith('z') ||
        base.endsWith('ch') || base.endsWith('sh')) {
      return base + 'es';
    }
    if (base.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(base[base.length - 2])) {
      return base.slice(0, -1) + 'ies';
    }
    return base + 's';
  };

  const handleAdd = () => {
    if (!newLemma.trim()) return;

    // 入力を始めた言語については必須項目を満たしていること
    const missing = findMissingRequiredFields(newWordType, newForms);
    if (missing.length > 0) {
      setFormError(missing.map(m => `${m.languageCode}: ${m.field.key}`).join(', '));
      return;
    }
    setFormError(null);

    const lemma = newLemma.trim().toLowerCase();
    let success = false;

    switch (newWordType) {
      case 'verb':
        success = addVerb({
          lemma,
          type: 'action',
          category: newCategory as VerbCategory,
          valency: defaultValencyPatterns[newValencyPattern],
          forms: collectForms(generateVerbForms(lemma)),
        });
        break;
      case 'noun':
        success = addNoun({
          lemma,
          category: newCategory as NounCategory,
          countable: newCountable,
          forms: collectForms({ plural: generateNounPlural(lemma) }),
        });
        break;
      case 'adjective':
        success = addAdjective({
          lemma,
          category: newCategory as AdjectiveCategory,
          forms: collectForms({}),
        });
        break;
      case 'adverb':
        success = addAdverb({
          lemma,
          type: newCategory as 'manner' | 'frequency' | 'degree' | 'time' | 'place',
          forms: collectForms({}),
        });
        break;
    }

    if (success) {
      setNewLemma('');
      setNewForms({});
      setShowAddForm(false);
    }
  };

  const handleRemove = (type: WordType, lemma: string) => {
    switch (type) {
      case 'verb': removeVerb(lemma); break;
      case 'noun': removeNoun(lemma); break;
      case 'adjective': removeAdjective(lemma); break;
      case 'adverb': removeAdverb(lemma); break;
    }
  };

  const handleExport = () => {
    const pkg = exportPackage('my-dictionary');
    const json = JSON.stringify(pkg, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dictionary-pack.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const pkg = JSON.parse(event.target?.result as string) as DictionaryPackage;
        const result = importPackage(pkg);
        alert(`Imported ${result.added} words (${result.skipped} skipped)`);
      } catch {
        alert('Failed to import: invalid JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getCategoryOptions = (type: WordType) => {
    switch (type) {
      case 'verb':
        return ['motion', 'action', 'transfer', 'cognition', 'communication', 'state'];
      case 'noun':
        return ['human', 'animal', 'object', 'place', 'abstract'];
      case 'adjective':
        return ['size', 'age', 'color', 'physical', 'quality', 'emotion'];
      case 'adverb':
        return ['manner', 'frequency', 'degree', 'time', 'place'];
    }
  };

  const renderWordList = () => {
    let words: { lemma: string; info: string }[] = [];

    switch (activeTab) {
      case 'verb':
        words = getExtVerbs().map((v: ExtVerbEntry) => ({
          lemma: v.lemma,
          info: `${v.category} / ${v.valency.length}-arg`,
        }));
        break;
      case 'noun':
        words = getExtNouns().map((n: ExtNounEntry) => ({
          lemma: n.lemma,
          info: `${n.category} / ${n.countable ? 'C' : 'U'}`,
        }));
        break;
      case 'adjective':
        words = getExtAdjectives().map((a: ExtAdjectiveEntry) => ({
          lemma: a.lemma,
          info: a.category,
        }));
        break;
      case 'adverb':
        words = getExtAdverbs().map((a: ExtAdverbEntry) => ({
          lemma: a.lemma,
          info: a.type,
        }));
        break;
    }

    if (words.length === 0) {
      return (
        <div className="dict-empty">
          {t.DICT_EMPTY || 'No words added yet'}
        </div>
      );
    }

    return (
      <div className="dict-word-list">
        {words.map(({ lemma, info }) => (
          <div key={lemma} className="dict-word-item">
            <span className="dict-word-lemma">{lemma}</span>
            <span className="dict-word-info">{info}</span>
            <button
              className="dict-word-remove"
              onClick={() => handleRemove(activeTab, lemma)}
              title="Remove"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dictionary-panel">
      <div className="dict-header">
        <span className="dict-count">{wordCount} {t.DICT_WORDS || 'words'}</span>
        <div className="dict-actions">
          <button className="dict-btn" onClick={handleImport} title="Import">
            {t.DICT_IMPORT || 'Import'}
          </button>
          <button className="dict-btn" onClick={handleExport} title="Export">
            {t.DICT_EXPORT || 'Export'}
          </button>
          <button
            className="dict-btn dict-btn-add"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add word"
          >
            +
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </div>

      {showAddForm && (
        <div className="dict-add-form">
          <div className="dict-form-row">
            <input
              type="text"
              className="dict-input"
              placeholder={t.DICT_LEMMA || 'Lemma (e.g., prepare)'}
              value={newLemma}
              onChange={(e) => setNewLemma(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="dict-form-row">
            <select
              className="dict-select"
              value={newWordType}
              onChange={(e) => {
                setNewWordType(e.target.value as WordType);
                setNewCategory(getCategoryOptions(e.target.value as WordType)[0]);
              }}
            >
              <option value="verb">{t.DICT_VERB || 'Verb'}</option>
              <option value="noun">{t.DICT_NOUN || 'Noun'}</option>
              <option value="adjective">{t.DICT_ADJ || 'Adjective'}</option>
              <option value="adverb">{t.DICT_ADV || 'Adverb'}</option>
            </select>
            <select
              className="dict-select"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {getCategoryOptions(newWordType).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {newWordType === 'verb' && (
            <div className="dict-form-row">
              <select
                className="dict-select"
                value={newValencyPattern}
                onChange={(e) => setNewValencyPattern(e.target.value as 'intransitive' | 'transitive' | 'ditransitive')}
              >
                <option value="intransitive">{t.DICT_INTRANS || 'Intransitive (1 arg)'}</option>
                <option value="transitive">{t.DICT_TRANS || 'Transitive (2 args)'}</option>
                <option value="ditransitive">{t.DICT_DITRANS || 'Ditransitive (3 args)'}</option>
              </select>
            </div>
          )}

          {newWordType === 'noun' && (
            <div className="dict-form-row">
              <label className="dict-checkbox">
                <input
                  type="checkbox"
                  checked={newCountable}
                  onChange={(e) => setNewCountable(e.target.checked)}
                />
                {t.DICT_COUNTABLE || 'Countable'}
              </label>
            </div>
          )}

          {/* 言語別の入力欄。言語パックの userEntryFields から動的に生成される */}
          <LanguageFormFields
            partOfSpeech={newWordType}
            values={newForms}
            onChange={updateForm}
          />

          {formError && <div className="dict-form-error">{formError}</div>}

          <div className="dict-form-row">
            <button className="dict-btn dict-btn-submit" onClick={handleAdd}>
              {t.DICT_ADD || 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="dict-tabs">
        {(['verb', 'noun', 'adjective', 'adverb'] as WordType[]).map((type) => (
          <button
            key={type}
            className={`dict-tab ${activeTab === type ? 'active' : ''}`}
            onClick={() => setActiveTab(type)}
          >
            {type === 'verb' ? (t.DICT_VERB || 'V') :
             type === 'noun' ? (t.DICT_NOUN || 'N') :
             type === 'adjective' ? (t.DICT_ADJ || 'Adj') :
             (t.DICT_ADV || 'Adv')}
          </button>
        ))}
      </div>

      {renderWordList()}
    </div>
  );
}
