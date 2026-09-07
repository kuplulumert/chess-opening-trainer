import type { Language } from "../i18n/translations";

interface LanguagePickerProps {
  language: Language;
  onSelect: (language: Language) => void;
}

// The "Language" label is deliberately left untranslated — it's the one
// piece of UI copy a reader should recognize before they've picked a
// language at all, so it stays in place regardless of which one is active.
export function LanguagePicker({ language, onSelect }: LanguagePickerProps) {
  return (
    <div className="control-row">
      <span className="control-label">🌐 Language</span>
      <div className="segmented">
        <button
          type="button"
          className={language === "tr" ? "segmented-active" : ""}
          onClick={() => onSelect("tr")}
        >
          TR
        </button>
        <button
          type="button"
          className={language === "en" ? "segmented-active" : ""}
          onClick={() => onSelect("en")}
        >
          EN
        </button>
      </div>
    </div>
  );
}
