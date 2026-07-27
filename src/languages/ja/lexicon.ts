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

import { SemanticRole, AdjectiveGrade } from '../../types/schema';
import { verbCores } from '../../concepts';
import { findUserForms } from '../../userDictionary';

export type Particle = 'は' | 'が' | 'を' | 'に' | 'で' | 'から' | 'まで' | 'と' | 'へ' | '';

/**
 * 意味役割から格助詞へのデフォルトマッピング
 * 注意: 主語かどうかは動詞のvalencyで動的に決定
 */
const roleToParticleDefault: Partial<Record<SemanticRole, Particle>> = {
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
function getSubjectRole(verbLemma: string): SemanticRole | undefined {
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
 * 役割の既定の格助詞を上書きする動詞
 *
 * 場所を表す「で」は**動作が行われる場所**を指す（「公園で食べる」）。
 * 存在・居住は「に」を取る（「公園に住む」であって「公園で住む」ではない）。
 *
 * 英語が `verbPrepositions.ts` で動詞ごとの前置詞を持つのと対になる。
 * どちらも「項をどう標示するか」で、言語ごとに違うので言語パックに置く。
 */
const verbParticleOverride: Record<string, Partial<Record<SemanticRole, Particle>>> = {
  live: { location: 'に' },
  reside: { location: 'に' },
  stay: { location: 'に' },
};

/**
 * 役割に対応する格助詞を取得（主語は「は」、それ以外はデフォルトマッピング）
 */
export function getParticle(role: SemanticRole, verbLemma: string): Particle | undefined {
  if (isSubjectRole(role, verbLemma)) {
    return 'は';
  }
  return verbParticleOverride[verbLemma]?.[role] ?? roleToParticleDefault[role];
}

// ============================================
// 代名詞の日本語マッピング
// ============================================

/**
 * 英語代名詞 → 日本語
 */
const pronounToJapanese: Record<string, string> = {
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

  // 独立所有代名詞（mine, yours, etc.）
  'mine': '私のもの',
  'yours': 'あなたのもの',
  'his': '彼のもの',
  'hers': '彼女のもの',
  'its': 'それのもの',
  'ours': '私たちのもの',
  'theirs': '彼らのもの',
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
 * 中央限定詞 → 日本語
 * - 所有格: my, your, his, her, its, our, their
 * - 指示詞: this, that, these, those
 * - 分配詞: each, every, either, any
 * - 複合量化詞: a few, a little, a lot of, etc.
 */
const possessiveToJapanese: Record<string, string> = {
  // 所有格
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
  // 分配詞
  'each': 'それぞれの',
  'every': 'すべての',
  'either': 'どちらかの',
  'any': 'どんな',
  // 複合量化詞
  'a_few': 'いくつかの',
  'a_little': '少しの',
  'a_lot_of': 'たくさんの',
  'plenty_of': 'たっぷりの',
  'a_number_of': 'いくつかの',
  'a_couple_of': '2、3の',
  'a_great_deal_of': '大量の',
  'many_a': '多くの',
  'quite_a_few': 'かなりの',
};

/**
 * Pre-determiner（前限定詞）の日本語マッピング
 */
const preDeterminerToJapanese: Record<string, string> = {
  'all': 'すべての',
  'both': '両方の',
  'half': '半分の',
};

/**
 * Post-determiner（後限定詞・数量詞）の日本語マッピング
 */
const postDeterminerToJapanese: Record<string, string> = {
  'many': 'たくさんの',
  'few': '少しの',
  'some': 'いくつかの',
  'several': 'いくつかの',
  'much': 'たくさんの',
  'little': '少しの',
  // 数詞
  'one': '1つの',
  'two': '2つの',
  'three': '3つの',
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

/**
 * Pre-determinerを日本語に変換
 */
export function translatePreDeterminer(det: string): string {
  return preDeterminerToJapanese[det] || det;
}

/**
 * Post-determinerを日本語に変換
 */
export function translatePostDeterminer(det: string): string {
  return postDeterminerToJapanese[det] || det;
}

// ============================================
// 名詞の日本語マッピング
// ============================================

/**
 * 英語名詞 → 日本語
 */
const nounToJapanese: Record<string, string> = {
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
  'telescope': '望遠鏡',
  'camera': 'カメラ',
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
  return nounToJapanese[lemma] ?? findUserForms(lemma, 'ja')?.ja ?? lemma;
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
/** @public ユーザー辞書で活用タイプを選ばせるために公開している（推論できないため必須入力） */
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
const verbToJapanese: Record<string, VerbEntry> = {
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
/**
 * 動詞エントリを取得（ベース辞書 → ユーザー辞書 → 既定値）
 *
 * 未登録でも既定値を返す（レンダラーが落ちないため）。
 * 「引けたかどうか」を判定したい場合は言語パックの `lookupVerb()` を使う。
 */
export function getVerbEntry(lemma: string): VerbEntry {
  const base = verbToJapanese[lemma];
  if (base) return base;

  const user = findUserForms(lemma, 'ja');
  if (user?.ja) {
    // 活用タイプが無ければ五段とみなす（ユーザー辞書では必須入力）
    return { ja: user.ja, type: (user.verbType as VerbType) ?? 'godan' };
  }
  return { ja: lemma, type: 'godan' };
}

// ============================================
// 形容詞の日本語マッピング
// ============================================

/**
 * 英語形容詞 → 日本語
 */
const adjectiveToJapanese: Record<string, string> = {
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
  'colorless': '無色の',

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
 *
 * ⚠ 返るのは **連体形**（「幸せな」「赤い」「本当の」）。
 *    名詞修飾はこのまま使えるが、述語で使う場合は `analyzeAdjective()` で
 *    語幹と型を取り出すこと。「幸せなである」のような誤りを防ぐため。
 */
export function translateAdjective(lemma: string): string {
  return adjectiveToJapanese[lemma] ?? findUserForms(lemma, 'ja')?.ja ?? lemma;
}

/**
 * 級を表す接頭辞を付ける
 *
 * 日本語は形態変化ではなく副詞で級を表すので、連体形・述語形の
 * どちらにも前置するだけでよい。
 *
 *   原級: 大きい / 比較級: より大きい / 最上級: 最も大きい
 */
export function gradePrefix(grade: AdjectiveGrade | undefined): string {
  if (grade === 'comparative') return 'より';
  if (grade === 'superlative') return '最も';
  return '';
}

/**
 * 日本語形容詞の活用型
 * - `i`  : イ形容詞（悲しい、赤い）。述語では形容詞自体が活用する
 * - `na` : ナ形容詞・ノ形容詞（幸せな、本当の）。述語では語幹 + である
 * - `other`: 動詞由来など（疲れた、同じ）。ナ形容詞と同じく である を付ける
 */
type JapaneseAdjectiveType = 'i' | 'na' | 'other';

export interface JapaneseAdjectiveForm {
  /** 連体形（名詞修飾で使う形。「幸せな」「悲しい」） */
  attributive: string;
  /** 述語を組み立てるための語幹（イ形容詞は「い」を除いた形、ナ形容詞は「な」「の」を除いた形） */
  stem: string;
  /**
   * 連用形（用言を修飾する形。「幸せに」「悲しく」）。
   * 「〜に見える」のように繋辞以外の動詞へ係る場合に使う。
   * 型が `other`（動詞由来の「疲れた」など）のときは変換できないので連体形をそのまま返す。
   */
  adverbial: string;
  type: JapaneseAdjectiveType;
}

/**
 * 形容詞の連体形から、述語で使うための語幹と活用型を求める。
 *
 * 判定は語尾のみで行う（辞書に型情報を持たせていないため）:
 *   「〜な」→ na  /  「〜の」→ na  /  「〜い」→ i  /  それ以外 → other
 *
 * 「〜な」を先に見るので、「幸いな」のように語幹が「い」で終わるナ形容詞も正しく na になる。
 */
export function analyzeAdjective(lemma: string): JapaneseAdjectiveForm {
  const attributive = translateAdjective(lemma);

  if (attributive.endsWith('な') || attributive.endsWith('の')) {
    const stem = attributive.slice(0, -1);
    return { attributive, stem, adverbial: stem + 'に', type: 'na' };
  }
  if (attributive.endsWith('い')) {
    const stem = attributive.slice(0, -1);
    return { attributive, stem, adverbial: stem + 'く', type: 'i' };
  }
  return { attributive, stem: attributive, adverbial: attributive, type: 'other' };
}

// ============================================
// 副詞の日本語マッピング
// ============================================

/**
 * 英語副詞 → 日本語
 */
const adverbToJapanese: Record<string, string> = {
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

  // Negative Polarity Items（否定極性項目 - 動詞を否定形にする）
  'never': '決して',
  'hardly': 'ほとんど',
  'barely': 'かろうじて',
  'nowhere': 'どこにも',
  'anywhere': 'どこにも',  // 否定文脈で使用

  // Place（場所）
  'here': 'ここに',
  'there': 'そこに',
  'somewhere': 'どこかに',
  'everywhere': 'どこでも',
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
  return adverbToJapanese[lemma] ?? findUserForms(lemma, 'ja')?.ja ?? lemma;
}

// ============================================
// 接続詞の日本語マッピング
// ============================================

/**
 * 等位接続詞 → 日本語
 * 日本語では接尾辞型で使用（「AとB」「AかB」）
 */
const conjunctionToJapanese: Record<string, string> = {
  'and': 'と',
  'or': 'か',
};

/**
 * 接続詞を日本語に変換
 */
export function translateConjunction(conj: string): string {
  return conjunctionToJapanese[conj] || conj;
}

/**
 * 否定極性副詞（Negative Polarity Items）
 * これらの副詞が存在する場合、動詞は否定形で活用する必要がある
 * 例: never eat → 決して食べない（食べる ではなく）
 */
const NEGATIVE_POLARITY_ADVERBS = new Set([
  'never',
  'hardly',
  'barely',
  'nowhere',
  'anywhere',  // 否定文脈では「どこにも〜ない」
]);

/**
 * 副詞が否定極性項目かどうかを判定
 */
export function isNegativePolarityAdverb(lemma: string): boolean {
  return NEGATIVE_POLARITY_ADVERBS.has(lemma);
}

// ============================================
// 前置詞の日本語マッピング（後置詞化）
// ============================================

/**
 * 英語前置詞 → 日本語後置詞
 * 日本語では前置詞が後置詞（格助詞・複合助詞）として機能する
 * 例: "in the park" → "公園で"
 */
const prepositionToJapanese: Record<string, string> = {
  // 場所・位置
  'in': 'で',           // in the park → 公園で
  'at': 'で',           // at the station → 駅で
  'on': 'の上に',       // on the table → テーブルの上に
  'under': 'の下に',    // under the tree → 木の下に
  'over': 'の上に',     // over the bridge → 橋の上に
  'above': 'の上に',    // above the clouds → 雲の上に
  'below': 'の下に',    // below the surface → 表面の下に
  'between': 'の間に',  // between the trees → 木々の間に
  'among': 'の中で',    // among friends → 友人の中で
  'near': 'の近くに',   // near the house → 家の近くに
  'beside': 'のそばに', // beside the river → 川のそばに
  'behind': 'の後ろに', // behind the building → 建物の後ろに
  'inside': 'の中に',   // inside the box → 箱の中に
  'outside': 'の外に',  // outside the room → 部屋の外に
  'around': 'の周りに', // around the city → 都市の周りに

  // 方向・移動
  'to': 'に',           // to school → 学校に
  'into': 'の中に',     // into the room → 部屋の中に
  'onto': 'の上に',     // onto the table → テーブルの上に
  'from': 'から',       // from Tokyo → 東京から
  'toward': 'に向かって', // toward the station → 駅に向かって
  'towards': 'に向かって',
  'through': 'を通って', // through the door → ドアを通って
  'across': 'を横切って', // across the street → 通りを横切って
  'along': 'に沿って',  // along the river → 川に沿って

  // 手段・道具・同伴
  'with': 'と',         // with a friend → 友達と
  'by': 'で',           // by bus → バスで
  'without': 'なしで',  // without help → 助けなしで

  // 目的・対象・関係
  'for': 'のために',    // for you → あなたのために
  'about': 'について',  // about the book → 本について
  'of': 'の',           // a cup of tea → お茶のカップ
  'as': 'として',       // as a teacher → 先生として
  'like': 'のように',   // like a bird → 鳥のように

  // 時間
  'before': 'の前に',   // before dinner → 夕食の前に
  'after': 'の後に',    // after school → 学校の後に
  'during': 'の間',     // during the meeting → 会議の間
  'until': 'まで',      // until tomorrow → 明日まで
  'till': 'まで',
  'since': 'から',      // since yesterday → 昨日から
};

/**
 * 前置詞を日本語後置詞に変換（見つからなければそのまま返す）
 */
export function translatePreposition(prep: string): string {
  return prepositionToJapanese[prep] || prep;
}

/**
 * 前置詞を連体修飾形（名詞を修飾する形）に変換
 * 例: "on the table" → "テーブルの上の"（「テーブルの上に」ではなく）
 */
export function translatePrepositionAsModifier(prep: string): string {
  const base = prepositionToJapanese[prep];
  if (!base) return prep;

  // 「〜に」「〜で」を「〜の」に変換（連体修飾化）
  if (base.endsWith('に') || base.endsWith('で')) {
    return base.slice(0, -1) + 'の';
  }
  // 「〜の間」「〜まで」などはそのまま「の」を付加
  return base + 'の';
}
