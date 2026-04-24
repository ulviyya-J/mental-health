import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox, StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

// ✅ Firebase servislərini import et (initializeApp firebaseService.ts-də baş verir)
import './src/services/firebaseService'; 

import ExpoNotificationService from './src/services/ExpoNotificationService';
import RootNavigator from './src/navigation/index';
import { initI18n } from './src/localization/i18n';

LogBox.ignoreLogs(['ViewPropTypes will be removed', 'VirtualizedLists should never be nested']);
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initI18n();
        ExpoNotificationService.setNavigationRef(navigationRef);
        await ExpoNotificationService.configure();
      } catch (e: any) {
        console.error("❌ Başlatma xətası:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepareApp();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B7A6E6" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
});