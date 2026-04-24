import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "react-native-paper";
import { auth, db, getUserData } from "../services/firebaseService"; // ✅ Yeni servisdən götürürük

interface Props {
  onNavigateToAIIntroduction: () => void;
}

export default function AIResponseWaitingScreen({ onNavigateToAIIntroduction }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth().currentUser; // ✅ Native SDK sintaksisi
        
        if (user) {
          // Servisdə yaratdığımız getUserData funksiyasını istifadə edirik
          const userData = await getUserData(user.uid);

          if (userData) {
            if (userData.fullName) {
              setName(userData.fullName);
            } else if (user.email) {
              setName(user.email.split('@')[0]);
            }
          }
        }
      } catch (error) {
        console.error("İstifadəçi məlumatlarını oxuyarkən xəta:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onNavigateToAIIntroduction();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onNavigateToAIIntroduction]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#B7A6E6" />
      <Text style={styles.title}>{t("ai_wait.title")}</Text>
      <Text style={styles.subtitle}>
        {t("ai_wait.subtitle_with_name", { name: name || "User" })}
      </Text>
      <Text style={styles.countdown}>
        {t("ai_wait.countdown_prefix")} {minutes}:
        {seconds < 10 ? `0${seconds}` : seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2D3436",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#636E72",
    marginBottom: 20,
  },
  countdown: { 
    fontSize: 18, 
    marginTop: 20, 
    fontWeight: "bold",
    color: "#B7A6E6" 
  },
});