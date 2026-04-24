import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "react-native-paper";
import { auth, getUserData } from "../services/firebaseService"; // ✅ Auth-u bizim servisdən götürürük
import { getAIResponse } from "../services/api";
import dayjs from "dayjs";

interface Props {
  onNavigateToChat: (initialMessage: string) => void;
  journalEntry?: string;
  userData?: any;
}

export default function AIIntroductionScreen({ onNavigateToChat, journalEntry, userData: initialUserData }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("User");
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const calculateAge = (birthDate: string) => birthDate ? dayjs().diff(dayjs(birthDate), 'year') : "Qeyd edilməyib";
  
  const getZodiacSign = (birthDate: string) => {
    if (!birthDate) return "Naməlum";
    const date = dayjs(birthDate);
    const month = date.month() + 1;
    const day = date.date();
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Dolça";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Balıqlar";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Qoç";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Buğa";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Əkizlər";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Xərçəng";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Şir";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Qız";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Tərəzi";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Əqrəb";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Oxatan";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Oğlaq";
    return "Naməlum";
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = auth().currentUser; // ✅ Native SDK sintaksisi
        if (!user) return;

        const userData = initialUserData || await getUserData(user.uid);
        if (!userData) return;

        if (userData.fullName) setName(userData.fullName);
        const age = calculateAge(userData.birthDate);
        const zodiac = getZodiacSign(userData.birthDate);
        const maritalStatus = userData.isMarried ? "Evli" : "Subay";
        const employmentStatus = userData.isEmployed ? `İşləyir (${userData.jobTitle})` : "İşləmir";
        
        const userProblem = userData.assessmentText || "İstifadəçi hələ konkret dərd qeyd etməyib.";

        const prompt = `
Sən dahi və empatiya qabiliyyəti yüksək olan bir psixoterapevtsən.

İSTİFADƏÇİNİN ƏSAS DƏRDİ (ASSESSMENT):
"${userProblem}"

PROFİL MƏLUMATLARI:
- Ad: ${userData.fullName}, Yaş: ${age}, Bürc xüsusiyyətləri: ${zodiac}
- Status: ${maritalStatus}, İş: ${employmentStatus}

GÜNDƏLİK QEYD (JOURNAL):
"${journalEntry || "Qeyd yoxdur."}"

TƏLİMATLAR:
1. Əgər istifadəçi yeni e-mail ilə gəlibsə, onu yeni dost kimi qarşıla ("Xoş gəldin"). Əgər əvvəldən varsa, "Yenidən xoş gördük" de.
2. Mütləq yuxarıda yazılan "ƏSAS DƏRD" hissəsinə toxun. Onu anladığını hiss etdir.
3. Səmimi və insani danış. Robot kimi "Data analiz edildi" demə.
4. Sonda onu chat-a dəvət edən bir sual ver.
`;

        const aiResponse = await getAIResponse(prompt);
        setInitialMessage(aiResponse);
      } catch (error) {
        console.error("AI Intro Error:", error);
        setInitialMessage("Salam! Səni dinləməyə hazıram.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [journalEntry]);

  const handleContinue = () => {
    onNavigateToChat(initialMessage);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B7A6E6" />
        <Text style={styles.loadingText}>Ruh halın analiz edilir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("ai_intro.title_with_name", { name })}</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.messageCard}>
          <Text style={styles.body}>{initialMessage}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button mode="contained" onPress={handleContinue} style={styles.button} contentStyle={{ height: 50 }} buttonColor="#B7A6E6">
          {t("ai_intro.acknowledge")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: "#f9f9f9" },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "#fff", alignItems: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: "center" },
  messageCard: { backgroundColor: "#fff", padding: 20, borderRadius: 15, elevation: 3 },
  body: { fontSize: 17, lineHeight: 26, color: "#444" },
  footer: { padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  button: { borderRadius: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 15, fontSize: 16, color: "#666" },
});