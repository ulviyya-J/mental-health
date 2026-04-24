import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources } from './resources'; // Resursları kənardan alırıq

const LANGUAGE_KEY = 'app_language';

// 🔥 ÇOX VACİB: i18next-i React-lə dərhal bağlayırıq
i18n.use(initReactI18next);

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

export async function setStoredLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (e) { console.error("Dil dəyişmə xətası:", e); }
}

export function detectDeviceLanguage(): SupportedLanguage {
  const deviceCode = Localization.getLocales()[0]?.languageCode || 'en';
  return Object.keys(resources).includes(deviceCode) ? (deviceCode as SupportedLanguage) : 'en';
}

export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) return;

  const stored = await getStoredLanguage();
  const fallback = detectDeviceLanguage();
  const activeLanguage = stored || fallback;
  
  await i18n.init({
    resources,
    lng: activeLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
    react: { 
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
    }
  });
}

export default i18n;
// API Key: rvmNyVLgcAqg8zCGl6gf8bgLOflDHzMLLNkdw4xJFkhmD0ib9JZPA6m49lTh4j8r

// Secret Key: T3lYbjqOUKmXRpB9tefQHyx4rHHhHhmZ20fjJgJC3nKYPoRxk8S5vi40IWxraFbv