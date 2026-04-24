import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  useTheme,
  Surface,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import {
  auth,
  saveJournalNote,
  getUserData,
  startAISessionUpdate,
} from "../services/firebaseService";

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#DFE6E9",
  placeholderGrey: "#A0A0A0",
  white: "#FFFFFF",
  bg: "#F8F9FA"
};

interface Props {
  onStartSession: (noteText: string) => void;
}

export default function JournalScreen({ onStartSession }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [canStartSession, setCanStartSession] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [accumulatedNotes, setAccumulatedNotes] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchData = async () => {
    // ✅ Düzəliş: auth() funksiya kimi çağırıldı
    const user = auth().currentUser;
    if (user) {
      const data = await getUserData(user.uid);
      if (data?.fullName) {
        setUserName(data.fullName.split(" ")[0]);
      }
      setAccumulatedNotes(data?.dailyJournalAccumulator || "");
      if (data?.lastSessionTimestamp) {
        const lastSession = data.lastSessionTimestamp.toDate();
        const nextAvailableSession = lastSession.getTime() + 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (now < nextAvailableSession) {
          setCanStartSession(false);
          startTimer(nextAvailableSession);
        } else {
          setCanStartSession(true);
        }
      } else {
        setCanStartSession(true);
      }
    }
  };

  const startTimer = (targetTime: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      if (difference <= 0) {
        setCanStartSession(true);
        setTimeLeft("");
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      // ✅ Düzəliş: auth() funksiya kimi çağırıldı
      const user = auth().currentUser;
      if (user) {
        await saveJournalNote(user.uid, note.trim());
        setNote("");
        await fetchData();
        Alert.alert(t("journal.saved_title"), t("journal.saved_body"));
      }
    } catch (error) {
      Alert.alert(t("error"), t("journal.save_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!canStartSession) return;
    // ✅ Düzəliş: auth() funksiya kimi çağırıldı
    const user = auth().currentUser;
    if (user) {
      const fullContext = accumulatedNotes + (note ? "\n" + note : "");
      await startAISessionUpdate(user.uid);
      onStartSession(fullContext);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {t("journal.hello")}, {userName || t("journal.friend")}
          </Text>
          <Text style={styles.mainTitle}>{t("journal.how_are_you")}</Text>
        </View>

        <Card style={styles.noteCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardLabel}>{t("journal.daily_journal")}</Text>
            <TextInput
              placeholder={t("journal.input_placeholder")}
              placeholderTextColor={COLORS.placeholderGrey}
              value={note}
              onChangeText={setNote}
              multiline
              mode="flat"
              style={styles.input}
              activeUnderlineColor={COLORS.lavender}
              underlineColor="transparent"
              textColor={COLORS.darkGrey}
            />
            <Button
              mode="contained"
              onPress={handleSaveNote}
              loading={loading}
              disabled={loading || !note.trim()}
              style={styles.saveButton}
              buttonColor={COLORS.lavender}
              textColor={COLORS.white}
              labelStyle={{ fontWeight: '700' }}
            >
              {t("journal.save_to_journal")}
            </Button>
          </Card.Content>
        </Card>

        <Surface style={styles.sessionBox}>
          <View style={styles.sessionIconContainer}>
            <Text style={{ fontSize: 32 }}>🧠</Text>
          </View>
          <View style={styles.sessionTextContainer}>
            <Text style={styles.sessionTitle}>{t("journal.session_title")}</Text>
            <Text style={styles.sessionDesc}>
              {canStartSession
                ? t("journal.session_ready")
                : `${t("journal.next_session_in")}: ${timeLeft}`}
            </Text>
            <Button
              mode="contained"
              onPress={handleStartSession}
              disabled={!canStartSession}
              style={styles.sessionButton}
              buttonColor={canStartSession ? COLORS.lavender : COLORS.lightGrey}
              textColor={canStartSession ? COLORS.white : COLORS.mediumGrey}
              icon={canStartSession ? "chat-processing" : "timer-sand"}
              labelStyle={{ fontSize: 13 }}
            >
              {canStartSession ? t("journal.start_10min_session") : timeLeft}
            </Button>
          </View>
        </Surface>

        <Text style={styles.footerNote}>{t("journal.footer_info")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: COLORS.bg,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    fontWeight: "500",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkGrey,
    marginTop: 2,
  },
  noteCard: {
    borderRadius: 16,
    elevation: 0,
    backgroundColor: COLORS.white,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardContent: {
    paddingVertical: 15,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.lavender,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 15,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 2,
  },
  sessionBox: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  sessionIconContainer: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTextContainer: {
    flex: 3,
    paddingLeft: 10,
  },
  sessionTitle: {
    fontSize: 17,
    color: COLORS.darkGrey,
    fontWeight: "700",
  },
  sessionDesc: {
    fontSize: 13,
    color: COLORS.mediumGrey,
    marginBottom: 10,
    marginTop: 2,
  },
  sessionButton: {
    borderRadius: 10,
  },
  footerNote: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 11,
    color: COLORS.mediumGrey,
    opacity: 0.6,
    fontStyle: "italic",
    paddingBottom: 20,
  },
});