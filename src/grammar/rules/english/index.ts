/**
 * English Grammar Rules - 英語文法ルールのエクスポート
 */

// 形態論ルール
export {
  // Agreement
  applyThirdPersonSingular,
  describeAgreement,
  // Tense
  applyPastTense,
  applyFutureTense,
  // Aspect
  applyProgressiveAspect,
  applyPerfectAspect,
  applyPerfectProgressiveAspect,
  // Case
  applyObjectiveCase,
  // Article
  selectIndefiniteArticle,
  // Helpers
  getBeAuxiliary,
  getHaveAuxiliary,
  isThirdPersonSingular,
} from './morphology';

// 統語論ルール
export {
  // Do-support
  needsDoSupport,
  getDoForm,
  describeDoSupport,
  // Inversion
  needsInversion,
  applyInversion,
  describeInversion,
  // Wh-movement
  needsWhMovement,
  describeWhMovement,
  // Word order
  getBasicWordOrder,
  getQuestionWordOrder,
  getFrequencyAdverbPosition,
  getNegationPosition,
} from './syntax';
