import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { auth, getNotifications, deleteNotification, markAllAsRead } from '../services/firebaseService';
import { notificationEventEmitter } from '../services/ExpoNotificationService';

// ✅ Düzəliş: Expo üçün düzgün ikon importu
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  lavender: '#B7A6E6',
  darkGrey: '#2D3436',
  mediumGrey: '#636E72',
  lightGrey: '#E2E8F0',
  white: '#FFFFFF',
};

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: any;
  read: boolean;
  screen?: string;
}

export default function NotificationHistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    // ✅ Düzəliş: auth() funksiya kimi çağırıldı
    const user = auth().currentUser;
    if (!user) {
      console.log("❌ Istifadəçi tapılmadı");
      return;
    }
    try {
      const data = await getNotifications(user.uid);
      console.log("📦 Yüklənən bildiriş sayı:", data.length);
      // ✅ Düzəliş: Sadəcə data ötürmək kifayətdir
      setNotifications(data as NotificationItem[]);
    } catch (error) {
      console.error("Bildirişlər yüklənərkən xəta:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  useEffect(() => {
    const handleNewNotification = () => {
      console.log("🔔 Yeni bildiriş event-i gəldi, yenilənir...");
      loadNotifications();
    };

    notificationEventEmitter.on('newNotification', handleNewNotification);

    return () => {
      notificationEventEmitter.off('newNotification', handleNewNotification);
    };
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm') || 'Sil',
      t('notifications.delete_confirm') || 'Bu bildirişi silmək istədiyinizə əminsiniz?',
      [
        { text: t('common.cancel') || 'Ləğv et', style: 'cancel' },
        {
          text: t('common.delete') || 'Sil',
          style: 'destructive',
          onPress: async () => {
            const user = auth().currentUser;
            if (user) {
              await deleteNotification(user.uid, id);
              loadNotifications();
            }
          },
        },
      ]
    );
  };

  const handlePress = (item: NotificationItem) => {
    if (item.screen === 'DynamicAITest') {
      navigation.navigate('DynamicAITest');
    } else {
      Alert.alert(item.title, item.body);
    }
  };

  const handleMarkAllRead = async () => {
    const user = auth().currentUser;
    if (user) {
      await markAllAsRead(user.uid);
      loadNotifications();
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <TouchableOpacity style={styles.notificationItem} onPress={() => handlePress(item)}>
        <View style={styles.notificationContent}>
          <View style={[styles.dot, item.read ? styles.readDot : styles.unreadDot]} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.date}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.mediumGrey} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllReadBtn}>
          <Text style={styles.markAllReadText}>Hamısını oxundu et</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.lightGrey} />
            <Text style={styles.emptyText}>{t('notifications.empty') || 'Bildiriş yoxdur'}</Text>
            <TouchableOpacity onPress={loadNotifications} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>Yenilə</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  notificationContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  unreadDot: { backgroundColor: COLORS.lavender },
  readDot: { backgroundColor: COLORS.lightGrey },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 4 },
  body: { fontSize: 14, color: COLORS.mediumGrey, marginBottom: 4 },
  date: { fontSize: 11, color: COLORS.lightGrey },
  deleteBtn: { padding: 8, marginLeft: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.mediumGrey },
  refreshBtn: { marginTop: 20, padding: 10, backgroundColor: COLORS.lavender, borderRadius: 8 },
  refreshText: { color: COLORS.white, fontWeight: '600' },
  markAllReadBtn: { padding: 12, alignItems: 'center', backgroundColor: COLORS.lightGrey, marginHorizontal: 16, marginTop: 10, borderRadius: 8 },
  markAllReadText: { color: COLORS.darkGrey, fontWeight: '600' },
});