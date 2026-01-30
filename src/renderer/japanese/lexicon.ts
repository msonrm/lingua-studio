/**
 * lexicon.ts - 日本語レンダラー用語彙リソース
 *
 * - 意味役割 → 格助詞マッピング（統語論）
 * - 概念ID（英語lemma）→ 日本語表層形マッピング（語彙）
 *
 * 設計思想:
 * - dictionary-core.ts = UG的な概念辞書（言語非依存）
 * - lexicon.ts = 日本語モジュールのリソース（プラグイン）
 * - 英語をハブとし、各言語がそこに接続する構造
 */

import { SemanticRole } from '../../types/schema';
import { verbCores } from '../../data/dictionary-core';

export type Particle = 'は' | 'が' | 'を' | 'に' | 'で' | 'から' | 'まで' | 'と' | 'へ' | '';

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

  // コピュラ（be動詞）の補語 - 格助詞なし
  attribute: '',
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

  // 疑問代名詞（?プレフィックス付き - dictionary-core形式）
  '?who': '誰',
  '?what': '何',
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
// 所有格（限定詞）の日本語マッピング
// ============================================

/**
 * 所有格限定詞 → 日本語
 */
export const possessiveToJapanese: Record<string, string> = {
  'my': '私の',
  'your': 'あなたの',
  'his': '彼の',
  'her': '彼女の',
  'its': 'その',
  'our': '私たちの',
  'their': '彼らの',
  // 指示限定詞
  'this': 'この',
  'that': 'あの',
  'these': 'これらの',
  'those': 'あれらの',
};

/**
 * 限定詞を日本語に変換
 * - 所有格・指示詞は日本語化
 * - the, a は空文字を返す（日本語では不要）
 * - その他はそのまま返す
 */
export function translateDeterminer(det: string): string {
  // 所有格・指示詞の変換
  if (possessiveToJapanese[det]) {
    return possessiveToJapanese[det];
  }
  // the, a は削除
  if (det === 'the' || det === 'a' || det === 'an') {
    return '';
  }
  // その他はそのまま
  return det;
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
// 動詞タイプと活用
// ============================================

/**
 * 日本語動詞の活用タイプ
 * - godan: 五段動詞（書く、読む、走る）
 * - ichidan: 一段動詞（食べる、見る、起きる）
 * - suru: サ変動詞（〜する）
 * - kuru: カ変動詞（来る）
 */
export type VerbType = 'godan' | 'ichidan' | 'suru' | 'kuru';

/**
 * 動詞エントリ
 */
export interface VerbEntry {
  ja: string;      // 日本語辞書形
  type: VerbType;  // 活用タイプ
}

/**
 * 英語動詞 → 日本語（辞書形 + 活用タイプ）
 */
export const verbToJapanese: Record<string, VerbEntry> = {
  // Motion（移動）
  'run': { ja: '走る', type: 'godan' },
  'walk': { ja: '歩く', type: 'godan' },
  'go': { ja: '行く', type: 'godan' },
  'come': { ja: '来る', type: 'kuru' },
  'fly': { ja: '飛ぶ', type: 'godan' },
  'swim': { ja: '泳ぐ', type: 'godan' },
  'jump': { ja: '跳ぶ', type: 'godan' },
  'fall': { ja: '落ちる', type: 'ichidan' },
  'arrive': { ja: '着く', type: 'godan' },
  'leave': { ja: '出る', type: 'ichidan' },

  // Action（動作・創造）
  'eat': { ja: '食べる', type: 'ichidan' },
  'make': { ja: '作る', type: 'godan' },
  'build': { ja: '建てる', type: 'ichidan' },
  'break': { ja: '壊す', type: 'godan' },
  'cut': { ja: '切る', type: 'godan' },
  'open': { ja: '開ける', type: 'ichidan' },
  'close': { ja: '閉める', type: 'ichidan' },
  'write': { ja: '書く', type: 'godan' },
  'read': { ja: '読む', type: 'godan' },
  'drink': { ja: '飲む', type: 'godan' },
  'cook': { ja: '料理する', type: 'suru' },
  'clean': { ja: '掃除する', type: 'suru' },
  'wash': { ja: '洗う', type: 'godan' },
  'buy': { ja: '買う', type: 'godan' },
  'sell': { ja: '売る', type: 'godan' },
  'play': { ja: '遊ぶ', type: 'godan' },
  'work': { ja: '働く', type: 'godan' },
  'study': { ja: '勉強する', type: 'suru' },
  'sleep': { ja: '眠る', type: 'godan' },
  'sing': { ja: '歌う', type: 'godan' },
  'dance': { ja: '踊る', type: 'godan' },
  'draw': { ja: '描く', type: 'godan' },
  'paint': { ja: '塗る', type: 'godan' },
  'catch': { ja: '捕まえる', type: 'ichidan' },
  'throw': { ja: '投げる', type: 'ichidan' },
  'kick': { ja: '蹴る', type: 'godan' },
  'hit': { ja: '打つ', type: 'godan' },
  'push': { ja: '押す', type: 'godan' },
  'pull': { ja: '引く', type: 'godan' },
  'carry': { ja: '運ぶ', type: 'godan' },
  'hold': { ja: '持つ', type: 'godan' },
  'drop': { ja: '落とす', type: 'godan' },
  'pick': { ja: '拾う', type: 'godan' },
  'put': { ja: '置く', type: 'godan' },
  'place': { ja: '置く', type: 'godan' },
  'hang': { ja: '掛ける', type: 'ichidan' },
  'wear': { ja: '着る', type: 'ichidan' },
  'use': { ja: '使う', type: 'godan' },
  'find': { ja: '見つける', type: 'ichidan' },
  'lose': { ja: '失う', type: 'godan' },
  'wait': { ja: '待つ', type: 'godan' },
  'help': { ja: '助ける', type: 'ichidan' },
  'meet': { ja: '会う', type: 'godan' },
  'visit': { ja: '訪ねる', type: 'ichidan' },

  // Transfer（授受・移転）
  'give': { ja: 'あげる', type: 'ichidan' },
  'take': { ja: '取る', type: 'godan' },
  'send': { ja: '送る', type: 'godan' },
  'receive': { ja: '受け取る', type: 'godan' },
  'bring': { ja: '持って来る', type: 'kuru' },
  'get': { ja: '得る', type: 'ichidan' },
  'show': { ja: '見せる', type: 'ichidan' },
  'teach': { ja: '教える', type: 'ichidan' },
  'learn': { ja: '学ぶ', type: 'godan' },
  'lend': { ja: '貸す', type: 'godan' },
  'borrow': { ja: '借りる', type: 'ichidan' },
  'pay': { ja: '払う', type: 'godan' },

  // Cognition（認知・知覚）
  'think': { ja: '考える', type: 'ichidan' },
  'know': { ja: '知る', type: 'godan' },
  'see': { ja: '見る', type: 'ichidan' },
  'hear': { ja: '聞く', type: 'godan' },
  'feel': { ja: '感じる', type: 'ichidan' },
  'believe': { ja: '信じる', type: 'ichidan' },
  'understand': { ja: '理解する', type: 'suru' },
  'remember': { ja: '覚える', type: 'ichidan' },
  'forget': { ja: '忘れる', type: 'ichidan' },
  'want': { ja: '欲しい', type: 'ichidan' },  // 形容詞的だが動詞として扱う
  'need': { ja: '必要とする', type: 'suru' },
  'like': { ja: '好む', type: 'godan' },
  'love': { ja: '愛する', type: 'suru' },
  'hate': { ja: '嫌う', type: 'godan' },
  'hope': { ja: '望む', type: 'godan' },
  'expect': { ja: '期待する', type: 'suru' },
  'prefer': { ja: '好む', type: 'godan' },

  // Communication（伝達）
  'say': { ja: '言う', type: 'godan' },
  'tell': { ja: '伝える', type: 'ichidan' },
  'speak': { ja: '話す', type: 'godan' },
  'talk': { ja: '話す', type: 'godan' },
  'ask': { ja: '尋ねる', type: 'ichidan' },
  'answer': { ja: '答える', type: 'ichidan' },
  'call': { ja: '呼ぶ', type: 'godan' },
  'explain': { ja: '説明する', type: 'suru' },

  // State（状態・存在）
  'be': { ja: 'である', type: 'godan' },  // 特殊（だ/である）
  'have': { ja: '持つ', type: 'godan' },
  'exist': { ja: '存在する', type: 'suru' },
  'live': { ja: '住む', type: 'godan' },
  'reside': { ja: '居住する', type: 'suru' },
  'stay': { ja: '滞在する', type: 'suru' },
  'belong': { ja: '属する', type: 'suru' },
  'seem': { ja: '見える', type: 'ichidan' },
};

/**
 * 動詞エントリを取得（見つからなければデフォルト値を返す）
 */
export function getVerbEntry(lemma: string): VerbEntry {
  return verbToJapanese[lemma] || { ja: lemma, type: 'godan' };
}

// ============================================
// 形容詞の日本語マッピング
// ============================================

/**
 * 英語形容詞 → 日本語
 */
export const adjectiveToJapanese: Record<string, string> = {
  // Size（大きさ）
  'big': '大きい',
  'small': '小さい',
  'large': '大きい',
  'tall': '高い',
  'short': '短い',
  'long': '長い',
  'wide': '広い',
  'narrow': '狭い',
  'thick': '厚い',
  'thin': '薄い',
  'deep': '深い',
  'shallow': '浅い',
  'high': '高い',
  'low': '低い',

  // Age（年齢・新旧）
  'old': '古い',
  'young': '若い',
  'new': '新しい',
  'ancient': '古代の',
  'modern': '現代の',
  'fresh': '新鮮な',

  // Color（色）
  'red': '赤い',
  'blue': '青い',
  'green': '緑の',
  'yellow': '黄色い',
  'orange': 'オレンジの',
  'purple': '紫の',
  'pink': 'ピンクの',
  'brown': '茶色の',
  'black': '黒い',
  'white': '白い',
  'gray': '灰色の',

  // Physical（物理的）
  'hard': '硬い',
  'soft': '柔らかい',
  'hot': '熱い',
  'cold': '冷たい',
  'warm': '温かい',
  'cool': '涼しい',
  'wet': '濡れた',
  'dry': '乾いた',
  'heavy': '重い',
  'light': '軽い',
  'fast': '速い',
  'slow': '遅い',
  'loud': 'うるさい',
  'quiet': '静かな',
  'bright': '明るい',
  'dark': '暗い',
  'clean': 'きれいな',
  'dirty': '汚い',
  'smooth': '滑らかな',
  'rough': '粗い',
  'sharp': '鋭い',
  'dull': '鈍い',
  'strong': '強い',
  'weak': '弱い',

  // Quality（品質）
  'good': '良い',
  'bad': '悪い',
  'beautiful': '美しい',
  'ugly': '醜い',
  'pretty': 'かわいい',
  'handsome': 'ハンサムな',
  'nice': '素敵な',
  'wonderful': '素晴らしい',
  'terrible': 'ひどい',
  'excellent': '優秀な',
  'perfect': '完璧な',
  'amazing': '驚くべき',
  'great': 'すばらしい',
  'poor': '貧しい',
  'rich': '裕福な',
  'expensive': '高価な',
  'cheap': '安い',
  'free': '無料の',
  'important': '重要な',
  'famous': '有名な',
  'popular': '人気の',
  'easy': '簡単な',
  'difficult': '難しい',
  'simple': '単純な',
  'complex': '複雑な',
  'interesting': '面白い',
  'boring': '退屈な',
  'fun': '楽しい',
  'dangerous': '危険な',
  'safe': '安全な',
  'healthy': '健康な',
  'sick': '病気の',
  'hungry': '空腹な',
  'full': '満腹の',
  'empty': '空の',
  'busy': '忙しい',
  'ready': '準備ができた',
  'late': '遅い',
  'early': '早い',
  'right': '正しい',
  'wrong': '間違った',
  'true': '本当の',
  'false': '偽りの',
  'real': '本物の',
  'fake': '偽物の',
  'possible': '可能な',
  'impossible': '不可能な',
  'necessary': '必要な',
  'special': '特別な',
  'normal': '普通の',
  'strange': '奇妙な',
  'different': '異なる',
  'same': '同じ',
  'similar': '似た',

  // Emotion（感情）
  'happy': '幸せな',
  'sad': '悲しい',
  'angry': '怒った',
  'afraid': '恐れた',
  'scared': '怖がった',
  'surprised': '驚いた',
  'excited': '興奮した',
  'tired': '疲れた',
  'bored': '退屈した',
  'worried': '心配した',
  'nervous': '緊張した',
  'proud': '誇りに思う',
  'lonely': '寂しい',
  'lucky': '幸運な',
  'sorry': '申し訳ない',
  'glad': '嬉しい',
  'kind': '親切な',
  'friendly': '友好的な',
  'polite': '礼儀正しい',
  'rude': '失礼な',
  'smart': '賢い',
  'stupid': '愚かな',
  'crazy': '狂った',
  'serious': '真剣な',
  'funny': 'おかしい',
  'careful': '注意深い',
  'careless': '不注意な',
  'lazy': '怠惰な',
  'brave': '勇敢な',
};

/**
 * 形容詞を日本語に変換（見つからなければそのまま返す）
 */
export function translateAdjective(lemma: string): string {
  return adjectiveToJapanese[lemma] || lemma;
}

// ============================================
// 副詞の日本語マッピング
// ============================================

/**
 * 英語副詞 → 日本語
 */
export const adverbToJapanese: Record<string, string> = {
  // Manner（様態）
  'quickly': '速く',
  'slowly': 'ゆっくりと',
  'carefully': '注意深く',
  'easily': '簡単に',
  'happily': '幸せに',
  'sadly': '悲しく',
  'quietly': '静かに',
  'loudly': '大声で',
  'well': 'よく',
  'badly': 'ひどく',
  'hard': '一生懸命に',
  'fast': '速く',
  'suddenly': '突然に',
  'gradually': '徐々に',
  'naturally': '自然に',
  'automatically': '自動的に',
  'properly': '適切に',
  'correctly': '正しく',
  'perfectly': '完璧に',
  'completely': '完全に',
  'together': '一緒に',
  'alone': '一人で',
  'seriously': '真剣に',
  'honestly': '正直に',
  'furiously': '猛烈に',

  // Frequency（頻度）
  'always': 'いつも',
  'usually': '普段',
  'often': 'よく',
  'sometimes': '時々',
  'rarely': 'まれに',
  'seldom': 'まれに',
  // never - スキップ（否定形が必要）
  'again': 'また',
  'once': '一度',
  'twice': '二度',

  // Degree（程度）
  'very': 'とても',
  'really': '本当に',
  'quite': 'かなり',
  'pretty': 'けっこう',
  'extremely': '非常に',
  'absolutely': '絶対に',
  'almost': 'ほとんど',
  'nearly': 'ほぼ',
  // hardly - スキップ（否定形が必要）
  'enough': '十分に',
  'too': 'あまりにも',

  // Time（時間）
  'now': '今',
  'then': 'その時',
  'soon': 'もうすぐ',
  'later': '後で',
  'already': 'すでに',
  'still': 'まだ',
  'yet': 'まだ',
  'just': 'ちょうど',
  'recently': '最近',
  'finally': 'ついに',
  'immediately': 'すぐに',
  'eventually': '最終的に',
  'today': '今日',
  'yesterday': '昨日',
  'tomorrow': '明日',
  // TimeChip expressions（複合表現 - アンダースコア形式）
  'every_day': '毎日',
  'right_now': '今すぐ',
  'at_the_moment': '現在',
  'next_week': '来週',
  'just_now': 'たった今',
  'last_sunday': '先週の日曜日',

  // Place（場所）
  'here': 'ここに',
  'there': 'そこに',
  'somewhere': 'どこかに',
  'everywhere': 'どこでも',
  // nowhere - スキップ（否定形が必要）
  'inside': '中に',
  'outside': '外に',
  'upstairs': '上の階に',
  'downstairs': '下の階に',
  'indoors': '屋内に',
  'outdoors': '屋外に',
  'abroad': '海外に',
  'home': '家に',
  'away': '離れて',
  'back': '戻って',
  'ahead': '前方に',
  'nearby': '近くに',
  'far': '遠くに',

  // 疑問副詞（?プレフィックス付き - dictionary-core形式）
  '?how': 'どう',
  '?when': 'いつ',
  '?where': 'どこで',
};

/**
 * 副詞を日本語に変換（見つからなければそのまま返す）
 */
export function translateAdverb(lemma: string): string {
  return adverbToJapanese[lemma] || lemma;
}
