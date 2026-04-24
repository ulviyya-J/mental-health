import { registerRootComponent } from 'expo';
import firebase from '@react-native-firebase/app';
import App from './App';

// ✅ Native Firebase-də initializeApp() daxilinə heç nə yazmağa ehtiyac yoxdur.
// ✅ O, konfiqurasiyanı avtomatik olaraq native fayllardan (json/plist) götürür.
if (!firebase.apps.length) {
  try {
    firebase.initializeApp({}); 
    console.log("✅ Firebase index.ts-də uğurla başladıldı");
  } catch (error) {
    console.error("❌ Firebase başlatma xətası:", error);
  }
}

registerRootComponent(App);