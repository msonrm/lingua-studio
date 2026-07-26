// ============================================
// Grammar Console Log Types
// ============================================

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
