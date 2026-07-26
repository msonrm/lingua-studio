/**
 * 言語パックの契約テスト
 *
 * 各言語パックが同じ形で語を引けること、未登録語を区別できることを確認する。
 * 言語を追加したらここに1行足すだけで、同じ契約が課される。
 */

import { describe, it, expect } from 'vitest';
import { languagePacks, english, japanese } from '../languages';
import { verbCores, nounCores, adjectiveCores, adverbCores } from '../concepts';

describe('言語パックの契約', () => {
  it.each(languagePacks)('$name: ベース辞書の語をすべて引ける', pack => {
    const missing = {
      verbs: verbCores.filter(v => pack.lookupVerb(v.lemma) === undefined).map(v => v.lemma),
      nouns: nounCores.filter(n => pack.lookupNoun(n.lemma) === undefined).map(n => n.lemma),
      adjectives: adjectiveCores
        .filter(a => pack.lookupAdjective(a.lemma) === undefined)
        .map(a => a.lemma),
      adverbs: adverbCores.filter(a => pack.lookupAdverb(a.lemma) === undefined).map(a => a.lemma),
    };
    expect(missing).toEqual({ verbs: [], nouns: [], adjectives: [], adverbs: [] });
  });

  it.each(languagePacks)('$name: 未登録の語は undefined を返す', pack => {
    // 存在しない lemma。lemma をそのまま返して「引けた」と誤認しないこと
    expect(pack.lookupVerb('__no_such_verb__')).toBeUndefined();
    expect(pack.lookupNoun('__no_such_noun__')).toBeUndefined();
    expect(pack.lookupAdjective('__no_such_adjective__')).toBeUndefined();
    expect(pack.lookupAdverb('__no_such_adverb__')).toBeUndefined();
  });

  it.each(languagePacks)('$name: ユーザー辞書の入力項目を宣言している', pack => {
    expect(pack.userEntryFields.length).toBeGreaterThan(0);
    for (const field of pack.userEntryFields) {
      expect(field.key).toBeTruthy();
      expect(field.label).toBeTruthy();
      if (field.kind === 'select') {
        expect(field.options?.length).toBeGreaterThan(0);
      }
    }
  });

  it('コードが重複していない', () => {
    const codes = languagePacks.map(p => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('言語ごとの語形の違い', () => {
  it('英語は活用形を規則変化から導出できる', () => {
    // 辞書に語形がなくても base + ed/ing/s で補える
    const verb = english.lookupVerb('eat');
    expect(verb?.forms).toMatchObject({ base: 'eat', past: 'ate', ing: 'eating' });
  });

  it('日本語の活用タイプは表層形から推論できない', () => {
    // 語尾が同じ「る」でも五段と一段が混在する。
    // だからユーザー辞書では活用タイプを必須入力にしている。
    expect(japanese.lookupVerb('run')).toEqual({ ja: '走る', type: 'godan' });
    expect(japanese.lookupVerb('eat')).toEqual({ ja: '食べる', type: 'ichidan' });

    const verbTypeField = japanese.userEntryFields.find(f => f.key === 'verbType');
    expect(verbTypeField?.required).toBe(true);
    expect(verbTypeField?.kind).toBe('select');
  });
});
