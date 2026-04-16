// services/ExpoNotificationService.ts (TAM BÜTÖV - SON VERSİYA)
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import i18n from '../localization/i18n';
import { 
  auth, 
  addNotification, 
  getUnreadCount, 
  getLastTestDate, 
  getUserData 
} from './firebaseService';
import { TimezoneService } from './TimezoneService';
import { generateMotivationalMessage } from './generateMotivationalMessage';
import dayjs from 'dayjs';

class SimpleEventEmitter {
  private listeners: { [key: string]: (() => void)[] } = {};

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: () => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback());
  }
}

export const notificationEventEmitter = new SimpleEventEmitter();

let appState = 'active';
let lastSyncTime = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: appState !== 'active',
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// AppState listener - app ön plana keçəndə YALNIZ SON 5 DƏQİQƏDƏ GƏLƏN bildirişləri yaz
AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
  if (nextAppState === 'active' && appState !== 'active') {
    const user = auth.currentUser;
    if (user) {
      try {
        const delivered = await Notifications.getPresentedNotificationsAsync();
        
        if (delivered.length > 0) {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          let newCount = 0;
          
          for (const notif of delivered) {
            const notifDate = new Date(notif.date);
            
            // YALNIZ son 5 dəqiqədə gələn bildirişləri yaz
            if (notifDate > fiveMinutesAgo) {
              const data = notif.request.content.data;
              const title = notif.request.content.title || '';
              const body = notif.request.content.body || '';
              
              await addNotification(user.uid, {
                title,
                body,
                screen: data?.screen || null,
              });
              newCount++;
            }
          }
          
          if (newCount > 0) {
            await Notifications.dismissAllNotificationsAsync();
            
            const unreadCount = await getUnreadCount(user.uid);
            notificationEventEmitter.emit('badgeUpdate', unreadCount);
            notificationEventEmitter.emit('newNotification');
            
            console.log(`✅ Tray-dan ${newCount} yeni bildiriş Firestore-a yazıldı (${delivered.length - newCount} köhnə keçildi)`);
          }
        }
      } catch (error) {
        console.error('❌ Tray sinxronlaşdırma xətası:', error);
      }
    }
  }
  appState = nextAppState;
});

class ExpoNotificationService {
  private navigationRef: any = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  constructor() {
    this.configure();
    this.setupNotificationListeners();
  }

  setNavigationRef = (ref: any) => {
    this.navigationRef = ref;
  };

  configure = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  setupNotificationListeners = () => {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    
    this.notificationListener = Notifications.addNotificationReceivedListener(this.handleNotification);
    this.responseListener = Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  };

  handleNotification = async (notification: Notifications.Notification) => {
    let user = auth.currentUser;
    let attempts = 0;
    
    while (!user && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      user = auth.currentUser;
      attempts++;
    }
    
    if (!user) {
      console.warn('⚠️ Bildiriş yazıla bilmədi: istifadəçi tapılmadı');
      return;
    }

    const data = notification.request.content.data;
    const title = notification.request.content.title || '';
    const body = notification.request.content.body || '';

    console.log(`📨 Bildiriş gəldi (ön plan): ${title}`);

    await addNotification(user.uid, {
      title,
      body,
      screen: data?.screen || null,
    });

    const unreadCount = await getUnreadCount(user.uid);
    notificationEventEmitter.emit('badgeUpdate', unreadCount);
    notificationEventEmitter.emit('newNotification');
  };

  handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    console.log(`📨 Bildiriş klikləndi: ${response.notification.request.content.title}`);
    
    const screen = response.notification.request.content.data?.screen;
    if (screen && this.navigationRef?.isReady()) {
      setTimeout(() => {
        this.navigationRef.navigate(screen);
      }, 100);
    }
    
    notificationEventEmitter.emit('openNotifications');
  };

  scheduleNotification = async (
    titleKey: string, 
    message: string, 
    seconds: number, 
    screen?: string
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t(titleKey),
          body: message,
          sound: false,
          data: { screen: screen || null },
        },
        trigger: { seconds, repeats: false },
      });
      console.log(`✅ Bildiriş ${seconds} saniyəyə planlaşdırıldı: ${titleKey}`);
    } catch (error) {
      console.error('❌ Bildiriş planlaşdırma xətası:', error);
    }
  };

  scheduleNotificationAtDate = async (
    titleKey: string, 
    message: string, 
    date: Date, 
    screen?: string
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t(titleKey),
          body: message,
          sound: false,
          data: { screen: screen || null },
        },
        trigger: { date },
      });
      console.log(`✅ Bildiriş ${date.toLocaleString()} tarixinə planlaşdırıldı: ${titleKey}`);
    } catch (error) {
      console.error('❌ Bildiriş planlaşdırma xətası:', error);
    }
  };

  cancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Bütün planlaşdırılmış bildirişlər ləğv edildi');
  };

  scheduleWelcomeNotification = async (userName: string) => {
    const title = i18n.t('notifications.welcome_title', { name: userName });
    const body = i18n.t('notifications.welcome_body_static');
    await this.scheduleNotification(title, body, 1);
  };

  scheduleTeaserNotification = async () => {
    const title = i18n.t('notifications.teaser_title');
    const body = i18n.t('notifications.teaser_body');
    await this.scheduleNotification(title, body, 2 * 60);
  };

  scheduleInitialDoubleTest = async () => {
    const title = i18n.t('notifications.initial_test_title');
    const body = i18n.t('notifications.initial_test_body');
    await this.scheduleNotification(title, body, 3 * 60, 'DynamicAITest');
  };

  scheduleDailyMotivations = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const currentLang = i18n.language;
    
    const morningTime = TimezoneService.getRandomTimeBetween(9, 12);
    const morningDate = new Date();
    morningDate.setHours(morningTime.hour, morningTime.minute, 0, 0);
    if (morningDate <= new Date()) morningDate.setDate(morningDate.getDate() + 1);
    
    const morningMessage = await generateMotivationalMessage(currentLang);
    await this.scheduleNotificationAtDate(
      'notifications.morning_motivation_title',
      morningMessage,
      morningDate
    );

    const eveningTime = TimezoneService.getRandomTimeBetween(21, 24);
    const eveningDate = new Date();
    eveningDate.setHours(eveningTime.hour, eveningTime.minute, 0, 0);
    if (eveningDate <= new Date()) eveningDate.setDate(eveningDate.getDate() + 1);
    
    const eveningMessage = await generateMotivationalMessage(currentLang);
    await this.scheduleNotificationAtDate(
      'notifications.evening_motivation_title',
      eveningMessage,
      eveningDate
    );
  };

  scheduleDailyTestNotification = async (testDay: boolean) => {
    if (!testDay) return;
    
    const testDate = dayjs().add(3, 'minute').toDate();
    const title = i18n.t('notifications.daily_test_title');
    const body = i18n.t('notifications.daily_test_body');
    
    await this.scheduleNotificationAtDate(title, body, testDate, 'DynamicAITest');
    console.log(`🧪 TEST: Tək test ${testDate.toLocaleTimeString()} tarixinə planlaşdırıldı`);
  };

  scheduleAllOnboardingNotifications = async (userName: string) => {
    await this.cancelAll();
    
    await this.scheduleWelcomeNotification(userName);
    await this.scheduleTeaserNotification();
    await this.scheduleInitialDoubleTest();
    await this.scheduleDailyMotivations();
    
    console.log('✅ Qeydiyyat bildirişləri planlaşdırıldı');
  };

  scheduleRepeatingNotifications = async () => {
    await this.scheduleDailyMotivations();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const userData = await getUserData(user.uid);
    
    if (userData?.isFirstDualTestDone === false) {
      console.log('⏸️ İkili test hələ edilməyib, tək test planlaşdırılmır');
      return;
    }
    
    const lastTestDate = await getLastTestDate(user.uid);
    const now = dayjs();
    
    if (lastTestDate) {
      const minutesSinceLastTest = now.diff(dayjs(lastTestDate), 'minute');
      
      if (minutesSinceLastTest < 1) {
        console.log(`⏸️ Son test ${minutesSinceLastTest} dəqiqə əvvəl edilib. Test YOXDUR.`);
        return;
      }
    }
    
    console.log('✅ Test günüdür, 3 dəqiqə sonra planlaşdırılır');
    await this.scheduleDailyTestNotification(true);
  };
}

export default new ExpoNotificationService();