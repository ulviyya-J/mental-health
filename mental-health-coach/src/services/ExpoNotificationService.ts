import messaging from '@react-native-firebase/messaging';
import { auth, addNotification, getUnreadCount } from './firebaseService';

class SimpleEventEmitter {
  private listeners: { [key: string]: ((data?: any) => void)[] } = {};
  on(event: string, callback: (data?: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  off(event: string, callback: (data?: any) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const notificationEventEmitter = new SimpleEventEmitter();

class ExpoNotificationService {
  private navigationRef: any = null;
  private isInitialized: boolean = false;

  setNavigationRef = (ref: any) => {
    this.navigationRef = ref;
  };

  configure = async () => {
    if (this.isInitialized) return;
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        this.setupNotificationListeners();
        await this.getFcmToken();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('❌ Notification configure error:', error);
    }
  };

  getFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log("FCM Token:", token);
    } catch (error) {
      console.error('❌ Token error:', error);
    }
  };

  // ✅ BU METODU ƏLAVƏ EDİRİK Kİ ROOTNAVIGATOR-DA XƏTA VERMƏSİN
  scheduleRepeatingNotifications = async () => {
    try {
      // Hələlik içi boş qala bilər, əsas odur ki, çağırılanda xəta verməsin
      console.log("⏰ Planlı bildirişlər sistemi aktivdir (Boş)");
    } catch (error) {
      console.error('❌ Schedule error:', error);
    }
  };

  setupNotificationListeners = () => {
    messaging().onMessage(async remoteMessage => {
      const userAuth = auth();
      if (userAuth.currentUser) {
        const title = remoteMessage.notification?.title || '';
        const body = remoteMessage.notification?.body || '';
        const screen = (remoteMessage.data?.screen as string) || null;
        await addNotification(userAuth.currentUser.uid, { title, body, screen });
        const unreadCount = await getUnreadCount(userAuth.currentUser.uid);
        notificationEventEmitter.emit('badgeUpdate', unreadCount);
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      this.handleNavigation(remoteMessage.data?.screen);
    });
  };

  private handleNavigation = (screen: any) => {
    if (screen && this.navigationRef?.isReady()) {
      setTimeout(() => this.navigationRef.navigate(screen), 500);
      notificationEventEmitter.emit('openNotifications');
    }
  };
}

export default new ExpoNotificationService();