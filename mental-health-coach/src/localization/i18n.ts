import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

// BÜTÜN DİLLƏR BURADA OLMALIDIR
export const resources = {
  en: { translation: require('./locales/en.json') },
  az: { translation: require('./locales/az.json') },
  ru: { translation: require('./locales/ru.json') },
  tr: { translation: require('./locales/tr.json') },
  fr: { translation: require('./locales/fr.json') },
  de: { translation: require('./locales/de.json') },
  es: { translation: require('./locales/es.json') },
  it: { translation: require('./locales/it.json') },
  nl: { translation: require('./locales/nl.json') },
  no: { translation: require('./locales/no.json') },
  pt: { translation: require('./locales/pt.json') },
  sv: { translation: require('./locales/sv.json') },
  da: { translation: require('./locales/da.json') },
  fi: { translation: require('./locales/fi.json') },
  pl: { translation: require('./locales/pl.json') },
  cs: { translation: require('./locales/cs.json') },
  sk: { translation: require('./locales/sk.json') },
} as const;

export type SupportedLanguage = keyof typeof resources;

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (value && Object.keys(resources).includes(value)) {
      return value as SupportedLanguage;
    }
    return null;
  } catch { return null; }
}

/**
 * Dil dəyişəndə həm AsyncStorage-ə yazır, həm də i18n-i dərhal yeniləyir.
 * Bu, AI-ya gedən 'i18n.language' dəyərini dərhal dəyişəcək.
 */
export async function setStoredLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    console.log(`Dil dəyişdirildi: ${lang}`);
  } catch (e) { console.error("Dil dəyişmə xətası:", e); }
}

export function detectDeviceLanguage(): SupportedLanguage {
  const deviceCode = Localization.getLocales()[0]?.languageCode || 'en';
  // Əgər cihazın dili bizim listdə varsa onu seç, yoxdursa 'en'
  return Object.keys(resources).includes(deviceCode) ? (deviceCode as SupportedLanguage) : 'en';
}

/**
 * Tətbiq başlayanda çağırılır. 
 * Yaddaşdakı dili götürüb i18n sistemini işə salır.
 */
export async function initI18n(): Promise<void> {
  const stored = await getStoredLanguage();
  const fallback = detectDeviceLanguage();
  const activeLanguage = stored || fallback;
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: activeLanguage, // Yaddaşdakı dili birbaşa bura bağlayırıq
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: { escapeValue: false },
      react: { useSuspense: false }
    });
    
    // Əmin olmaq üçün dili bir daha təsdiqləyirik
    if (i18n.language !== activeLanguage) {
      await i18n.changeLanguage(activeLanguage);
    }
}

export default i18n;
// API Key: rvmNyVLgcAqg8zCGl6gf8bgLOflDHzMLLNkdw4xJFkhmD0ib9JZPA6m49lTh4j8r

// Secret Key: T3lYbjqOUKmXRpB9tefQHyx4rHHhHhmZ20fjJgJC3nKYPoRxk8S5vi40IWxraFbv