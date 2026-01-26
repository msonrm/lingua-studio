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

// Tense/Aspect Timeline Component with Reichenbach S/R/E model
function TenseAspectDiagram({ tense, aspect }: { tense: string | null; aspect: string | null }) {
  const { blockly: t } = useLocale();

  // Timeline marker labels (short, for diagram)
  const timelineLabels = {
    past: t.VIZ_TENSE_PAST,
    present: t.VIZ_TENSE_PRESENT,
    future: t.VIZ_TENSE_FUTURE,
  };

  // Full labels for tense-aspect description
  const fullLabels = {
    past: t.VIZ_LABEL_PAST,
    present: t.VIZ_LABEL_PRESENT,
    future: t.VIZ_LABEL_FUTURE,
    simple: t.VIZ_ASPECT_SIMPLE,
    progressive: t.VIZ_ASPECT_PROGRESSIVE,
    perfect: t.VIZ_ASPECT_PERFECT,
    perfectProgressive: t.VIZ_ASPECT_PERF_PROG,
  };

  // Colors for visualization
  const colors = {
    marker: '#fff',    // All markers white
    inactive: '#555',
    line: '#666',
    label: '#ccc',     // Brighter labels
  };

  // Calculate E and R positions based on tense and aspect
  // S (Now) is always at center (x=120 for 240-width viewBox)
  const S_POS = 120;

  // Determine positions and coincidence based on tense + aspect combination
  const getPositions = () => {
    const isPerfect = aspect === 'perfect' || aspect === 'perfectProgressive';

    if (tense === 'past') {
      if (isPerfect) {
        // Past Perfect: E < R < S (all separate)
        return { E: 40, R: 80, eCoincides: '', rCoincides: '' };
      }
      // Past Simple/Progressive: E,R < S (E and R coincide)
      return { E: 60, R: 60, eCoincides: 'R', rCoincides: 'E' };
    } else if (tense === 'future') {
      if (isPerfect) {
        // Future Perfect: S < E < R (all separate)
        return { E: 160, R: 200, eCoincides: '', rCoincides: '' };
      }
      // Future Simple/Progressive: S < E,R (E and R coincide)
      return { E: 180, R: 180, eCoincides: 'R', rCoincides: 'E' };
    } else {
      // Present
      if (isPerfect) {
        // Present Perfect: E < R=S (R coincides with S)
        return { E: 55, R: S_POS, eCoincides: '', rCoincides: 'S' };
      }
      // Present Simple/Progressive: E=R=S (all coincide)
      return { E: S_POS, R: S_POS, eCoincides: 'R,S', rCoincides: 'E,S' };
    }
  };

  const { E: ePos, R: rPos, eCoincides, rCoincides } = tense ? getPositions() : { E: 0, R: 0, eCoincides: '', rCoincides: '' };
  const isActive = tense !== null;
  const isProgressive = aspect === 'progressive' || aspect === 'perfectProgressive';
  const isPerfect = aspect === 'perfect' || aspect === 'perfectProgressive';

  // Determine what labels to show
  const allAtS = eCoincides === 'R,S'; // E,R,S all at same position
  const rAtS = rCoincides === 'S' || rCoincides === 'E,S'; // R coincides with S
  const eAtR = eCoincides === 'R' && !allAtS; // E coincides with R only (not S)

  // Generate wavy path from startX to endX
  const generateWavePath = (startX: number, endX: number, y: number, amplitude: number = 4, wavelength: number = 10) => {
    let path = `M ${startX} ${y}`;
    for (let x = startX; x <= endX; x += 1) {
      const waveY = y + Math.sin(((x - startX) / wavelength) * Math.PI * 2) * amplitude;
      path += ` L ${x} ${waveY}`;
    }
    return path;
  };

  return (
    <div className="viz-section">
      <h4>{t.VIZ_TENSE_ASPECT_TITLE}</h4>

      {/* Reichenbach Timeline */}
      <svg viewBox="0 0 240 80" className="tense-timeline reichenbach">
        <defs>
          {/* Clip path for progressive wave on timeline */}
          <clipPath id="waveClip">
            <rect x={ePos - 25} y="30" width="50" height="20" />
          </clipPath>
          <clipPath id="perfectWaveClip">
            <rect x={ePos} y="30" width={rPos - ePos} height="20" />
          </clipPath>
        </defs>

        {/* Timeline base line */}
        <line x1="15" y1="40" x2="225" y2="40" stroke={colors.line} strokeWidth="2" />

        {/* Arrow heads */}
        <polygon points="10,40 18,36 18,44" fill={colors.line} />
        <polygon points="230,40 222,36 222,44" fill={colors.line} />

        {/* S (Speech/Now) - Always at center as vertical line */}
        <line x1={S_POS} y1="25" x2={S_POS} y2="55" stroke={colors.marker} strokeWidth="3" />
        {/* S label: show combined label if others coincide */}
        {isActive && allAtS ? (
          <text x={S_POS} y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.marker}>E,R,S</text>
        ) : isActive && rAtS && !allAtS ? (
          <text x={S_POS} y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.marker}>R,S</text>
        ) : (
          <text x={S_POS} y="18" textAnchor="middle" fontSize="10" fill={colors.marker}>S</text>
        )}
        <text x={S_POS} y="72" textAnchor="middle" fontSize="10" fill={colors.label}>{timelineLabels.present}</text>

        {isActive && (
          <>
            {/* Perfect aspect (non-progressive): solid line from E to R with arrow */}
            {isPerfect && !isProgressive && !rAtS && (
              <>
                <line
                  x1={ePos + 7}
                  y1="40"
                  x2={rPos - 18}
                  y2="40"
                  stroke="#fff"
                  strokeWidth="3"
                />
                <polygon
                  points={`${rPos - 9},40 ${rPos - 19},34 ${rPos - 19},46`}
                  fill="#fff"
                />
              </>
            )}
            {isPerfect && !isProgressive && rAtS && (
              <>
                <line
                  x1={ePos + 7}
                  y1="40"
                  x2={rPos - 12}
                  y2="40"
                  stroke="#fff"
                  strokeWidth="3"
                />
                <polygon
                  points={`${rPos - 3},40 ${rPos - 13},34 ${rPos - 13},46`}
                  fill="#fff"
                />
              </>
            )}

            {/* Perfect Progressive: wavy line flowing from E to R (no arrow) */}
            {isPerfect && isProgressive && (
              <g clipPath="url(#perfectWaveClip)">
                <path
                  d={generateWavePath(ePos - 20, rPos + 30, 40, 4, 12)}
                  fill="none"
                  stroke={colors.marker}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="0 0"
                    to="24 0"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            )}

            {/* Progressive (non-perfect): wavy line centered around E, flowing right */}
            {isProgressive && !isPerfect && (
              <g clipPath="url(#waveClip)">
                <path
                  d={generateWavePath(ePos - 50, ePos + 50, 40, 4, 12)}
                  fill="none"
                  stroke={colors.marker}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="0 0"
                    to="24 0"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            )}

            {/* E (Event) - White filled circle (not shown if all at S) */}
            {!allAtS && (
              <>
                <circle cx={ePos} cy="40" r="7" fill={colors.marker} />
                {/* E label: show E,R if they coincide */}
                <text x={ePos} y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.marker}>
                  {eAtR ? 'E,R' : 'E'}
                </text>
              </>
            )}

            {/* R (Reference) - White diamond square 18x18 (only shown when separate from both E and S) */}
            {!eAtR && !rAtS && !allAtS && (
              <>
                <polygon
                  points={`${rPos},31 ${rPos + 9},40 ${rPos},49 ${rPos - 9},40`}
                  fill={colors.marker}
                />
                <text x={rPos} y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.marker}>R</text>
              </>
            )}
          </>
        )}

        {/* Tense labels below - left/right aligned to show axis direction */}
        <text x="15" y="72" textAnchor="start" fontSize="10" fill={tense === 'past' ? '#fff' : colors.inactive}>{timelineLabels.past}</text>
        <text x="225" y="72" textAnchor="end" fontSize="10" fill={tense === 'future' ? '#fff' : colors.inactive}>{timelineLabels.future}</text>
      </svg>

      {/* Simple tense+aspect label */}
      {tense && aspect && (
        <div className="tense-aspect-label">
          {fullLabels[tense as keyof typeof fullLabels]} {fullLabels[aspect as keyof typeof fullLabels]}
        </div>
      )}
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
