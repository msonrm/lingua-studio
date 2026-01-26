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

  // Colors for S/R/E markers
  const colors = {
    E: '#DC143C',      // Event: Red
    R: '#1565C0',      // Reference: Blue
    S: '#2E7D32',      // Speech/Now: Green
    inactive: '#444',
    line: '#666',
  };

  // Calculate E and R positions based on tense and aspect
  // S (Now) is always at center (x=100)
  const S_POS = 100;

  // Determine positions based on tense + aspect combination
  const getPositions = () => {
    const isPerfect = aspect === 'perfect' || aspect === 'perfectProgressive';

    if (tense === 'past') {
      if (isPerfect) {
        // Past Perfect: E < R < S
        return { E: 35, R: 65, showR: true };
      }
      // Past Simple/Progressive: E,R < S (E and R coincide)
      return { E: 50, R: 50, showR: false };
    } else if (tense === 'future') {
      if (isPerfect) {
        // Future Perfect: S < E < R
        return { E: 130, R: 165, showR: true };
      }
      // Future Simple/Progressive: S < E,R
      return { E: 150, R: 150, showR: false };
    } else {
      // Present
      if (isPerfect) {
        // Present Perfect: E < R=S
        return { E: 45, R: S_POS, showR: true };
      }
      // Present Simple/Progressive: E=R=S
      return { E: S_POS, R: S_POS, showR: false };
    }
  };

  const { E: ePos, R: rPos, showR } = tense ? getPositions() : { E: 0, R: 0, showR: false };
  const isActive = tense !== null;
  const isProgressive = aspect === 'progressive' || aspect === 'perfectProgressive';
  const isPerfect = aspect === 'perfect' || aspect === 'perfectProgressive';

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
      <h4>{labels.title}</h4>

      {/* Reichenbach Timeline */}
      <svg viewBox="0 0 200 80" className="tense-timeline reichenbach">
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
        <line x1="15" y1="40" x2="185" y2="40" stroke={colors.line} strokeWidth="2" />

        {/* Arrow heads */}
        <polygon points="10,40 18,36 18,44" fill={colors.line} />
        <polygon points="190,40 182,36 182,44" fill={colors.line} />

        {/* S (Speech/Now) - Always at center as vertical line */}
        <line x1={S_POS} y1="25" x2={S_POS} y2="55" stroke={colors.S} strokeWidth="3" />
        <text x={S_POS} y="18" textAnchor="middle" fontSize="8" fill={colors.S}>S</text>
        <text x={S_POS} y="70" textAnchor="middle" fontSize="9" fill={colors.S}>Now</text>

        {isActive && (
          <>
            {/* Perfect aspect (non-progressive): solid line from E to R */}
            {isPerfect && !isProgressive && showR && (
              <line
                x1={ePos + 7}
                y1="40"
                x2={rPos - 6}
                y2="40"
                stroke={colors.R}
                strokeWidth="3"
              />
            )}

            {/* Perfect Progressive: wavy line flowing from E to R */}
            {isPerfect && isProgressive && showR && (
              <g clipPath="url(#perfectWaveClip)">
                <path
                  d={generateWavePath(ePos - 20, rPos + 30, 40, 4, 12)}
                  fill="none"
                  stroke={colors.R}
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
                  stroke={colors.E}
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

            {/* E (Event) - Red filled circle */}
            <circle cx={ePos} cy="40" r="7" fill={colors.E} />
            <text x={ePos} y="22" textAnchor="middle" fontSize="8" fill={colors.E}>E</text>

            {/* R (Reference) - Blue diamond (only shown when different from E) */}
            {showR && (
              <>
                <polygon
                  points={`${rPos},31 ${rPos + 8},40 ${rPos},49 ${rPos - 8},40`}
                  fill={colors.R}
                />
                <text x={rPos} y="20" textAnchor="middle" fontSize="8" fill={colors.R}>R</text>
              </>
            )}
          </>
        )}

        {/* Tense labels below */}
        <text x="35" y="70" textAnchor="middle" fontSize="8" fill={tense === 'past' ? '#fff' : '#666'}>{labels.past}</text>
        <text x="165" y="70" textAnchor="middle" fontSize="8" fill={tense === 'future' ? '#fff' : '#666'}>{labels.future}</text>
      </svg>

      {/* Aspect visualization with animated lines */}
      <div className="aspect-icons">
        <div className={`aspect-item ${aspect === 'simple' ? 'active' : ''}`}>
          <svg viewBox="0 0 50 24" className="aspect-line-icon">
            {/* Simple: single static dot - represents a bounded, completed event */}
            <circle cx="25" cy="12" r="5" fill={aspect === 'simple' ? colors.E : '#666'} />
          </svg>
          <span>{labels.simple}</span>
        </div>

        <div className={`aspect-item ${aspect === 'progressive' ? 'active' : ''}`}>
          <svg viewBox="0 0 50 24" className="aspect-line-icon">
            <defs>
              <clipPath id="progClip">
                <rect x="5" y="0" width="40" height="24" />
              </clipPath>
            </defs>
            {/* Progressive: wavy line flowing rightward - ongoing, unbounded */}
            <g clipPath="url(#progClip)">
              <path
                d={`M -10 12 ${Array.from({ length: 8 }, (_, i) => `Q ${i * 10 - 5} ${i % 2 === 0 ? 6 : 18}, ${i * 10} 12`).join(' ')}`}
                fill="none"
                stroke={aspect === 'progressive' ? colors.E : '#666'}
                strokeWidth="3"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to="20 0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </svg>
          <span>{labels.progressive}</span>
        </div>

        <div className={`aspect-item ${aspect === 'perfect' ? 'active' : ''}`}>
          <svg viewBox="0 0 50 24" className="aspect-line-icon">
            {/* Perfect: E connected to R - event with current relevance */}
            <circle cx="8" cy="12" r="4" fill={aspect === 'perfect' ? colors.E : '#666'} />
            <line x1="12" y1="12" x2="38" y2="12" stroke={aspect === 'perfect' ? colors.R : '#666'} strokeWidth="2" />
            <polygon
              points={`${38},12 ${44},8 ${44},16`}
              fill={aspect === 'perfect' ? colors.R : '#666'}
            />
          </svg>
          <span>{labels.perfect}</span>
        </div>

        <div className={`aspect-item ${aspect === 'perfectProgressive' ? 'active' : ''}`}>
          <svg viewBox="0 0 50 24" className="aspect-line-icon">
            <defs>
              <clipPath id="perfProgClip">
                <rect x="10" y="0" width="34" height="24" />
              </clipPath>
            </defs>
            {/* Perfect Progressive: wavy line from E flowing to R */}
            <circle cx="8" cy="12" r="3" fill={aspect === 'perfectProgressive' ? colors.E : '#666'} />
            <g clipPath="url(#perfProgClip)">
              <path
                d={`M 0 12 ${Array.from({ length: 6 }, (_, i) => `Q ${i * 10 + 5} ${i % 2 === 0 ? 6 : 18}, ${i * 10 + 10} 12`).join(' ')}`}
                fill="none"
                stroke={aspect === 'perfectProgressive' ? colors.R : '#666'}
                strokeWidth="2"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to="20 0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
            <polygon
              points="38,12 44,8 44,16"
              fill={aspect === 'perfectProgressive' ? colors.R : '#666'}
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
