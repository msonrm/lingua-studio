import type { TransformLog } from '../types/grammarLog';
import { useLocale } from '../locales';
import type { GrammarMessages } from '../locales';

interface GrammarPanelProps {
  logs: TransformLog[];
  notification?: string | null;
}

// Get color for transformation type
function getTypeColor(type: string): string {
  switch (type) {
    case 'agreement':
      return '#4CAF50'; // Green - subject related
    case 'tense':
      return '#2196F3'; // Blue - time related
    case 'aspect':
      return '#9C27B0'; // Purple - aspect
    case 'case':
      return '#FF9800'; // Orange - form change
    case 'article':
      return '#795548'; // Brown - article
    case 'do-support':
      return '#F44336'; // Red - insertion
    case 'negation':
      return '#E91E63'; // Pink - negation
    case 'modal':
      return '#673AB7'; // Deep purple - modal
    case 'wh-movement':
      return '#00BCD4'; // Cyan - movement
    case 'inversion':
      return '#009688'; // Teal - swap
    case 'imperative':
      return '#4A148C'; // Dark purple - imperative
    default:
      return '#607D8B'; // Grey - default
  }
}

// Translate message key to localized string
function translateKey(key: string | undefined, grammar: GrammarMessages): string {
  if (!key) return '';
  // Check if it's a message key (UPPERCASE_WITH_UNDERSCORES)
  if (/^[A-Z][A-Z0-9_]+$/.test(key)) {
    const translated = (grammar as unknown as Record<string, string>)[key];
    if (translated) return translated;
  }
  // Return as-is if not a key or not found
  return key;
}

export function GrammarPanel({ logs, notification }: GrammarPanelProps) {
  const { grammar } = useLocale();

  // Translate type name
  const translateType = (type: string): string => {
    const typeKey = `TYPE_${type.toUpperCase().replace(/-/g, '_')}`;
    return translateKey(typeKey, grammar) || type;
  };

  if (logs.length === 0) {
    return (
      <div className="grammar-panel">
        {notification && (
          <div className="grammar-notification">
            <span className="notification-icon">⚠</span>
            <span className="notification-text">{notification}</span>
          </div>
        )}
        <div className="grammar-empty">
          <span className="empty-icon">∅</span>
          <span className="empty-text">{grammar.EMPTY_NO_TRANSFORMATIONS}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-panel">
      {notification && (
        <div className="grammar-notification">
          <span className="notification-icon">⚠</span>
          <span className="notification-text">{notification}</span>
        </div>
      )}
      <div className="grammar-steps">
        {logs.map((log, i) => {
          const typeColor = getTypeColor(log.type);

          // Translate rule and trigger
          const ruleText = translateKey(log.rule, grammar);
          const triggerText = translateKey(log.trigger, grammar);

          return (
            <div key={i} className="grammar-step">
              <div className="step-header">
                <span
                  className="step-type"
                  style={{ backgroundColor: typeColor }}
                >
                  {translateType(log.type)}
                </span>
                {ruleText && (
                  <span className="step-rule">{ruleText}</span>
                )}
              </div>
              <div className="step-content">
                <div className="step-transformation">
                  <span className="step-before">{log.from}</span>
                  <span className="step-arrow">→</span>
                  <span className="step-after">{log.to}</span>
                </div>
                {triggerText && (
                  <div className="step-trigger">{triggerText}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
