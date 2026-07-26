/**
 * ユーザー辞書の保存形式と移行のテスト
 *
 * 既存ユーザーの localStorage を壊さないことが最優先なので、
 * 旧形式の実データを読み込めることを先に固定する。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { migratePackage, STORAGE_VERSION } from '../userDictionary';

/**
 * 旧形式の実データ
 *
 * `version: "1.0"` を名乗っていたが、日本語レンダラーへの配線も入力 UI も無く
 * 実質機能していなかった。正式に動く形をあらためて 1 としたため、
 * 新旧は version 文字列ではなく**中身の形**で見分ける。
 *
 * 当時の形式:
 * - 英語の語形が `forms` に直接入っている
 * - 他言語は `translations` に入る。動詞だけ `{ surface, type }` で活用タイプを持ち、
 *   名詞・形容詞・副詞は文字列（活用しないので足りる）
 */
const LEGACY_PACKAGE = {
  name: 'user-dictionary',
  version: '1.0',
  words: {
    verbs: [
      {
        lemma: 'prepare',
        type: 'action',
        category: 'action',
        valency: [
          { role: 'agent', required: true },
          { role: 'patient', required: false },
        ],
        forms: { base: 'prepare', past: 'prepared', pp: 'prepared', ing: 'preparing', s: 'prepares' },
        translations: { ja: { surface: '準備する', type: 'suru' } },
      },
      {
        lemma: 'gather',
        type: 'action',
        category: 'action',
        valency: [{ role: 'agent', required: true }],
        forms: { base: 'gather', past: 'gathered', pp: 'gathered', ing: 'gathering', s: 'gathers' },
        translations: { ja: { surface: '集める', type: 'ichidan' } },
      },
      {
        lemma: 'arrive',
        type: 'action',
        category: 'motion',
        valency: [{ role: 'agent', required: true }],
        forms: { base: 'arrive', past: 'arrived', pp: 'arrived', ing: 'arriving', s: 'arrives' },
        // 訳語なし
      },
    ],
    nouns: [
      {
        lemma: 'notebook',
        category: 'object',
        countable: true,
        forms: { plural: 'notebooks' },
        translations: { ja: 'ノート' },
      },
    ],
    adjectives: [
      { lemma: 'tidy', category: 'quality', translations: { ja: 'きちんとした' } },
    ],
    adverbs: [{ lemma: 'neatly', type: 'manner', translations: { ja: 'きちんと' } }],
  },
};

describe('保存形式の移行', () => {
  let migrated: ReturnType<typeof migratePackage>;

  beforeEach(() => {
    migrated = migratePackage(structuredClone(LEGACY_PACKAGE));
  });

  it('旧形式のパッケージを読み込める', () => {
    expect(migrated.version).toBe(STORAGE_VERSION);
    expect(migrated.words.verbs).toHaveLength(3);
    expect(migrated.words.nouns).toHaveLength(1);
    expect(migrated.words.adjectives).toHaveLength(1);
    expect(migrated.words.adverbs).toHaveLength(1);
  });

  it('言語非依存の情報を保つ', () => {
    const prepare = migrated.words.verbs!.find(v => v.lemma === 'prepare')!;
    expect(prepare.category).toBe('action');
    expect(prepare.valency).toEqual([
      { role: 'agent', required: true },
      { role: 'patient', required: false },
    ]);
  });

  it('英語の語形を forms.en に移す', () => {
    const prepare = migrated.words.verbs!.find(v => v.lemma === 'prepare')!;
    expect(prepare.forms.en).toEqual({
      past: 'prepared',
      pp: 'prepared',
      ing: 'preparing',
      s: 'prepares',
    });
  });

  it('translations.ja を forms.ja に移す', () => {
    const prepare = migrated.words.verbs!.find(v => v.lemma === 'prepare')!;
    expect(prepare.forms.ja?.ja).toBe('準備する');
  });

  it('動詞の活用タイプをそのまま引き継ぐ', () => {
    // 旧形式でも動詞は { surface, type } で活用タイプを保存していたので、推測は不要
    const verbs = migrated.words.verbs!;
    expect(verbs.find(v => v.lemma === 'prepare')!.forms.ja).toEqual({
      ja: '準備する',
      verbType: 'suru',
    });
    expect(verbs.find(v => v.lemma === 'gather')!.forms.ja).toEqual({
      ja: '集める',
      verbType: 'ichidan',
    });
  });

  it('活用タイプが欠けている場合は推測し、確実でなければ未確認にする', () => {
    // 手書きのパッケージなど、type が欠けたデータが来ることはありうる
    const verb = (lemma: string, ja: string) => ({
      lemma,
      type: 'action',
      category: 'action',
      valency: [{ role: 'agent', required: true }],
      forms: { base: lemma, past: `${lemma}d`, pp: `${lemma}d`, ing: `${lemma}ing`, s: `${lemma}s` },
      translations: { ja },
    });

    const result = migratePackage({
      name: 'x',
      version: '1.0',
      words: { verbs: [verb('handle', '処理する'), verb('collect', '集める')] },
    });

    // 「〜する」で終わればサ変と確実に分かるので、確認は要らない
    const handle = result.words.verbs!.find(v => v.lemma === 'handle')!;
    expect(handle.forms.ja).toEqual({ ja: '処理する', verbType: 'suru' });
    expect(handle.unverified ?? []).not.toContain('ja');

    // 「〜る」は五段（走る）と一段（集める）の区別がつかない。
    // 仮に五段としたうえで要確認にする（実際 集める は一段なので誤り）
    const collect = result.words.verbs!.find(v => v.lemma === 'collect')!;
    expect(collect.forms.ja).toEqual({ ja: '集める', verbType: 'godan' });
    expect(collect.unverified).toContain('ja');
  });

  it('訳語がない語には forms.ja を作らない', () => {
    const arrive = migrated.words.verbs!.find(v => v.lemma === 'arrive')!;
    expect(arrive.forms.ja).toBeUndefined();
    expect(arrive.unverified ?? []).not.toContain('ja');
  });

  it('旧形式の語はすべて確認済み扱いにする（活用タイプが保存されているため）', () => {
    for (const verb of migrated.words.verbs!) {
      expect(verb.unverified ?? []).toEqual([]);
    }
  });

  it('名詞・形容詞・副詞も移行する', () => {
    expect(migrated.words.nouns![0].forms.en).toEqual({ plural: 'notebooks' });
    expect(migrated.words.nouns![0].forms.ja?.ja).toBe('ノート');
    expect(migrated.words.adjectives![0].forms.ja?.ja).toBe('きちんとした');
    expect(migrated.words.adverbs![0].forms.ja?.ja).toBe('きちんと');
  });

  it('活用しない品詞は訳語だけで足りる', () => {
    expect(migrated.words.nouns![0].unverified ?? []).toEqual([]);
    expect(migrated.words.adjectives![0].unverified ?? []).toEqual([]);
  });

  it('現行形式のパッケージはそのまま通す（冪等）', () => {
    const again = migratePackage(structuredClone(migrated));
    expect(again).toEqual(migrated);
  });

  it('未来のバージョンは中身を捨てて空を返す', () => {
    const result = migratePackage({ name: 'x', version: '99', words: {} });
    expect(result.version).toBe(STORAGE_VERSION);
    expect(result.words.verbs ?? []).toEqual([]);
  });

  it('新旧の判定は version 文字列ではなく中身の形で行う', () => {
    // 旧形式も "1.0" を名乗っていたため、正式版 "1" と文字列では区別できない。
    // バージョンが現行と同じでも、中身が旧形式なら変換する
    const mislabeled = migratePackage({
      ...structuredClone(LEGACY_PACKAGE),
      version: STORAGE_VERSION,
    });
    expect(mislabeled.words.verbs![0].forms.en).toBeDefined();
    expect(mislabeled.words.verbs![0].forms.ja?.ja).toBe('準備する');

    // 逆に、バージョンが旧いままでも中身が現行形式ならそのまま通す
    const current = migratePackage({ ...structuredClone(migrated), version: '1.0' });
    expect(current.words.verbs).toEqual(migrated.words.verbs);
  });

  it('中身が空の旧形式も読める', () => {
    const result = migratePackage({ name: 'x', version: '1.0', words: {} });
    expect(result.version).toBe(STORAGE_VERSION);
    expect(result.words.verbs).toEqual([]);
  });
});

describe('ユーザー辞書の語が両言語で使える', () => {
  it('追加した語が英語でも日本語でも正しく活用される', async () => {
    const { addVerb } = await import('../userDictionary');
    const [{ generateMultipleAST }, { renderToEnglishWithLogs }, { renderToJapanese }] =
      await Promise.all([
        import('../renderer/astGenerator'),
        import('../renderer/english/renderer'),
        import('../renderer/japanese'),
      ]);
    const { buildWorkspace, pronoun, timeFrame } = await import('./workspace');
    await import('../blocks');

    addVerb({
      lemma: 'prepare',
      type: 'action',
      category: 'action',
      valency: [{ role: 'agent', required: true }],
      forms: {
        en: { past: 'prepared', pp: 'prepared', ing: 'preparing', s: 'prepares' },
        ja: { ja: '準備する', verbType: 'suru' },
      },
    });

    const ws = await buildWorkspace(
      timeFrame('past', {
        type: 'verb_action_ext',
        fields: { VERB: 'prepare' },
        inputs: { ARG_0: pronoun('I') },
      })
    );
    try {
      const [ast] = generateMultipleAST(ws);
      expect(renderToEnglishWithLogs(ast).output).toBe('I prepared.');
      // 活用タイプ（サ変）が保存されているので「準備した」と正しく活用される
      expect(renderToJapanese(ast)).toBe('私は準備した。');
    } finally {
      ws.dispose();
    }
  });
});
