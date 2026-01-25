// ============================================
// Grammar Console Log Types
// ============================================

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
  reason?: string;  // e.g., "3sg", "past", "before vowel"
}

export interface RenderResult {
  output: string;
  logs: TransformLog[];
  warnings?: string[];
}

// Log collector context for threading through render functions
export class GrammarLogCollector {
  private logs: TransformLog[] = [];

  log(type: TransformType, from: string, to: string, reason?: string): void {
    if (from !== to) {  // Only log actual changes
      this.logs.push({ type, from, to, reason });
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
  const reasonPart = log.reason ? ` (${log.reason})` : '';

  switch (log.type) {
    case 'agreement':
      return `Agreement: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'tense':
      return `Tense: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'aspect':
      return `Aspect: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'case':
      return `Case: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'article':
      return `Article: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'do-support':
      return `Do-support: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'modal':
      return `Modal: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'negation':
      return `Negation: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'wh-movement':
      return `Wh-movement: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    case 'inversion':
      return `Inversion: ${log.from} ${arrow} ${log.to}${reasonPart}`;
    default:
      return `${log.type}: ${log.from} ${arrow} ${log.to}${reasonPart}`;
  }
}
