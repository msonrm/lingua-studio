import { SentenceNode } from '../types/schema';

interface VisualizationPanelProps {
  asts: SentenceNode[];
}

export function VisualizationPanel({ asts: _asts }: VisualizationPanelProps) {
  // Timeline tab is "coming soon" - show empty state
  return (
    <div className="visualization-panel">
      <div className="coming-soon-placeholder">
        <span className="coming-soon-icon">🚧</span>
        <span className="coming-soon-text">Coming soon...</span>
      </div>
    </div>
  );
}

/* ============================================
   Commented out for future use
   ============================================

// Extract prepositions from AST recursively
function extractPrepositions(obj: unknown, found: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== 'object') return found;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractPrepositions(item, found);
    }
  } else {
    const record = obj as Record<string, unknown>;
    if (record.type === 'prepositionalPhrase' && typeof record.preposition === 'string') {
      found.add(record.preposition);
    }
    for (const value of Object.values(record)) {
      extractPrepositions(value, found);
    }
  }

  return found;
}

// Preposition Diagram Component
function PrepositionDiagram({ activePreps }: { activePreps: Set<string> }) {
  const { blockly: t } = useLocale();

  // Location prepositions
  const locationPreps = [
    { prep: 'in', label: 'in', icon: 'in-box' },
    { prep: 'on', label: 'on', icon: 'on-surface' },
    { prep: 'at', label: 'at', icon: 'at-point' },
    { prep: 'under', label: 'under', icon: 'under' },
    { prep: 'behind', label: 'behind', icon: 'behind' },
  ];

  // Direction prepositions
  const directionPreps = [
    { prep: 'to', label: 'to', icon: 'arrow-to' },
    { prep: 'from', label: 'from', icon: 'arrow-from' },
    { prep: 'into', label: 'into', icon: 'arrow-into' },
  ];

  // Relation prepositions
  const relationPreps = [
    { prep: 'with', label: 'with', icon: 'with' },
    { prep: 'of', label: 'of', icon: 'of' },
    { prep: 'for', label: 'for', icon: 'for' },
    { prep: 'about', label: 'about', icon: 'about' },
  ];

  // ... render functions omitted for brevity
}

*/
