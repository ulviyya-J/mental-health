import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button, Card, ProgressBar } from "react-native-paper";
import { saveTestResult, auth } from "../services/firebaseService"; // ✅ Auth-u bizim servisdən götürürük

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#E2E8F0",
  white: "#FFFFFF",
  background: "#F9FAFB",
};

export default function PsychologicalTestScreen({ onNavigateToAIResponseWaiting }: any) {
  const { t } = useTranslation();
  
  // ✅ Native SDK-da auth().currentUser şəklində istifadə edəcəyik
  const [answers, setAnswers] = useState<any[]>([]);

  const questions = t("test.questions", { returnObjects: true }) as any[];
  
  const options = [
    { key: "strongly_disagree", value: -2 },
    { key: "disagree", value: -1 },
    { key: "neutral", value: 0 },
    { key: "agree", value: 1 },
    { key: "strongly_agree", value: 2 },
  ];

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, value }];
    });
  };

  const progress = answers.length / questions.length;

  const handleSubmit = async () => {
    if (answers.length !== questions.length) {
      Alert.alert(t("test.alerts.incomplete_title"), t("test.alerts.incomplete_body"));
      return;
    }

    const score = answers.reduce((sum, current) => sum + current.value, 0);
    const user = auth().currentUser; // ✅ Native SDK sintaksisi

    if (user) {
      try {
        await saveTestResult(user.uid, {
          testName: t("test.title"),
          answers,
          createdAt: dayjs().toISOString(),
          score,
        });
        onNavigateToAIResponseWaiting();
      } catch (error) {
        console.error("Save test result error:", error);
        Alert.alert("Xəta", "Nəticə yadda saxlanılmadı");
      }
    } else {
      Alert.alert("Xəta", "İstifadəçi tapılmadı. Yenidən daxil olun.");
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("test.title")}</Text>
        </View>
      </SafeAreaView>

      <ProgressBar progress={progress} color={COLORS.lavender} style={styles.progressBar} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {questions.map((q, index) => {
          const selectedValue = answers.find((a) => a.questionId === q.id)?.value;
          return (
            <Card key={q.id} style={styles.questionCard} mode="outlined">
              <Card.Content>
                <Text style={styles.questionNumber}>{index + 1} / {questions.length}</Text>
                <Text style={styles.questionText}>{q.text}</Text>
                
                <View style={styles.optionsList}>
                  {options.map((opt) => {
                    const isSelected = selectedValue === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => handleAnswer(q.id, opt.value)}
                        activeOpacity={0.7}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected
                        ]}
                      >
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {t(`test.options.${opt.key}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          );
        })}

        <Button
          mode="contained"
          onPress={handleSubmit}
          buttonColor={COLORS.lavender}
          style={styles.submitButton}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontSize: 16, fontWeight: "700" }}
        >
          {t("test.submit")}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.lavender },
  header: { height: 60, backgroundColor: COLORS.lavender, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.white },
  progressBar: { height: 4, backgroundColor: COLORS.lightGrey },
  scrollContent: { padding: 16, paddingBottom: 40 },
  questionCard: { marginBottom: 16, borderRadius: 12, backgroundColor: COLORS.white, borderColor: COLORS.lightGrey, elevation: 0 },
  questionNumber: { fontSize: 12, color: COLORS.mediumGrey, fontWeight: "700", marginBottom: 4 },
  questionText: { fontSize: 16, fontWeight: "600", color: COLORS.darkGrey, marginBottom: 18, lineHeight: 22 },
  optionsList: { gap: 8 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.lightGrey, backgroundColor: COLORS.white },
  optionItemSelected: { borderColor: COLORS.lavender, backgroundColor: "#F8F7FF" },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.lightGrey, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioOuterSelected: { borderColor: COLORS.lavender },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.lavender },
  optionLabel: { fontSize: 14, color: COLORS.darkGrey, fontWeight: "500" },
  optionLabelSelected: { color: COLORS.lavender, fontWeight: "700" },
  submitButton: { marginTop: 10, borderRadius: 12, marginBottom: 20 },
});