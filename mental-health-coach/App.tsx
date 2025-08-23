import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import RootNavigator from './src/navigation';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import { initI18n, getStoredLanguage } from './src/localization/i18n';

export default function App() {
	const [loading, setLoading] = useState(true);
	const [languageSet, setLanguageSet] = useState(false);

	useEffect(() => {
		(async () => {
			await initI18n();
			const lang = await getStoredLanguage();
			setLanguageSet(!!lang);
			setLoading(false);
		})();
	}, []);

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
				<StatusBar style="auto" />
			</View>
		);
	}

	if (!languageSet) {
		return (
			<>
				<LanguageSelectScreen onDone={() => setLanguageSet(true)} />
				<StatusBar style="auto" />
			</>
		);
	}

	return (
		<>
			<RootNavigator />
			<StatusBar style="auto" />
		</>
	);
}
