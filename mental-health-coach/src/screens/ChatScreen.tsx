import React, { useState, useEffect, useRef } from "react";
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
import firestore from '@react-native-firebase/firestore'; // ✅ FieldValue üçün birbaşa import
import { auth, db, getUserData } from "../services/firebaseService"; 
import { getAIResponse } from "../services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: any;
}

interface Props {
  initialMessage?: string;
}

export default function ChatScreen({ initialMessage }: Props) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const currentLanguage = i18n.language;

  // ✅ 1. 'this' əvəzinə useRef istifadə edirik
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = db()
      .collection("users")
      .doc(user.uid)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(loadedMessages);
      });

    const checkAndAddInitial = async () => {
      const msgs = await db().collection("users").doc(user.uid).collection("messages").get();
      if (initialMessage && msgs.empty) {
        await db().collection("users").doc(user.uid).collection("messages").add({
          text: initialMessage,
          sender: "ai",
          // ✅ 2. db.FieldValue əvəzinə firestore.FieldValue istifadə edirik
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      }
    };

    checkAndAddInitial();
    return () => unsubscribe();
  }, [initialMessage]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Xəta", "Daxil olmalısınız.");
      return;
    }

    const userText = inputText;
    setInputText("");

    try {
      const messagesRef = db().collection("users").doc(user.uid).collection("messages");
      
      await messagesRef.add({
        text: userText,
        sender: "user",
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      const userData = await getUserData(user.uid);
      const userProblem = userData?.assessmentText || "Məlumat yoxdur";

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

      const aiResponse = await getAIResponse(aiPrompt);
      await messagesRef.add({
        text: aiResponse,
        sender: "ai",
        timestamp: firestore.FieldValue.serverTimestamp(),
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
      <ScrollView 
        contentContainerStyle={styles.chatArea}
        // ✅ 3. Düzəldilmiş Ref və scroll məntiqi
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
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
        <Button 
          mode="contained" 
          onPress={handleSendMessage} 
          style={styles.sendButton}
          buttonColor="#B7A6E6"
        >
          {t("common.submit")}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
  chatArea: { flexGrow: 1, paddingVertical: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 5, borderRadius: 25, borderWidth: 1, borderColor: "#e0e0e0", marginBottom: Platform.OS === 'ios' ? 20 : 5 },
  input: { flex: 1, marginRight: 10, maxHeight: 120, paddingHorizontal: 15, paddingVertical: 10 },
  sendButton: { borderRadius: 20 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 18, marginBottom: 10 },
  userMessage: { backgroundColor: "#B7A6E6", alignSelf: "flex-end" },
  aiMessage: { backgroundColor: "#e0e0e0", alignSelf: "flex-start" },
  userMessageText: { color: "#fff" },
  aiMessageText: { color: "#000" },
});