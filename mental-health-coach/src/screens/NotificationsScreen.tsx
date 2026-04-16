import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "app_notifications";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  screen?: string;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) setNotifications(JSON.parse(stored));
  };

  const handlePress = (item: NotificationItem) => {
    if (item.screen === "DynamicAITest") {
      Alert.alert("Test", "Dinamik testə yönləndirilirsiniz...");
    } else {
      Alert.alert(item.title, item.body);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t("notifications.no_notifications") || "Bildiriş yoxdur"}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 16, fontWeight: "bold" },
  body: { fontSize: 14, color: "#555", marginTop: 5 },
  date: { fontSize: 12, color: "#999", marginTop: 5 },
  empty: { textAlign: "center", marginTop: 50, color: "#999" },
});