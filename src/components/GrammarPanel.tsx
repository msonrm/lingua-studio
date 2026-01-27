import { useMemo } from 'react';
import type { TransformLog } from '../types/grammarLog';

interface GrammarPanelProps {
  logs: TransformLog[];
  previousLogs?: TransformLog[];
}

// Determine the status of each log compared to previous
type LogStatus = 'added' | 'unchanged' | 'changed' | 'removed';

interface LogWithStatus {
  log: TransformLog;
  status: LogStatus;
  previousLog?: TransformLog;
}

function computeLogDiff(
  current: TransformLog[],
  previous: TransformLog[]
): LogWithStatus[] {
  const result: LogWithStatus[] = [];
  const previousMap = new Map<string, TransformLog>();

  // Index previous logs by type+rule
  for (const log of previous) {
    const key = `${log.type}:${log.rule || ''}`;
    previousMap.set(key, log);
  }

  // Track which previous logs were matched
  const matchedKeys = new Set<string>();

  // Process current logs
  for (const log of current) {
    const key = `${log.type}:${log.rule || ''}`;
    const prevLog = previousMap.get(key);

    if (!prevLog) {
      // New rule application
      result.push({ log, status: 'added' });
    } else {
      matchedKeys.add(key);
      // Check if the transformation changed
      if (prevLog.from === log.from && prevLog.to === log.to) {
        result.push({ log, status: 'unchanged' });
      } else {
        result.push({ log, status: 'changed', previousLog: prevLog });
      }
    }
  }

  // Find removed logs (in previous but not in current)
  for (const log of previous) {
    const key = `${log.type}:${log.rule || ''}`;
    if (!matchedKeys.has(key)) {
      result.push({ log, status: 'removed' });
    }
  }

  return result;
}

// Get icon and color for transformation type
function getTypeStyle(type: string): { icon: string; color: string } {
  switch (type) {
    case 'agreement':
      return { icon: '👤', color: '#4CAF50' }; // Green - subject related
    case 'tense':
      return { icon: '⏱', color: '#2196F3' }; // Blue - time related
    case 'aspect':
      return { icon: '◐', color: '#9C27B0' }; // Purple - aspect
    case 'case':
      return { icon: '🔤', color: '#FF9800' }; // Orange - form change
    case 'article':
      return { icon: 'a', color: '#795548' }; // Brown - article
    case 'do-support':
      return { icon: '+do', color: '#F44336' }; // Red - insertion
    case 'negation':
      return { icon: '¬', color: '#E91E63' }; // Pink - negation
    case 'modal':
      return { icon: '◇', color: '#673AB7' }; // Deep purple - modal
    case 'wh-movement':
      return { icon: '↷', color: '#00BCD4' }; // Cyan - movement
    case 'inversion':
      return { icon: '⇄', color: '#009688' }; // Teal - swap
    default:
      return { icon: '•', color: '#607D8B' }; // Grey - default
  }
}

// Get status indicator
function getStatusIndicator(status: LogStatus): { label: string; className: string } {
  switch (status) {
    case 'added':
      return { label: '+', className: 'status-added' };
    case 'changed':
      return { label: '~', className: 'status-changed' };
    case 'removed':
      return { label: '×', className: 'status-removed' };
    case 'unchanged':
    default:
      return { label: '', className: 'status-unchanged' };
  }
}

export function GrammarPanel({ logs, previousLogs = [] }: GrammarPanelProps) {
  // Compute diff if we have previous logs
  const logsWithStatus = useMemo((): LogWithStatus[] => {
    if (previousLogs.length === 0) {
      // No previous logs - all are "new" but don't show indicator
      return logs.map(log => ({ log, status: 'unchanged' as LogStatus }));
    }
    return computeLogDiff(logs, previousLogs);
  }, [logs, previousLogs]);

  if (logsWithStatus.length === 0) {
    return (
      <div className="grammar-panel">
        <div className="grammar-empty">
          <span className="empty-icon">∅</span>
          <span className="empty-text">No transformations</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-panel">
      <div className="grammar-steps">
        {logsWithStatus.map((item, i) => {
          const { log, status, previousLog } = item;
          const typeStyle = getTypeStyle(log.type);
          const statusIndicator = getStatusIndicator(status);

          return (
            <div
              key={i}
              className={`grammar-step ${statusIndicator.className}`}
            >
              <div className="step-header">
                <span
                  className="step-type"
                  style={{ backgroundColor: typeStyle.color }}
                >
                  {log.type}
                </span>
                {statusIndicator.label && (
                  <span className={`step-status ${statusIndicator.className}`}>
                    {statusIndicator.label}
                  </span>
                )}
              </div>
              <div className="step-content">
                <div className="step-transformation">
                  <span className="step-before">{log.from}</span>
                  <span className="step-arrow">→</span>
                  <span className="step-after">{log.to}</span>
                </div>
                {log.trigger && (
                  <div className="step-trigger">{log.trigger}</div>
                )}
              </div>
              {status === 'changed' && previousLog && (
                <div className="step-previous">
                  <span className="previous-label">was:</span>
                  <span className="previous-value">
                    {previousLog.from} → {previousLog.to}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
