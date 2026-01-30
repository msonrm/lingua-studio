/**
 * Japanese Renderer - Entry Point
 */

export { renderToJapanese } from './renderer';
export {
  getParticle,
  isSubjectRole,
  translatePronoun,
  translateNoun,
  getVerbEntry,
  translateAdjective,
  translateAdverb,
  translateDeterminer,
} from './lexicon';
export type { VerbType, VerbEntry } from './lexicon';

// Conjugation
export { conjugate, conjugateEntry, toTaForm, toTeForm, toNaiForm, toNakattaForm } from './conjugation';
export type { Tense, Aspect, Polarity, ConjugationContext } from './conjugation';
