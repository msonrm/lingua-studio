/**
 * particles.ts - 意味役割 → 格助詞マッピング
 *
 * 日本語の格助詞システム（統語論のみバージョン）
 */

import { SemanticRole } from '../../types/schema';

export type Particle = 'は' | 'が' | 'を' | 'に' | 'で' | 'から' | 'まで' | 'と' | 'へ';

/**
 * 意味役割から格助詞へのマッピング
 * 主語（agent等）は「は」（主題化）を使用
 */
export const roleToParticle: Partial<Record<SemanticRole, Particle>> = {
  // 主格（主語）→ 主題化して「は」
  agent: 'は',
  experiencer: 'は',
  possessor: 'は',

  // 対格（目的語）
  patient: 'を',
  theme: 'を',
  stimulus: 'を',

  // 与格（間接目的語）
  recipient: 'に',
  beneficiary: 'に',
  goal: 'に',

  // その他
  source: 'から',
  location: 'で',
  instrument: 'で',
};

/**
 * 主語役割かどうかを判定
 */
export function isSubjectRole(role: SemanticRole): boolean {
  return role === 'agent' || role === 'experiencer' || role === 'possessor';
}
