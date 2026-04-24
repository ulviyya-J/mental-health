import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useTranslation } from "react-i18next";
import { TextInput, Button, IconButton } from "react-native-paper";
import { Ionicons } from '@expo/vector-icons';

// ✅ Düzəliş: auth-u birbaşa buradan götürürük, getAuth-a ehtiyac yoxdur
import { auth, saveAssessmentText } from "../services/firebaseService";

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#718096",
  lightGrey: "#E2E8F0",
  white: "#FFFFFF",
  background: "#F9FAFB",
};

export default function AssessmentScreen({ onBack, onNavigateToPsychologicalTest }: any) {
  const { t } = useTranslation();
  const [assessmentText, setAssessmentText] = useState("");

  const handleSubmit = async () => {
    if (assessmentText.trim().length < 10) {
      Alert.alert("Diqqət", "Zəhmət olmasa bir az daha ətraflı yazın.");
      return;
    }

    // ✅ Düzəliş: Import etdiyimiz auth-dan istifadə edirik
    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Xəta", "İstifadəçi tapılmadı. Yenidən daxil olun.");
      return;
    }

    try {
      await saveAssessmentText(user.uid, assessmentText);
      onNavigateToPsychologicalTest();
    } catch (error) {
      console.error("Save assessment error:", error);
      Alert.alert("Xəta", "Məlumat saxlanılmadı.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <IconButton 
              icon={() => <Ionicons name="chevron-back" size={24} color={COLORS.white} />} 
              onPress={onBack} 
            />
            <Text style={styles.headerTitle}>{t("assessment.header_title")}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          bounces={false}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t("assessment.title")}</Text>
            <Text style={styles.subtitle}>{t("assessment.subtitle")}</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder={t("assessment.placeholder")}
            multiline={true}
            mode="outlined"
            value={assessmentText}
            onChangeText={setAssessmentText}
            outlineColor={COLORS.lightGrey}
            activeOutlineColor={COLORS.lavender}
            textColor={COLORS.darkGrey}
            placeholderTextColor="#A0AEC0"
            scrollEnabled={true} 
            contentStyle={styles.inputContent} 
          />
        </ScrollView>

        <SafeAreaView style={styles.bottomActionArea}>
          <View style={styles.buttonWrapper}>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              disabled={assessmentText.trim().length === 0}
              buttonColor={COLORS.lavender}
              style={styles.submitButton}
              contentStyle={{ height: 56 }}
              labelStyle={styles.buttonLabel}
            >
              {t("assessment.submit")}
            </Button>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  headerSafe: { 
    backgroundColor: COLORS.lavender 
  },
  header: { 
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 8 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.white,
    letterSpacing: -0.4 
  },
  scrollContent: { 
    paddingHorizontal: 28, 
    paddingTop: 36, 
    paddingBottom: 40 
  },
  textContainer: { 
    marginBottom: 32 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1A202C", 
    marginBottom: 10,
    letterSpacing: -0.6, 
    lineHeight: 32,
  },
  subtitle: { 
    fontSize: 15, 
    color: COLORS.mediumGrey, 
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: "400",
  },
  input: { 
    height: 260, 
    backgroundColor: COLORS.white, 
    fontSize: 17,
    letterSpacing: -0.2,
    borderRadius: 16, 
  },
  inputContent: { 
    paddingTop: 16, 
    paddingHorizontal: 12,
    lineHeight: 26 
  },
  bottomActionArea: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  buttonWrapper: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32, 
  },
  submitButton: {
    borderRadius: 28, 
    elevation: 0,
  },
  buttonLabel: { 
    fontSize: 17, 
    fontWeight: "700",
    letterSpacing: -0.4,
  },
});