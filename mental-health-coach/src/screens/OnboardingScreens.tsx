import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  TextInput,
  Button,
  Modal,
  Portal,
  RadioButton,
  Card,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { registerUser, saveUserData } from "../services/firebaseService";
import ExpoNotificationService from "../services/ExpoNotificationService";

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#E2E8F0",
  placeholderGrey: "#A0AEC0",
  white: "#FFFFFF",
  background: "#F9FAFB",
};

export default function OnboardingScreens({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGenderModalVisible, setGenderModalVisible] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "", 
    birthDate: new Date(), 
    isMarried: false,
    isEmployed: false,
    jobTitle: "",
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange("birthDate", selectedDate);
    }
  };

  const validateAndSubmit = async () => {
    const { fullName, email, password, confirmPassword, gender, isEmployed, jobTitle, birthDate, isMarried } = formData;

    if (!fullName.trim()) return Alert.alert("Xəta", "Ad və Soyad qeyd edilməlidir.");
    if (!email.trim()) return Alert.alert("Xəta", "E-poçt ünvanı boş ola bilməz.");
    if (!password) return Alert.alert("Xəta", "Şifrə təyin edilməyib.");
    if (!gender) return Alert.alert("Xəta", "Cinsiyyətinizi seçməmisiniz.");
    if (isEmployed && !jobTitle.trim()) return Alert.alert("Xəta", "İşləyirsinizsə, vəzifənizi qeyd etməlisiniz.");

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return Alert.alert("Zəif Şifrə", "Şifrə ən azı 8 simvol, bir böyük hərf və bir rəqəmdən ibarət olmalıdır.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Xəta", "Şifrələr bir-biri ilə uyğun gəlmir.");
    }

    const age = dayjs().diff(dayjs(birthDate), 'year');
    if (age < 18) {
      return Alert.alert("Xəta", "Qeydiyyat üçün yaşınız 18-dən yuxarı olmalıdır.");
    }

    setLoading(true);
    try {
      const user = await registerUser(email, password);
      const userData = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        gender,
        birthDate: birthDate.toISOString(),
        isMarried,
        isEmployed,
        jobTitle: isEmployed ? jobTitle.trim() : "",
        createdAt: new Date().toISOString(),
        isFirstDualTestDone: false,
      };

      await saveUserData(user.uid, userData);
      const firstName = fullName.trim().split(" ")[0];

      // ✅ Düzəliş: Əgər bu funksiya xəta verirsə, adını ExpoNotificationService-də yoxla. 
      // Çox gümand ki, "scheduleRepeatingNotifications" və ya oxşar bir addadır.
      if (ExpoNotificationService.scheduleAllOnboardingNotifications) {
        await ExpoNotificationService.scheduleAllOnboardingNotifications(firstName);
      } else {
        console.warn("Notification funksiyası tapılmadı, standart servis çağırılır.");
        await ExpoNotificationService.scheduleRepeatingNotifications();
      }
      
      onDone();
    } catch (error: any) {
      let message = "Qeydiyyat zamanı xəta baş verdi.";
      if (error.code === "auth/email-already-in-use") message = "Bu e-poçt artıq qeydiyyatdan keçib.";
      Alert.alert("Xəta", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("register.title")}</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Card style={styles.card} mode="outlined">
              <Card.Content style={styles.cardPadding}>
                <TextInput 
                  label={t("onboarding.fullName")} 
                  value={formData.fullName} 
                  onChangeText={(v) => handleInputChange("fullName", v)} 
                  mode="outlined" 
                  style={styles.input} 
                  outlineColor={COLORS.lightGrey}
                  activeOutlineColor={COLORS.lavender}
                />
                <TextInput 
                  label={t("login.email")} 
                  value={formData.email} 
                  onChangeText={(v) => handleInputChange("email", v)} 
                  mode="outlined" 
                  style={styles.input} 
                  outlineColor={COLORS.lightGrey}
                  activeOutlineColor={COLORS.lavender}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput 
                  label={t("login.password")} 
                  value={formData.password} 
                  onChangeText={(v) => handleInputChange("password", v)} 
                  mode="outlined" 
                  style={styles.input} 
                  outlineColor={COLORS.lightGrey}
                  activeOutlineColor={COLORS.lavender}
                  secureTextEntry={secureText} 
                  // ✅ Düzəliş: color prop-u yoxlanıldı
                  right={<TextInput.Icon icon={secureText ? "eye" : "eye-off"} onPress={() => setSecureText(!secureText)} color={COLORS.mediumGrey}/>} 
                />
                <TextInput 
                  label={t("register.confirm_password")} 
                  value={formData.confirmPassword} 
                  onChangeText={(v) => handleInputChange("confirmPassword", v)} 
                  mode="outlined" 
                  style={styles.input} 
                  outlineColor={COLORS.lightGrey}
                  activeOutlineColor={COLORS.lavender}
                  secureTextEntry={secureTextConfirm} 
                  right={<TextInput.Icon icon={secureTextConfirm ? "eye" : "eye-off"} onPress={() => setSecureTextConfirm(!secureTextConfirm)} color={COLORS.mediumGrey}/>} 
                />
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content style={styles.cardPadding}>
                <View style={styles.row}>
                  <Text style={styles.label}>{t("onboarding.gender")}</Text>
                  <Button mode="text" onPress={() => setGenderModalVisible(true)} textColor={formData.gender ? COLORS.darkGrey : COLORS.placeholderGrey} compact>
                    {formData.gender ? t(`onboarding.gender_${formData.gender}`) : "Seçin"}
                  </Button>
                </View>
                <View style={[styles.row, { marginTop: 10 }]}>
                  <Text style={styles.label}>{t("onboarding.dob")}</Text>
                  <Button mode="text" onPress={() => setShowDatePicker(true)} textColor={COLORS.darkGrey} compact>
                    {dayjs(formData.birthDate).format("DD-MM-YYYY")}
                  </Button>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card} mode="outlined">
              <Card.Content style={styles.cardPadding}>
                <View style={styles.row}>
                  <Text style={styles.label}>{t("onboarding.isMarried")}</Text>
                  <Switch value={formData.isMarried} onValueChange={(v) => handleInputChange("isMarried", v)} trackColor={{ false: COLORS.lightGrey, true: COLORS.lavender }} />
                </View>
                <View style={[styles.row, { marginTop: 10 }]}>
                  <Text style={styles.label}>{t("onboarding.employed")}</Text>
                  <Switch value={formData.isEmployed} onValueChange={(v) => handleInputChange("isEmployed", v)} trackColor={{ false: COLORS.lightGrey, true: COLORS.lavender }} />
                </View>
                {formData.isEmployed && (
                  <TextInput 
                    label={t("onboarding.jobTitle")} 
                    value={formData.jobTitle} 
                    onChangeText={(v) => handleInputChange("jobTitle", v)} 
                    mode="outlined" 
                    style={[styles.input, { marginTop: 12 }]} 
                    outlineColor={COLORS.lightGrey}
                    activeOutlineColor={COLORS.lavender}
                  />
                )}
              </Card.Content>
            </Card>

            <Button 
              mode="contained" 
              onPress={validateAndSubmit} 
              loading={loading}
              disabled={loading}
              buttonColor={COLORS.lavender}
              style={styles.mainButton}
              contentStyle={{ height: 52 }}
              labelStyle={{ fontSize: 16, fontWeight: '700' }}
            >
              {loading ? "Gözləyin..." : t("onboarding.continue")}
            </Button>

            <Portal>
              <Modal visible={isGenderModalVisible} onDismiss={() => setGenderModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                <Text style={styles.modalTitle}>{t("onboarding.gender")}</Text>
                <RadioButton.Group onValueChange={(v) => { handleInputChange("gender", v); setGenderModalVisible(false); }} value={formData.gender}>
                  <RadioButton.Item label={t("onboarding.gender_female")} value="female" color={COLORS.lavender} />
                  <RadioButton.Item label={t("onboarding.gender_male")} value="male" color={COLORS.lavender} />
                  <RadioButton.Item label={t("onboarding.gender_other")} value="other" color={COLORS.lavender} />
                </RadioButton.Group>
              </Modal>
            </Portal>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.lavender },
  header: { height: 56, backgroundColor: COLORS.lavender, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: COLORS.white, borderColor: COLORS.lightGrey, borderWidth: 1, elevation: 0 },
  cardPadding: { paddingHorizontal: 12, paddingVertical: 12 },
  input: { marginBottom: 10, backgroundColor: COLORS.white, height: 50 },
  label: { fontSize: 15, fontWeight: "600", color: COLORS.darkGrey },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mainButton: { marginTop: 8, borderRadius: 12 },
  modalContainer: { backgroundColor: "white", padding: 20, margin: 30, borderRadius: 16 },
  modalTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
});