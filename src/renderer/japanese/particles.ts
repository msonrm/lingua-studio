/**
 * particles.ts - 意味役割 → 格助詞マッピング + 代名詞日本語化
 *
 * 日本語の格助詞システム（統語論のみバージョン）
 */

import { SemanticRole } from '../../types/schema';
import { verbCores } from '../../data/dictionary-core';

export type Particle = 'は' | 'が' | 'を' | 'に' | 'で' | 'から' | 'まで' | 'と' | 'へ';

/**
 * 意味役割から格助詞へのデフォルトマッピング
 * 注意: 主語かどうかは動詞のvalencyで動的に決定
 */
export const roleToParticleDefault: Partial<Record<SemanticRole, Particle>> = {
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
 * 主語になりうる役割（優先順位順）
 */
const SUBJECT_ROLES: SemanticRole[] = ['agent', 'experiencer', 'possessor', 'theme'];

/**
 * 動詞のvalencyから主語役割を決定
 * @param verbLemma 動詞の原形
 * @returns 主語役割（見つからなければundefined）
 */
export function getSubjectRole(verbLemma: string): SemanticRole | undefined {
  const verbCore = verbCores.find(v => v.lemma === verbLemma);
  if (!verbCore) return 'agent'; // デフォルト

  // valency内のSUBJECT_ROLESを優先順で探す
  for (const role of SUBJECT_ROLES) {
    if (verbCore.valency.some(v => v.role === role)) {
      return role;
    }
  }

  return undefined;
}

/**
 * 指定された役割が主語かどうかを動的に判定
 */
export function isSubjectRole(role: SemanticRole, verbLemma: string): boolean {
  const subjectRole = getSubjectRole(verbLemma);
  return role === subjectRole;
}

/**
 * 役割に対応する格助詞を取得（主語は「は」、それ以外はデフォルトマッピング）
 */
export function getParticle(role: SemanticRole, verbLemma: string): Particle | undefined {
  if (isSubjectRole(role, verbLemma)) {
    return 'は';
  }
  return roleToParticleDefault[role];
}

// ============================================
// 代名詞の日本語マッピング
// ============================================

/**
 * 英語代名詞 → 日本語
 */
export const pronounToJapanese: Record<string, string> = {
  // 人称代名詞
  'I': '私',
  'you': 'あなた',
  'he': '彼',
  'she': '彼女',
  'it': 'それ',
  'we': '私たち',
  'they': '彼ら',

  // 不定代名詞
  'someone': '誰か',
  'something': '何か',
  'everyone': 'みんな',
  'everything': 'すべて',
  'nobody': '誰も',
  'nothing': '何も',

  // 指示代名詞
  'this': 'これ',
  'that': 'あれ',
  'these': 'これら',
  'those': 'あれら',

  // 疑問代名詞（?プレフィックスなし）
  'who': '誰',
  'what': '何',
  'which': 'どれ',
};

/**
 * 代名詞を日本語に変換（見つからなければそのまま返す）
 */
export function translatePronoun(lemma: string): string {
  // ?プレフィックスを除去
  const cleanLemma = lemma.replace(/^\?/, '');
  return pronounToJapanese[cleanLemma] || cleanLemma;
}
