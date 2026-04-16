// screens/LoginScreen.tsx (DÜZƏLDİLMİŞ - LOGİNDƏ GÜNLÜK TEST VƏ MOTİVASİYA BİLDİRİŞLƏRİ)
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { TextInput, Button, Text, Snackbar } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { loginUser, resetPassword } from "../services/firebaseService";
import ExpoNotificationService from "../services/ExpoNotificationService";

interface Props {
  onLoginSuccess: (userData: any) => void;
  onNavigateToOnboarding: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToOnboarding }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  const COLORS = {
    lavender: "#B7A6E6", 
    darkGrey: "#2D3436",
    mediumGrey: "#718096",
    lightGrey: "#E2E8F0",
    white: "#FFFFFF"
  };

  const handleAuthAction = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage(t("login.empty_fields"));
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const user = await loginUser(trimmedEmail, trimmedPassword);
      
      // ✅ Giriş uğurlu olduqda:
      // 1. Günlük test bildirişlərini planlaşdır (1 gün fasilə ilə)
      // 2. Təkrarlanan motivasiya bildirişlərini planlaşdır (səhər/axşam)
      await ExpoNotificationService.scheduleRepeatingNotifications();
      
      onLoginSuccess(user);
    } catch (error: any) {
      console.log("Firebase Login Error:", error.code);
      if (error.code === "auth/invalid-credential") {
        setErrorMessage(t("login.wrong_password"));
      } else {
        setErrorMessage(t("login.login_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMessage(t("login.invalid_email"));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSnackbarMessage(t("login.reset_email_sent"));
      setShowSnackbar(true);
    } catch (error: any) {
      setSnackbarMessage(t("login.reset_password_failed"));
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: COLORS.darkGrey }]}>
        {t("login.welcome")}
      </Text>

      <TextInput
        label={t("login.email")}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrorMessage("");
        }}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        outlineColor={COLORS.lightGrey}
        activeOutlineColor={COLORS.lavender}
        textColor={COLORS.darkGrey}
      />

      <TextInput
        label={t("login.password")}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrorMessage("");
        }}
        mode="outlined"
        style={styles.input}
        secureTextEntry={secureText}
        outlineColor={COLORS.lightGrey}
        activeOutlineColor={COLORS.lavender}
        textColor={COLORS.darkGrey}
        right={
          <TextInput.Icon 
            icon={secureText ? "eye" : "eye-off"} 
            onPress={() => setSecureText(!secureText)} 
            iconColor={COLORS.mediumGrey}
          />
        }
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleAuthAction}
        loading={loading}
        disabled={loading}
        buttonColor={COLORS.lavender}
        style={styles.button}
        contentStyle={{ height: 56 }}
        labelStyle={styles.buttonLabel}
      >
        {t("login.login_button")}
      </Button>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={onNavigateToOnboarding} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: COLORS.mediumGrey }]}>
            {t("login.register_prompt")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePasswordReset} style={styles.linkMargin}>
          <Text style={[styles.secondaryLink, { color: COLORS.mediumGrey }]}>
            {t("login.forgot_password")}
          </Text>
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 30, backgroundColor: "#F9FAFB" },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center", marginBottom: 45, letterSpacing: -1 },
  input: { marginBottom: 16, backgroundColor: "#fff" },
  button: { marginTop: 20, borderRadius: 16, elevation: 0 },
  buttonLabel: { fontSize: 17, fontWeight: "700", letterSpacing: -0.5 },
  errorText: { color: "#E53E3E", textAlign: "center", marginVertical: 12, fontSize: 14, fontWeight: "500" },
  footerLinks: { marginTop: 40, alignItems: "center" },
  linkMargin: { marginTop: 18 },
  secondaryLink: { fontSize: 15, fontWeight: "500", textDecorationLine: "underline", letterSpacing: -0.2 },
  toggleButton: { padding: 10 },
  toggleText: { fontSize: 16, fontWeight: "600", letterSpacing: -0.4 },
  snackbar: { backgroundColor: "#2D3436", borderRadius: 10 }
});