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
