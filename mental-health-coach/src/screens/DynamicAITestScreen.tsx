import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Button, Card, Divider, ProgressBar } from "react-native-paper";
import { getDynamicAITest, getAIAnalysis } from "../services/api";
import {
  saveTestResult,
  updateLastTestDate,
  getNextTestType,
  updateNextTestType,
  db,
  getUserData,
  auth,
} from "../services/firebaseService";
import { generateProjectiveImage } from "../services/pollinationsService";
import ExpoNotificationService from "../services/ExpoNotificationService";

const { width } = Dimensions.get("window");

const COLORS = {
  lavender: "#B7A6E6",
  darkGrey: "#2D3436",
  mediumGrey: "#636E72",
  lightGrey: "#E2E8F0",
  placeholderGrey: "#A0AEC0",
  white: "#FFFFFF",
  background: "#F9FAFB",
  cyan: "#00bcd4",
};

export default function DynamicAITestScreen({ navigation }: any) {
  const [testData, setTestData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [openAnswer, setOpenAnswer] = useState("");
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const uid = auth().currentUser?.uid;
        let questionCount = 3;
        let testType = undefined;
        if (uid) {
          const userData = await getUserData(uid);
          if (userData?.isFirstDualTestDone === true) {
            questionCount = 1;
            testType = userData?.nextTestType || "projective_a";
          }
        }
        const data = await getDynamicAITest(testType, questionCount);
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setTestData(data);
          const firstQ = data.questions[0];
          if (firstQ?.type === "projective_image" || firstQ?.type === "choice_projective") {
            setMediaLoading(true);
            const imageUrl = await generateProjectiveImage(firstQ.imagePrompt || "");
            setCurrentImageUrl(imageUrl);
            setMediaLoading(false);
          }
        } else {
          Alert.alert("Xəta", "Test məlumatları tapılmadı.", [{ text: "Oldu", onPress: () => navigation.goBack() }]);
        }
      } catch (err) {
        console.error("Test fetch error:", err);
        Alert.alert("Xəta", "Yüklənmə xətası.", [{ text: "Oldu", onPress: () => navigation.goBack() }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation]);

  const finalizeTest = async (uid: string, updatedAnswers: any[], resultAnalysis: string) => {
    try {
      await saveTestResult(uid, {
        testName: testData.testTitle,
        answers: updatedAnswers,
        analysis: resultAnalysis,
      });
      await updateLastTestDate(uid, new Date());
      await db().collection("users").doc(uid).update({ isFirstDualTestDone: true });
      
      const currentType = await getNextTestType(uid);
      let nextType: string;
      if (currentType === "projective_a") nextType = "projective_b";
      else if (currentType === "projective_b") nextType = "imagination_slider";
      else nextType = "projective_a";
      
      await updateNextTestType(uid, nextType);
      await ExpoNotificationService.scheduleRepeatingNotifications();
    } catch (error) {
      console.error("Finalize test error:", error);
    }
  };

  const goToNextQuestion = async (updatedAnswers: any[]) => {
    if (!testData) return;
    const nextIndex = currentStep + 1;
    setOpenAnswer("");
    setSliderValue(null);
    setSelectedChoice(null);

    if (nextIndex < testData.questions.length) {
      setUserAnswers(updatedAnswers);
      setCurrentStep(nextIndex);
      const nextQ = testData.questions[nextIndex];
      if (nextQ?.type === "projective_image" || nextQ?.type === "choice_projective") {
        setMediaLoading(true);
        const imageUrl = await generateProjectiveImage(nextQ.imagePrompt || "");
        setCurrentImageUrl(imageUrl);
        setMediaLoading(false);
      }
    } else {
      setAnalyzing(true);
      const uid = auth().currentUser?.uid;
      try {
        const resultAnalysis = await getAIAnalysis(updatedAnswers);
        setAnalysis(resultAnalysis);
        if (uid) await finalizeTest(uid, updatedAnswers, resultAnalysis);
      } catch {
        setAnalysis("Analiz hazırlarkən xəta oldu, amma cavablarınız qeydə alındı.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleAnswer = () => {
    if (!testData) return;
    const q = testData.questions[currentStep];
    let answerText = "";
    let score = 0;

    if (q.type === "projective_image") {
      if (!openAnswer.trim()) {
        Alert.alert("Xəbərdarlıq", "Zəhmət olmasa cavabınızı yazın.");
        return;
      }
      answerText = openAnswer;
    } else if (q.type === "imagination_slider") {
      if (sliderValue === null) {
        Alert.alert("Xəbərdarlıq", "Zəhmət olmasa seçim edin.");
        return;
      }
      answerText = `Vividness: ${sliderValue}/5`;
      score = sliderValue;
    }

    const updatedAnswers = [...userAnswers, { question: q.questionText, answer: answerText, score, type: q.type }];
    goToNextQuestion(updatedAnswers);
  };

  const handleChoiceAnswer = (option: any, index: number) => {
    setSelectedChoice(index);
    const currentQ = testData.questions[currentStep];
    const updatedAnswers = [...userAnswers, { question: currentQ.questionText, answer: option.text, score: option.score, type: currentQ.type }];
    setTimeout(() => goToNextQuestion(updatedAnswers), 250);
  };

  const onDone = () => {
    navigation.navigate("MainDrawer");
    setTimeout(() => {
      ExpoNotificationService.scheduleRepeatingNotifications();
    }, 10000);
  };

  const progress = testData ? (currentStep + 1) / testData.questions.length : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.lavender} />
        <Text style={styles.loadingText}>Sənin üçün özəl test hazırlanır...</Text>
      </View>
    );
  }

  if (analysis) {
    return (
      <View style={styles.screenContainer}>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Analiziniz Hazırdır ✨</Text>
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.analysisCard} mode="outlined">
            <Card.Content>
              <Text style={styles.analysisText}>{analysis}</Text>
              <Divider style={{ marginVertical: 20 }} />
              <Text style={styles.quote}>“Hər addım daxili dünyana açılan bir qapıdır.”</Text>
              <Button mode="contained" onPress={onDone} buttonColor={COLORS.lavender} style={styles.doneBtn} labelStyle={{ fontSize: 16, fontWeight: "700" }}>
                Gündəliyə Davam Et
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (analyzing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Cavablarınız analiz edilir...</Text>
      </View>
    );
  }

  const q = testData.questions[currentStep];

  const renderQuestion = () => {
    if (q.type === "choice_projective") {
      return (
        <>
          <View style={styles.imageContainer}>
            {mediaLoading ? <ActivityIndicator color={COLORS.lavender} /> : <Image source={{ uri: currentImageUrl }} style={styles.media} />}
          </View>
          <Text style={styles.question}>{q.questionText}</Text>
          <View style={styles.optionsList}>
            {q.options?.map((opt: any, idx: number) => {
              const isSelected = selectedChoice === idx;
              return (
                <TouchableOpacity key={idx} onPress={() => handleChoiceAnswer(opt, idx)} style={[styles.optionItem, isSelected && styles.optionItemSelected]}>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      );
    }
    if (q.type === "projective_image") {
      return (
        <>
          <View style={styles.imageContainer}>
            {mediaLoading ? <ActivityIndicator color={COLORS.lavender} /> : <Image source={{ uri: currentImageUrl }} style={styles.media} />}
          </View>
          <Text style={styles.question}>{q.questionText}</Text>
          <TextInput style={styles.textInput} placeholder="Cavabınızı yazın..." placeholderTextColor={COLORS.placeholderGrey} value={openAnswer} onChangeText={setOpenAnswer} multiline />
          <Button mode="contained" onPress={handleAnswer} buttonColor={COLORS.lavender} style={styles.submitBtn} disabled={!openAnswer.trim()}>Davam Et</Button>
        </>
      );
    }
    if (q.type === "imagination_slider") {
      const imaginationOptions = [
        { text: "1 - Heç bir təsəvvür yoxdur", value: 1 },
        { text: "2 - Çox zəif təsəvvür", value: 2 },
        { text: "3 - Orta səviyyədə canlı", value: 3 },
        { text: "4 - Çox canlı təsəvvür", value: 4 },
        { text: "5 - Tam real kimi canlı", value: 5 },
      ];
      return (
        <>
          <Text style={styles.question}>{q.questionText}</Text>
          <View style={styles.optionsList}>
            {imaginationOptions.map((opt) => {
              const isSelected = sliderValue === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setSliderValue(opt.value)} style={[styles.optionItem, isSelected && styles.optionItemSelected]}>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button mode="contained" onPress={handleAnswer} buttonColor={COLORS.lavender} style={styles.submitBtn} disabled={sliderValue === null}>Davam Et</Button>
        </>
      );
    }
    return null;
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}><Text style={styles.headerTitle}>{testData?.testTitle || "Test"}</Text></View>
      </SafeAreaView>
      <ProgressBar progress={progress} color={COLORS.lavender} style={styles.progressBar} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepText}>Sual {currentStep + 1} / {testData?.questions.length || 0}</Text>
        <Card style={styles.card} mode="outlined"><Card.Content>{renderQuestion()}</Card.Content></Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.lavender },
  header: { height: 60, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.white },
  progressBar: { height: 4, backgroundColor: COLORS.lightGrey },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontSize: 16, color: COLORS.lavender },
  stepText: { fontSize: 14, color: COLORS.mediumGrey, marginBottom: 8 },
  card: { borderRadius: 12, borderColor: COLORS.lightGrey, borderWidth: 1, backgroundColor: COLORS.white },
  imageContainer: { width: "100%", height: 280, justifyContent: "center", alignItems: "center", marginBottom: 16, borderRadius: 8, backgroundColor: COLORS.lightGrey, overflow: 'hidden' },
  media: { width: "100%", height: "100%", resizeMode: "cover" },
  question: { fontSize: 16, fontWeight: "600", marginBottom: 20 },
  textInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGrey, borderRadius: 10, padding: 14, fontSize: 15, minHeight: 100 },
  optionsList: { gap: 8 },
  optionItem: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.lightGrey, borderRadius: 10, padding: 12 },
  optionItemSelected: { borderColor: COLORS.lavender, backgroundColor: "#F8F7FF" },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.lightGrey, justifyContent: "center", alignItems: "center", marginRight: 12 },
  radioOuterSelected: { borderColor: COLORS.lavender },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.lavender },
  optionLabel: { color: COLORS.darkGrey, fontSize: 14 },
  optionLabelSelected: { color: COLORS.lavender, fontWeight: "600" },
  submitBtn: { marginTop: 20, borderRadius: 10 },
  analysisCard: { borderRadius: 12, borderColor: COLORS.lightGrey, borderWidth: 1, backgroundColor: COLORS.white, marginTop: 8 },
  analysisText: { fontSize: 16, lineHeight: 24, color: COLORS.darkGrey },
  quote: { fontStyle: "italic", textAlign: "center", color: COLORS.mediumGrey },
  doneBtn: { marginTop: 25, borderRadius: 12 },
});