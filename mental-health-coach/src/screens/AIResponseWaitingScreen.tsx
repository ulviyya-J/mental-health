import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "react-native-paper";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const db = getFirestore();
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
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
      <ActivityIndicator size="large" />
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "gray",
    marginBottom: 20,
  },
  countdown: { fontSize: 18, marginTop: 20, fontWeight: "bold" },
});