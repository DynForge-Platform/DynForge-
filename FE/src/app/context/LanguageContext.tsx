import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import t, { Lang, TranslationKeys } from '../i18n/translations';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: TranslationKeys;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'vi',
  setLang: () => {},
  T: t.vi,
});

const STORAGE_KEY = 'dynforge_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) || (localStorage.getItem('gradora_lang') as Lang) || 'vi'
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
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
