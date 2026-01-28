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

// ============================================
// 名詞の日本語マッピング
// ============================================

/**
 * 英語名詞 → 日本語
 */
export const nounToJapanese: Record<string, string> = {
  // Human - Family
  'father': '父',
  'mother': '母',
  'brother': '兄',
  'sister': '姉',
  'son': '息子',
  'daughter': '娘',
  'child': '子ども',
  'baby': '赤ちゃん',
  'man': '男',
  'woman': '女',
  'boy': '男の子',
  'girl': '女の子',
  'friend': '友人',
  'teacher': '先生',
  'student': '学生',
  'doctor': '医者',
  'person': '人',
  'people': '人々',

  // Human - Collective
  'family': '家族',
  'team': 'チーム',
  'group': 'グループ',
  'class': 'クラス',
  'committee': '委員会',
  'audience': '観客',
  'crowd': '群衆',
  'staff': 'スタッフ',

  // Proper nouns - People
  'John': 'ジョン',
  'Mary': 'メアリー',

  // Proper nouns - Places
  'Tokyo': '東京',
  'London': 'ロンドン',

  // Animal
  'dog': '犬',
  'cat': '猫',
  'bird': '鳥',
  'fish': '魚',
  'horse': '馬',
  'cow': '牛',
  'pig': '豚',
  'sheep': '羊',
  'rabbit': 'うさぎ',
  'elephant': '象',
  'lion': 'ライオン',
  'bear': '熊',

  // Object - Food
  'apple': 'りんご',
  'orange': 'オレンジ',
  'banana': 'バナナ',
  'cake': 'ケーキ',
  'pizza': 'ピザ',
  'sandwich': 'サンドイッチ',
  'coffee': 'コーヒー',
  'tea': 'お茶',
  'water': '水',
  'milk': '牛乳',
  'juice': 'ジュース',
  'bread': 'パン',
  'rice': 'ご飯',
  'meat': '肉',

  // Object - Items
  'book': '本',
  'pen': 'ペン',
  'table': 'テーブル',
  'chair': '椅子',
  'door': 'ドア',
  'window': '窓',
  'car': '車',
  'bus': 'バス',
  'train': '電車',
  'phone': '電話',
  'computer': 'コンピューター',
  'ball': 'ボール',
  'box': '箱',
  'bag': 'かばん',
  'key': '鍵',
  'cup': 'カップ',
  'glass': 'グラス',
  'plate': '皿',
  'knife': 'ナイフ',
  'fork': 'フォーク',
  'spoon': 'スプーン',
  'bed': 'ベッド',
  'clock': '時計',
  'picture': '絵',
  'flower': '花',
  'tree': '木',
  'letter': '手紙',
  'gift': '贈り物',
  'money': 'お金',
  'music': '音楽',
  'news': 'ニュース',

  // Place
  'house': '家',
  'home': '家',
  'school': '学校',
  'office': '事務所',
  'hospital': '病院',
  'store': '店',
  'shop': '店',
  'restaurant': 'レストラン',
  'park': '公園',
  'garden': '庭',
  'station': '駅',
  'airport': '空港',
  'library': '図書館',
  'museum': '博物館',
  'church': '教会',
  'city': '都市',
  'country': '国',
  'town': '町',
  'village': '村',
  'room': '部屋',
  'kitchen': '台所',
  'bathroom': '浴室',
  'bedroom': '寝室',

  // Abstract
  'time': '時間',
  'love': '愛',
  'happiness': '幸福',
  'idea': 'アイデア',
  'problem': '問題',
  'question': '質問',
  'answer': '答え',
  'story': '物語',
  'game': 'ゲーム',
  'movie': '映画',
  'song': '歌',
  'language': '言語',
  'word': '言葉',
  'name': '名前',
  'job': '仕事',
  'work': '仕事',
  'information': '情報',
  'advice': 'アドバイス',
  'help': '助け',
};

/**
 * 名詞を日本語に変換（見つからなければそのまま返す）
 */
export function translateNoun(lemma: string): string {
  return nounToJapanese[lemma] || lemma;
}

// ============================================
// 動詞の日本語マッピング（辞書形のみ）
// ============================================

/**
 * 英語動詞 → 日本語（辞書形）
 */
export const verbToJapanese: Record<string, string> = {
  // Motion（移動）
  'run': '走る',
  'walk': '歩く',
  'go': '行く',
  'come': '来る',
  'fly': '飛ぶ',
  'swim': '泳ぐ',
  'jump': '跳ぶ',
  'fall': '落ちる',
  'arrive': '着く',
  'leave': '出る',

  // Action（動作・創造）
  'eat': '食べる',
  'make': '作る',
  'build': '建てる',
  'break': '壊す',
  'cut': '切る',
  'open': '開ける',
  'close': '閉める',
  'write': '書く',
  'read': '読む',
  'drink': '飲む',
  'cook': '料理する',
  'clean': '掃除する',
  'wash': '洗う',
  'buy': '買う',
  'sell': '売る',
  'play': '遊ぶ',
  'work': '働く',
  'study': '勉強する',
  'sleep': '眠る',
  'sing': '歌う',
  'dance': '踊る',
  'draw': '描く',
  'paint': '塗る',
  'catch': '捕まえる',
  'throw': '投げる',
  'kick': '蹴る',
  'hit': '打つ',
  'push': '押す',
  'pull': '引く',
  'carry': '運ぶ',
  'hold': '持つ',
  'drop': '落とす',
  'pick': '拾う',
  'put': '置く',
  'place': '置く',
  'hang': '掛ける',
  'wear': '着る',
  'use': '使う',
  'find': '見つける',
  'lose': '失う',
  'wait': '待つ',
  'help': '助ける',
  'meet': '会う',
  'visit': '訪ねる',

  // Transfer（授受・移転）
  'give': 'あげる',
  'take': '取る',
  'send': '送る',
  'receive': '受け取る',
  'bring': '持って来る',
  'get': '得る',
  'show': '見せる',
  'teach': '教える',
  'learn': '学ぶ',
  'lend': '貸す',
  'borrow': '借りる',
  'pay': '払う',

  // Cognition（認知・知覚）
  'think': '考える',
  'know': '知る',
  'see': '見る',
  'hear': '聞く',
  'feel': '感じる',
  'believe': '信じる',
  'understand': '理解する',
  'remember': '覚える',
  'forget': '忘れる',
  'want': '欲しい',
  'need': '必要とする',
  'like': '好む',
  'love': '愛する',
  'hate': '嫌う',
  'hope': '望む',
  'expect': '期待する',
  'prefer': '好む',

  // Communication（伝達）
  'say': '言う',
  'tell': '伝える',
  'speak': '話す',
  'talk': '話す',
  'ask': '尋ねる',
  'answer': '答える',
  'call': '呼ぶ',
  'explain': '説明する',

  // State（状態・存在）
  'be': 'である',
  'have': '持つ',
  'exist': '存在する',
  'live': '住む',
  'reside': '居住する',
  'stay': '滞在する',
  'belong': '属する',
  'seem': '見える',
};

/**
 * 動詞を日本語に変換（見つからなければそのまま返す）
 */
export function translateVerb(lemma: string): string {
  return verbToJapanese[lemma] || lemma;
}
