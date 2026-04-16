import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import RootNavigator from './src/navigation';
import { initI18n } from './src/localization/i18n';
import ExpoNotificationService from './src/services/ExpoNotificationService';

LogBox.ignoreLogs(['ViewPropTypes will be removed from React Native']);

// ✅ Navigation Ref - bildirişdən naviqasiya üçün
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        
        // ✅ Navigation ref-i ExpoNotificationService-ə ötür (Require Cycle-i qırır)
        ExpoNotificationService.setNavigationRef(navigationRef);
        
        await ExpoNotificationService.configure();
        setLoading(false);
      } catch (error) {
        console.error('App start error:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});