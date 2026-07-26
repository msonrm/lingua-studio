/**
 * ユーザー辞書の言語別入力欄
 *
 * 言語パックが宣言する `userEntryFields` から入力欄を組み立てる。
 * 言語を追加してもこのコンポーネントを書き換える必要はない。
 */

import { languagePacks } from '../languages';
import type { PartOfSpeech, UserEntryField } from '../languages';
import type { LanguageFormValues } from '../userDictionary';
import { useLocale } from '../locales';

interface LanguageFormFieldsProps {
  partOfSpeech: PartOfSpeech;
  /** 言語コード → 入力値 */
  values: Record<string, LanguageFormValues>;
  onChange: (languageCode: string, key: string, value: string) => void;
}

export function LanguageFormFields({
  partOfSpeech,
  values,
  onChange,
}: LanguageFormFieldsProps) {
  const { blockly: t } = useLocale();

  /** ラベルはロケールキー。未定義ならキーをそのまま出す */
  const label = (field: UserEntryField): string =>
    (t as unknown as Record<string, string>)[field.label] ?? field.label;

  return (
    <>
      {languagePacks.map(pack => {
        const fields = pack.userEntryFields[partOfSpeech];
        if (fields.length === 0) return null;

        return (
          <div key={pack.code} className="dict-language-section">
            <div className="dict-language-heading">{pack.name}</div>
            {fields.map(field => {
              const value = values[pack.code]?.[field.key] ?? '';
              const id = `dict-${pack.code}-${field.key}`;

              return (
                <div key={field.key} className="dict-field">
                  <label htmlFor={id}>
                    {label(field)}
                    {field.required && <span className="dict-required">*</span>}
                  </label>
                  {field.kind === 'select' ? (
                    <select
                      id={id}
                      value={value}
                      onChange={e => onChange(pack.code, field.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type="text"
                      value={value}
                      placeholder={field.placeholder}
                      onChange={e => onChange(pack.code, field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/**
 * 必須項目がすべて埋まっているか検証する
 *
 * 未入力の言語はスキップする（その言語の語形を持たないまま保存でき、
 * 後から埋められる。第4段階で「未登録の語」として一覧する）。
 */
export function findMissingRequiredFields(
  partOfSpeech: PartOfSpeech,
  values: Record<string, LanguageFormValues>
): { languageCode: string; field: UserEntryField }[] {
  const missing: { languageCode: string; field: UserEntryField }[] = [];

  for (const pack of languagePacks) {
    const entered = values[pack.code];
    // その言語を一切入力していないならスキップ
    if (!entered || Object.values(entered).every(v => !v.trim())) continue;

    for (const field of pack.userEntryFields[partOfSpeech]) {
      if (field.required && !entered[field.key]?.trim()) {
        missing.push({ languageCode: pack.code, field });
      }
    }
  }
  return missing;
}
