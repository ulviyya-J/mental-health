import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "react-native-paper";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { getAIResponse } from "../services/api";
import { getUserData } from "../services/firebaseService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface Props {
  initialMessage?: string;
}

export default function ChatScreen({ initialMessage }: Props) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const auth = getAuth();
  const db = getFirestore();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const setupChat = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = collection(db, "users", user.uid, "messages");
      const q = query(userDocRef, orderBy("timestamp"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        })) as Message[];
        setMessages(loadedMessages);
      });

      // İlk mesajı əlavə etmək (əgər hələ yoxdursa)
      if (initialMessage && messages.length === 0) {
        await addDoc(userDocRef, {
          text: initialMessage,
          sender: "ai",
          timestamp: new Date(),
        });
      }

      return () => unsubscribe();
    };

    setupChat();
  }, [initialMessage, auth, db]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Xəta", "Daxil olmalısınız.");
      return;
    }

    const userText = inputText;
    setInputText("");

    try {
      const messagesCollectionRef = collection(db, "users", user.uid, "messages");
      
      // 1. İstifadəçi mesajını yaz
      await addDoc(messagesCollectionRef, {
        text: userText,
        sender: "user",
        timestamp: new Date(),
      });

      // 2. İstifadəçinin əsas dərdi və profilini bazadan çək
      const userData = await getUserData(user.uid);
      const userProblem = userData?.assessmentText || "Məlumat yoxdur";

      // 3. AI üçün yaddaş (Context) promptu hazırla
      const conversationHistory = messages
        .slice(-5)
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n");

      const aiPrompt = `
İstifadəçinin dili: "${currentLanguage}"
İstifadəçinin əsas problemi: "${userProblem}"

Söhbət tarixi:
${conversationHistory}

İstifadəçinin son mesajı: ${userText}

TƏLİMAT: Sən dostcasına yanaşan bir psixoloqsan. Onun yuxarıdakı problemini bilərək cavab ver. Cavabını mütləq "${currentLanguage}" dilində yaz.
`;

      // 4. AI-dan cavab al və bazaya yaz
      const aiResponse = await getAIResponse(aiPrompt);
      await addDoc(messagesCollectionRef, {
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      });

    } catch (error) {
      console.error("Mesaj göndərmə xətası:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.chatArea}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={msg.sender === "user" ? styles.userMessageText : styles.aiMessageText}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t("chat.input_placeholder")}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Button mode="contained" onPress={handleSendMessage} style={styles.sendButton}>
          {t("common.submit")}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
  chatArea: { flexGrow: 1, justifyContent: "flex-end", paddingVertical: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 5, borderRadius: 25, borderWidth: 1, borderColor: "#e0e0e0" },
  input: { flex: 1, marginRight: 10, maxHeight: 120, paddingHorizontal: 15, paddingVertical: 10 },
  sendButton: { borderRadius: 20 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 18, marginBottom: 10 },
  userMessage: { backgroundColor: "#007bff", alignSelf: "flex-end" },
  aiMessage: { backgroundColor: "#e0e0e0", alignSelf: "flex-start" },
  userMessageText: { color: "#fff" },
  aiMessageText: { color: "#000" },
});