import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Translations {
  [key: string]: string;
}

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  flag?: string;
}

export interface I18nContextValue {
  locale: string;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: string) => void;
  availableLocales: LocaleInfo[];
  isLoading: boolean;
}

// ─── Available locales ────────────────────────────────────────────────────────

export const AVAILABLE_LOCALES: LocaleInfo[] = [
  { code: "en", name: "English",     nativeName: "English",    direction: "ltr", flag: "🇬🇧" },
  { code: "fr", name: "French",      nativeName: "Français",   direction: "ltr", flag: "🇫🇷" },
  { code: "yo", name: "Yoruba",      nativeName: "Yorùbá",     direction: "ltr", flag: "🇳🇬" },
  { code: "ha", name: "Hausa",       nativeName: "Hausa",      direction: "ltr", flag: "🇳🇬" },
  { code: "sw", name: "Swahili",     nativeName: "Kiswahili",  direction: "ltr", flag: "🇰🇪" },
  { code: "hi", name: "Hindi",       nativeName: "हिन्दी",      direction: "ltr", flag: "🇮🇳" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Kinyarwanda",direction: "ltr", flag: "🇷🇼" },
];

const STORAGE_KEY = "unmapped_locale";
const DEFAULT_LOCALE = "en";

// ─── Context ──────────────────────────────────────────────────────────────────

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Locale loader ────────────────────────────────────────────────────────────

// Cache so we don't re-fetch the same locale file twice
const translationCache: Record<string, Translations> = {};

async function loadTranslations(locale: string): Promise<Translations> {
  if (translationCache[locale]) return translationCache[locale];

  try {
    // Dynamic import — Vite will code-split each locale into its own chunk
    const module = await import(`../locales/${locale}.json`);
    const translations: Translations = module.default ?? module;
    translationCache[locale] = translations;
    return translations;
  } catch {
    console.warn(`[i18n] Could not load locale "${locale}". Falling back to English.`);
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE);
    }
    return {};
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && AVAILABLE_LOCALES.some(l => l.code === stored)) return stored;
      // Try to detect from browser
      const browserLang = navigator.language?.split("-")[0] ?? DEFAULT_LOCALE;
      if (AVAILABLE_LOCALES.some(l => l.code === browserLang)) return browserLang;
    }
    return DEFAULT_LOCALE;
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [englishFallback, setEnglishFallback] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load English fallback once on mount
  useEffect(() => {
    loadTranslations(DEFAULT_LOCALE).then(setEnglishFallback);
  }, []);

  // Load active locale whenever it changes
  useEffect(() => {
    setIsLoading(true);
    loadTranslations(locale).then(t => {
      setTranslations(t);
      setIsLoading(false);
      // Update html[dir] and html[lang] for a11y
      if (typeof document !== "undefined") {
        const info = AVAILABLE_LOCALES.find(l => l.code === locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = info?.direction ?? "ltr";
      }
    });
  }, [locale]);

  const setLocale = useCallback((newLocale: string) => {
    if (!AVAILABLE_LOCALES.some(l => l.code === newLocale)) {
      console.warn(`[i18n] Unknown locale "${newLocale}" — ignoring.`);
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      // 1. Try active locale
      if (translations[key] !== undefined) return translations[key];
      // 2. Try English fallback
      if (englishFallback[key] !== undefined) return englishFallback[key];
      // 3. Use provided fallback string
      if (fallback !== undefined) return fallback;
      // 4. Last resort: return the key itself
      return key;
    },
    [translations, englishFallback],
  );

  return (
    <I18nContext.Provider
      value={{ locale, t, setLocale, availableLocales: AVAILABLE_LOCALES, isLoading }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n() must be called inside <I18nProvider>.");
  }
  return ctx;
}
