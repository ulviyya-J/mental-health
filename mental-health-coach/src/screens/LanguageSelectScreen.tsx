import React, { useRef } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import i18n, { setStoredLanguage, } from "../localization/i18n";
import { resources } from "../localization/resources";
import type { SupportedLanguage } from "../localization/i18n";

interface Props {
  onDone: () => void;
}

const languageNames: Record<string, string> = {
  en: "English", az: "Azərbaycan", ru: "Русский", tr: "Türkçe", fr: "Français",
  de: "Deutsch", es: "Español", it: "Italiano", da: "Dansk", nl: "Nederlands",
  no: "Norsk", pt: "Português", sv: "Svenska", fi: "Suomi", pl: "Polski",
  cs: "Čeština", sk: "Slovenčina", hu: "Magyar", ro: "Română", bg: "Български",
  el: "Ελληνικά", sq: "Shqip", bs: "Bosanski", hr: "Hrvatski", sr: "Српски",
  sl: "Slovenščina", et: "Eesti", lv: "Latviešu", lt: "Lietuvių", mt: "Malti",
  is: "Íslenska", ga: "Gaeilge", cy: "Cymraeg", be: "Беларуская", uk: "Українська",
  mk: "Македонски", me: "Crnogorski", ka: "ქართული", hy: "Հայերեն"
};

export default function LanguageSelectScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const isProcessing = useRef(false);

  // Sığorta: resources undefined olarsa boş array qaytarsın
  const availableLanguages = resources ? (Object.keys(resources) as SupportedLanguage[]) : [];

  const selectLanguage = async (lang: SupportedLanguage) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      await i18n.changeLanguage(lang);
      await setStoredLanguage(lang);
      onDone();
    } catch (error) {
      console.error("Language selection error:", error);
      onDone();
    } finally {
      setTimeout(() => { isProcessing.current = false; }, 2000);
    }
  };

  const renderItem = ({ item }: { item: SupportedLanguage }) => (
    <TouchableOpacity 
      style={styles.langItem} 
      onPress={() => selectLanguage(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.langText}>{languageNames[item] || item.toUpperCase()}</Text>
      <Text style={styles.langCode}>{item.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  if (availableLanguages.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#B7A6E6" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Language</Text>
        <View style={styles.line} />
      </View>

      <FlatList
        data={availableLanguages}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  header: { paddingHorizontal: 30, marginTop: 60, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "300", color: "#1A1A1A", letterSpacing: 1, textTransform: "uppercase" },
  line: { height: 1, width: 40, backgroundColor: "#1A1A1A", marginTop: 10 },
  listContent: { paddingHorizontal: 30, paddingBottom: 40 },
  langItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 20, borderBottomWidth: 0.5, borderBottomColor: "#E0E0E0" },
  langText: { fontSize: 18, fontWeight: "400", color: "#333" },
  langCode: { fontSize: 12, fontWeight: "600", color: "#999", letterSpacing: 1 },
});