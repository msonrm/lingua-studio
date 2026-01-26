// ============================================
// Grammar Console Log Types
// ============================================

// User's block changes (what they modified)
export interface BlockChange {
  field: string;      // e.g., "Subject", "Verb", "Tense"
  from: string;       // Previous value
  to: string;         // New value
}

// Applied grammar transformations
export type TransformType =
  | 'agreement'      // Subject-verb agreement (run → runs)
  | 'tense'          // Tense inflection (eat → ate)
  | 'aspect'         // Aspect marking (eat → eating, eaten)
  | 'case'           // Pronoun case (I → me)
  | 'article'        // Article selection (a → an)
  | 'do-support'     // Do-insertion (eat → do eat)
  | 'modal'          // Modal transformation
  | 'negation'       // Negation marking
  | 'wh-movement'    // Wh-word fronting
  | 'inversion';     // Subject-auxiliary inversion

export interface TransformLog {
  type: TransformType;
  from: string;
  to: string;
  trigger?: string;  // What caused this: "subject 'he'", "tense: past", etc.
  rule?: string;     // The rule applied: "3rd person singular", "past tense", etc.
}

export interface RenderResult {
  output: string;
  logs: TransformLog[];
  warnings?: string[];
}

// Log collector context for threading through render functions
export class GrammarLogCollector {
  private logs: TransformLog[] = [];

  log(type: TransformType, from: string, to: string, trigger?: string, rule?: string): void {
    if (from !== to) {  // Only log actual changes
      this.logs.push({ type, from, to, trigger, rule });
    }
  }

  getLogs(): TransformLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

// Format log as two-line HTML for display
export interface FormattedLog {
  condition: string;  // e.g., "Subject \"she\" is 3sg"
  result: string;     // e.g., "+s: run → runs"
}

// English formatter - returns structured two-line format
export function formatLogStructured(log: TransformLog): FormattedLog {
  const arrow = '→';

  switch (log.type) {
    case 'agreement':
      return {
        condition: log.trigger || 'Subject agreement',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    case 'tense':
      return {
        condition: log.trigger || 'Tense',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    case 'case':
      return {
        condition: log.trigger || 'Case',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    case 'article':
      return {
        condition: log.trigger || 'Article',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    case 'do-support':
      return {
        condition: log.trigger || 'Do-support',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    case 'negation':
      return {
        condition: log.trigger || 'Negation',
        result: `${log.rule}: ${log.from} ${arrow} ${log.to}`,
      };
    default:
      return {
        condition: log.trigger || log.type,
        result: `${log.rule ? log.rule + ': ' : ''}${log.from} ${arrow} ${log.to}`,
      };
  }
}

// Legacy single-line formatter (kept for compatibility)
export function formatLogEnglish(log: TransformLog): string {
  const formatted = formatLogStructured(log);
  return `${formatted.condition} → ${formatted.result}`;
}
