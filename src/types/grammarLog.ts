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

// English formatter (hardcoded for now, i18n later)
export function formatLogEnglish(log: TransformLog): string {
  const arrow = '→';

  // Format: [Trigger] → [Rule] → [Result]
  // Example: Subject "he" → 3rd person singular → run + -s → runs

  switch (log.type) {
    case 'agreement':
      // Subject "he" → 3sg → run → runs
      return `${log.trigger} ${arrow} ${log.rule} ${arrow} ${log.from} ${arrow} ${log.to}`;
    case 'tense':
      // Tense: past → eat → ate
      return `Tense: ${log.rule} ${arrow} ${log.from} ${arrow} ${log.to}`;
    case 'case':
      // Position: object → I → me
      return `${log.trigger} ${arrow} ${log.from} ${arrow} ${log.to}`;
    case 'article':
      // Next word starts with "a" → a → an
      return `${log.trigger} ${arrow} ${log.from} ${arrow} ${log.to}`;
    case 'do-support':
      // Negation + present → do + not + base form
      return `${log.trigger} ${arrow} ${log.from} ${arrow} ${log.to}`;
    case 'negation':
      return `${log.trigger} ${arrow} ${log.from} ${arrow} ${log.to}`;
    default:
      const parts = [log.trigger, log.rule, `${log.from} ${arrow} ${log.to}`].filter(Boolean);
      return parts.join(` ${arrow} `);
  }
}
