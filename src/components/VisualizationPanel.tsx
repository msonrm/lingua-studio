import { useMemo } from 'react';
import { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';

interface VisualizationPanelProps {
  asts: SentenceNode[];
}

// Extract tense/aspect from AST
function extractTenseAspect(asts: SentenceNode[]): { tense: string | null; aspect: string | null } {
  for (const ast of asts) {
    if (ast.clause) {
      return {
        tense: ast.clause.tense || null,
        aspect: ast.clause.aspect || null
      };
    }
  }
  return { tense: null, aspect: null };
}

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

// Tense/Aspect Timeline Component
function TenseAspectDiagram({ tense, aspect }: { tense: string | null; aspect: string | null }) {
  const { blockly: t } = useLocale();

  const labels = {
    past: t.VIZ_TENSE_PAST,
    present: t.VIZ_TENSE_PRESENT,
    future: t.VIZ_TENSE_FUTURE,
    simple: t.VIZ_ASPECT_SIMPLE,
    progressive: t.VIZ_ASPECT_PROGRESSIVE,
    perfect: t.VIZ_ASPECT_PERFECT,
    perfectProgressive: t.VIZ_ASPECT_PERF_PROG,
    title: t.VIZ_TENSE_ASPECT_TITLE,
  };

  // Active aspect icon color (bright for dark background)
  const activeColor = '#fff';
  const inactiveColor = '#666';

  return (
    <div className="viz-section">
      <h4>{labels.title}</h4>

      {/* Timeline */}
      <svg viewBox="0 0 200 60" className="tense-timeline">
        {/* Timeline line */}
        <line x1="20" y1="30" x2="180" y2="30" stroke="#666" strokeWidth="2" />

        {/* Past marker */}
        <g className={`timeline-marker ${tense === 'past' ? 'active' : ''}`}>
          <circle cx="40" cy="30" r="8" fill={tense === 'past' ? '#DC143C' : '#444'} />
          <text x="40" y="50" textAnchor="middle" fontSize="10">{labels.past}</text>
        </g>

        {/* Present marker */}
        <g className={`timeline-marker ${tense === 'present' ? 'active' : ''}`}>
          <circle cx="100" cy="30" r="8" fill={tense === 'present' ? '#2E7D32' : '#444'} />
          <text x="100" y="50" textAnchor="middle" fontSize="10">{labels.present}</text>
        </g>

        {/* Future marker */}
        <g className={`timeline-marker ${tense === 'future' ? 'active' : ''}`}>
          <circle cx="160" cy="30" r="8" fill={tense === 'future' ? '#1565C0' : '#444'} />
          <text x="160" y="50" textAnchor="middle" fontSize="10">{labels.future}</text>
        </g>

        {/* Arrow heads */}
        <polygon points="15,30 25,25 25,35" fill="#666" />
        <polygon points="185,30 175,25 175,35" fill="#666" />
      </svg>

      {/* Aspect icons */}
      <div className="aspect-icons">
        <div className={`aspect-item ${aspect === 'simple' ? 'active' : ''}`}>
          <svg viewBox="0 0 30 30" className="aspect-icon">
            <circle cx="15" cy="15" r="6" fill={aspect === 'simple' ? activeColor : inactiveColor} />
          </svg>
          <span>{labels.simple}</span>
        </div>
        <div className={`aspect-item ${aspect === 'progressive' ? 'active' : ''}`}>
          <svg viewBox="0 0 30 30" className="aspect-icon">
            <circle cx="15" cy="15" r="8" fill="none" stroke={aspect === 'progressive' ? activeColor : inactiveColor} strokeWidth="2" strokeDasharray="4 2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 15 15"
                to="360 15 15"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="15" cy="15" r="3" fill={aspect === 'progressive' ? activeColor : inactiveColor} />
          </svg>
          <span>{labels.progressive}</span>
        </div>
        <div className={`aspect-item ${aspect === 'perfect' ? 'active' : ''}`}>
          <svg viewBox="0 0 30 30" className="aspect-icon">
            <path
              d="M8 15 L13 20 L22 10"
              fill="none"
              stroke={aspect === 'perfect' ? activeColor : inactiveColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span>{labels.perfect}</span>
        </div>
        <div className={`aspect-item ${aspect === 'perfectProgressive' ? 'active' : ''}`}>
          <svg viewBox="0 0 30 30" className="aspect-icon">
            <circle cx="15" cy="15" r="8" fill="none" stroke={aspect === 'perfectProgressive' ? activeColor : inactiveColor} strokeWidth="2" strokeDasharray="4 2" />
            <path
              d="M10 15 L13 18 L20 11"
              fill="none"
              stroke={aspect === 'perfectProgressive' ? activeColor : inactiveColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>{labels.perfectProgressive}</span>
        </div>
      </div>
    </div>
  );
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

  const renderLocationIcon = (icon: string, active: boolean) => {
    const color = active ? '#1565C0' : '#999';
    const bgColor = active ? '#E3F2FD' : '#f5f5f5';

    switch (icon) {
      case 'in-box':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <rect x="8" y="12" width="24" height="20" fill="none" stroke={color} strokeWidth="2" rx="2" />
            <circle cx="20" cy="24" r="4" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'on-surface':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <line x1="5" y1="28" x2="35" y2="28" stroke={color} strokeWidth="3" />
            <circle cx="20" cy="22" r="5" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'at-point':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="20" cy="20" r="12" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="20" cy="20" r="4" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'under':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <line x1="5" y1="15" x2="35" y2="15" stroke={color} strokeWidth="3" />
            <circle cx="20" cy="26" r="5" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'behind':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <rect x="18" y="10" width="14" height="20" fill={bgColor} stroke={color} strokeWidth="2" rx="2" />
            <circle cx="14" cy="20" r="5" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderDirectionIcon = (icon: string, active: boolean) => {
    const color = active ? '#2E7D32' : '#999';

    switch (icon) {
      case 'arrow-to':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="10" cy="20" r="5" fill={active ? '#DC143C' : '#ccc'} />
            <line x1="18" y1="20" x2="28" y2="20" stroke={color} strokeWidth="2" />
            <polygon points="35,20 28,15 28,25" fill={color} />
          </svg>
        );
      case 'arrow-from':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <polygon points="5,20 12,15 12,25" fill={color} />
            <line x1="12" y1="20" x2="22" y2="20" stroke={color} strokeWidth="2" />
            <circle cx="30" cy="20" r="5" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'arrow-into':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <rect x="20" y="10" width="16" height="20" fill="none" stroke={color} strokeWidth="2" rx="2" />
            <circle cx="8" cy="20" r="4" fill={active ? '#DC143C' : '#ccc'}>
              <animate attributeName="cx" values="8;24;8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <line x1="14" y1="20" x2="18" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderRelationIcon = (icon: string, active: boolean) => {
    const color = active ? '#9C27B0' : '#999';

    switch (icon) {
      case 'with':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="14" cy="20" r="6" fill={active ? '#DC143C' : '#ccc'} />
            <circle cx="26" cy="20" r="6" fill={active ? '#1565C0' : '#ddd'} />
            <line x1="14" y1="20" x2="26" y2="20" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
          </svg>
        );
      case 'of':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="2" />
            <circle cx="20" cy="20" r="4" fill={active ? '#DC143C' : '#ccc'} />
          </svg>
        );
      case 'for':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="12" cy="20" r="5" fill={active ? '#DC143C' : '#ccc'} />
            <path d="M20 15 L30 20 L20 25 Z" fill={color} />
            <circle cx="32" cy="20" r="4" fill="none" stroke={color} strokeWidth="2" />
          </svg>
        );
      case 'about':
        return (
          <svg viewBox="0 0 40 40" className="prep-icon">
            <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 2" />
            <circle cx="20" cy="20" r="3" fill={active ? '#DC143C' : '#ccc'} />
            <text x="20" y="38" textAnchor="middle" fontSize="8" fill={color}>?</text>
          </svg>
        );
      default:
        return null;
    }
  };

  const sectionLabels = {
    location: t.VIZ_PREP_LOCATION,
    direction: t.VIZ_PREP_DIRECTION,
    relation: t.VIZ_PREP_RELATION,
    title: t.VIZ_PREP_TITLE,
  };

  return (
    <div className="viz-section">
      <h4>{sectionLabels.title}</h4>

      <div className="prep-group">
        <span className="prep-group-label">{sectionLabels.location}</span>
        <div className="prep-items">
          {locationPreps.map(({ prep, label, icon }) => (
            <div key={prep} className={`prep-item ${activePreps.has(prep) ? 'active' : ''}`}>
              {renderLocationIcon(icon, activePreps.has(prep))}
              <span className="prep-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="prep-group">
        <span className="prep-group-label">{sectionLabels.direction}</span>
        <div className="prep-items">
          {directionPreps.map(({ prep, label, icon }) => (
            <div key={prep} className={`prep-item ${activePreps.has(prep) ? 'active' : ''}`}>
              {renderDirectionIcon(icon, activePreps.has(prep))}
              <span className="prep-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="prep-group">
        <span className="prep-group-label">{sectionLabels.relation}</span>
        <div className="prep-items">
          {relationPreps.map(({ prep, label, icon }) => (
            <div key={prep} className={`prep-item ${activePreps.has(prep) ? 'active' : ''}`}>
              {renderRelationIcon(icon, activePreps.has(prep))}
              <span className="prep-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VisualizationPanel({ asts }: VisualizationPanelProps) {
  const { tense, aspect } = useMemo(() => extractTenseAspect(asts), [asts]);
  const activePreps = useMemo(() => extractPrepositions(asts), [asts]);

  return (
    <div className="visualization-panel">
      <TenseAspectDiagram tense={tense} aspect={aspect} />
      <PrepositionDiagram activePreps={activePreps} />
    </div>
  );
}
