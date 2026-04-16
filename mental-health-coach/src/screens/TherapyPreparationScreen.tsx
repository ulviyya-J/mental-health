import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card, TextInput, ProgressBar, IconButton } from "react-native-paper";
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#E2E8F0",
  white: "#FFFFFF",
  background: "#F9FAFB",
};

export default function TherapyPreparationScreen({ onBack, onNext }: any) {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const otherInputRef = useRef<any>(null);

  const [selectedPurpose, setSelectedPurpose] = useState<string>("");
  const [otherPurposeText, setOtherPurposeText] = useState<string>("");
  const [selectedExpectation, setSelectedExpectation] = useState<string>("");
  const [selectedChatStyle, setSelectedChatStyle] = useState<string>("");

  const handlePurposeSelect = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPurpose(id);

    if (id === "other") {
      setTimeout(() => {
        otherInputRef.current?.focus();
      }, 100);
    } else {
      Keyboard.dismiss();
    }
  };

  // ERROR VERMƏYƏN METOD:
  const handleInputFocus = () => {
    // Heç bir koordinat ölçmürük. 
    // "Digər" variantı seçiləndə ScrollView-u sabit 250 piksel aşağı çəkirik.
    // Bu rəqəm (250) "Digər" düyməsinin hündürlüyünə uyğundur.
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 250, animated: true });
    }, 300);
  };

  const isFormValid = !!(selectedPurpose && (selectedPurpose !== "other" || otherPurposeText.trim()) && selectedExpectation && selectedChatStyle);
  const progress = [selectedPurpose, selectedExpectation, selectedChatStyle].filter(Boolean).length / 3;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <IconButton icon={() => <Ionicons name="chevron-back" size={24} color={COLORS.white} />} onPress={onBack} />
          <Text style={styles.headerTitle}>{t("therapy_prep.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ProgressBar progress={progress} color={COLORS.lavender} style={styles.progressBar} />

      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // iOS-da klaviatura çıxanda özünü tənzimləməsi üçün
        automaticallyAdjustKeyboardInsets={true}
      >
        <Text style={styles.subtitle}>{t("therapy_prep.subtitle")}</Text>

        <Card style={styles.sectionCard} mode="outlined">
          <Card.Content style={styles.cardPadding}>
            <Text style={styles.sectionTitle}>1. {t("therapy_prep.purpose_section.title")}</Text>
            <View style={styles.listContainer}>
              {["stress", "relationships", "self_understanding", "decision", "daily_life", "other"].map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.listButton, selectedPurpose === id && styles.listButtonSelected]}
                  onPress={() => handlePurposeSelect(id)}
                >
                  <Text style={[styles.listText, selectedPurpose === id && styles.listTextSelected]}>
                    {t(`therapy_prep.purpose_section.${id}`)}
                  </Text>
                  {selectedPurpose === id && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                </TouchableOpacity>
              ))}
            </View>
            
            {selectedPurpose === "other" && (
              <TextInput 
                ref={otherInputRef}
                placeholder="Öz sözlərinizlə qeyd edin..."
                value={otherPurposeText}
                onChangeText={setOtherPurposeText}
                onFocus={handleInputFocus}
                mode="outlined"
                style={styles.otherInput}
                outlineColor={COLORS.lightGrey}
                activeOutlineColor={COLORS.lavender}
                dense
              />
            )}
          </Card.Content>
        </Card>

        {/* 2. Gözləntilər */}
        <Card style={styles.sectionCard} mode="outlined">
          <Card.Content style={styles.cardPadding}>
            <Text style={styles.sectionTitle}>2. {t("therapy_prep.expectation_section.title")}</Text>
            <View style={styles.listContainer}>
              {["listen", "advice", "understand", "solution"].map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.listButton, selectedExpectation === id && styles.listButtonSelected]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedExpectation(id);
                  }}
                >
                  <Text style={[styles.listText, selectedExpectation === id && styles.listTextSelected]}>
                    {t(`therapy_prep.expectation_section.${id}`)}
                  </Text>
                  {selectedExpectation === id && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 3. Danışıq Stili */}
        <Card style={styles.sectionCard} mode="outlined">
          <Card.Content style={styles.cardPadding}>
            <Text style={styles.sectionTitle}>3. {t("therapy_prep.chat_style_section.title")}</Text>
            {["professional", "friendly", "supportive"].map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.chatStyleButton, selectedChatStyle === id && styles.chatStyleButtonSelected]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedChatStyle(id);
                }}
              >
                <View style={styles.chatStyleHeader}>
                  <Text style={styles.chatStyleLabel}>{t(`therapy_prep.chat_style_section.${id}`)}</Text>
                </View>
                <Text style={styles.chatStyleDescription}>{t(`therapy_prep.chat_style_section.${id}_desc`)}</Text>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        <Card style={[styles.sectionCard, styles.tipsCard]} mode="flat">
          <Card.Content style={styles.cardPadding}>
            <Text style={styles.tipsTitle}>{t("therapy_prep.tips_section.title")}</Text>
            {["tip1", "tip2", "tip3", "tip4"].map((key) => (
              <Text key={key} style={styles.tipText}>• {t(`therapy_prep.tips_section.${key}`)}</Text>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <Button 
          mode="contained" 
          onPress={() => onNext({ purpose: selectedPurpose, expectation: selectedExpectation, chatStyle: selectedChatStyle, otherPurposeText })} 
          disabled={!isFormValid} 
          buttonColor={COLORS.lavender} 
          style={styles.continueButton} 
          contentStyle={{ height: 52 }}
        >
          {t("therapy_prep.continue_button")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.lavender },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  progressBar: { height: 4, backgroundColor: COLORS.lightGrey },
  scrollContent: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 20, color: COLORS.mediumGrey, lineHeight: 20 },
  sectionCard: { marginBottom: 16, borderRadius: 16, backgroundColor: COLORS.white, borderColor: COLORS.lightGrey, borderWidth: 1 },
  cardPadding: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16, color: COLORS.darkGrey },
  listContainer: { gap: 8 },
  listButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGrey },
  listButtonSelected: { backgroundColor: COLORS.lavender, borderColor: COLORS.lavender },
  listText: { fontSize: 14, fontWeight: "600", color: COLORS.darkGrey, flex: 1 },
  listTextSelected: { color: COLORS.white },
  otherInput: { marginTop: 12, backgroundColor: COLORS.white, height: 48 },
  chatStyleButton: { marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGrey },
  chatStyleButtonSelected: { borderColor: COLORS.lavender, backgroundColor: "#F9F8FF" },
  chatStyleHeader: { marginBottom: 4 },
  chatStyleLabel: { fontSize: 15, fontWeight: "700", color: COLORS.darkGrey },
  chatStyleDescription: { fontSize: 13, color: COLORS.mediumGrey, lineHeight: 18 },
  tipsCard: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", marginBottom: 20 },
  tipsTitle: { fontSize: 15, fontWeight: "700", color: "#B45309", marginBottom: 10 },
  tipText: { fontSize: 13, color: "#92400E", lineHeight: 18, marginBottom: 4 },
  submitButtonContainer: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGrey },
  continueButton: { borderRadius: 14 },
});