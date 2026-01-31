import { useMemo } from 'react';
import type { TransformLog } from '../types/grammarLog';
import type { SentenceNode } from '../types/schema';
import { useLocale } from '../locales';
import type { GrammarMessages } from '../locales';

interface GrammarPanelProps {
  logs: TransformLog[];
  notification?: string | null;
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

export function GrammarPanel({ logs, notification, asts }: GrammarPanelProps) {
  const { grammar } = useLocale();
  const { tense, aspect } = useMemo(() => extractTenseAspect(asts), [asts]);

  // Translate type name
  const translateType = (type: string): string => {
    const typeKey = `TYPE_${type.toUpperCase().replace(/-/g, '_')}`;
    return translateKey(typeKey, grammar) || type;
  };

  return (
    <div className="grammar-panel">
      {/* Tense/Aspect Diagram at top */}
      <TenseAspectDiagram tense={tense} aspect={aspect} />

      {notification && (
        <div className="grammar-notification">
          <span className="notification-icon">⚠</span>
          <span className="notification-text">{notification}</span>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="grammar-empty">
          <span className="empty-icon">∅</span>
          <span className="empty-text">{grammar.EMPTY_NO_TRANSFORMATIONS}</span>
        </div>
      ) : (
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
      )}
    </div>
  );
}
