import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources, SupportedLanguage } from './resources';

const LANGUAGE_KEY = 'app_language';

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
	try {
		const value = await AsyncStorage.getItem(LANGUAGE_KEY);
		return (value as SupportedLanguage) || null;
	} catch {
		return null;
	}
}

export async function setStoredLanguage(lang: SupportedLanguage): Promise<void> {
	await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export function detectDeviceLanguage(): SupportedLanguage {
	const device = Localization.getLocales()[0]?.languageCode || 'en';
	if (device.startsWith('az')) return 'az';
	if (device.startsWith('ru')) return 'ru';
	return 'en';
}

export async function initI18n(): Promise<void> {
	const stored = await getStoredLanguage();
	const fallback = detectDeviceLanguage();
	await i18n
		.use(initReactI18next)
		.init({
			resources,
			lng: stored || fallback,
			fallbackLng: 'en',
			compatibilityJSON: 'v3',
			interpolation: { escapeValue: false },
		});
}

export default i18n;