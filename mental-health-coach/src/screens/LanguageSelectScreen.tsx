import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../localization/i18n';
import { setStoredLanguage, getStoredLanguage } from '../localization/i18n';
import type { SupportedLanguage } from '../localization/resources';

interface Props {
	onDone: () => void;
}

export default function LanguageSelectScreen({ onDone }: Props) {
	const { t } = useTranslation();

	const selectLanguage = async (lang: SupportedLanguage) => {
		await i18n.changeLanguage(lang);
		await setStoredLanguage(lang);
		onDone();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('lang.title')}</Text>
			<TouchableOpacity style={styles.button} onPress={() => selectLanguage('en')}>
				<Text style={styles.buttonText}>{t('lang.english')}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.button} onPress={() => selectLanguage('az')}>
				<Text style={styles.buttonText}>{t('lang.azerbaijani')}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.button} onPress={() => selectLanguage('ru')}>
				<Text style={styles.buttonText}>{t('lang.russian')}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
	title: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
	button: { backgroundColor: '#4F46E5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginVertical: 8, width: '80%' },
	buttonText: { color: 'white', textAlign: 'center', fontSize: 16 }
});