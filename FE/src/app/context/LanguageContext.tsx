import { createContext, useContext, useState, ReactNode } from 'react';
import t, { Lang, TranslationKeys } from '../i18n/translations';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: TranslationKeys;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  T: t.en,
});

const STORAGE_KEY = 'gradora_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) || 'en'
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, T: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
