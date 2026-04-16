// services/api.ts (DÜZƏLDİLMİŞ - questionCount PARAMETRİ ƏLAVƏ EDİLDİ)
import i18n from 'i18next';

const API_KEY = "AIzaSyCwlac1KPIU4G_P3EKfFa7jdvWX9N2zFr4"; 
const FUNCTIONS_URL = 'https://getdynamictest-ofwp3o4e2q-uc.a.run.app';
const GEMINI_MODEL = "gemini-2.5-flash";

export const getAIResponse = async (prompt: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
  const currentLang = i18n.language || 'en';
  const dynamicPrompt = `User language: ${currentLang}. Respond strictly in this language. Prompt: ${prompt}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: dynamicPrompt }] }] }),
    });
    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return "error_limit";
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  } catch (error) {
    console.error("AI Fetch Error:", error);
    return "Error occurred.";
  }
};

export const getDynamicAITest = async (testType?: string, questionCount: number = 3) => {
  const currentLang = i18n.language || 'en';
  const langName = currentLang === 'az' ? 'Azerbaijani' : currentLang === 'ru' ? 'Russian' : 'English';
  
  try {
    console.log(`🚀 Calling Cloud Function... (questions: ${questionCount}, type: ${testType || 'default'})`);
    
    const response = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lang: langName,
        testType: testType || 'projective_a',
        questionCount: questionCount
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test created:', result.data.testTitle, 'Questions:', result.data.questions?.length);
      return result.data;
    } else {
      console.error('❌ Function error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
};

export const getAIAnalysis = async (userAnswers: any[], imagePrompts?: string[]): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
  const currentLang = i18n.language || 'en';
  const langName = currentLang === 'az' ? 'Azerbaijani' : currentLang === 'ru' ? 'Russian' : 'English';

  const answersSummary = userAnswers.map((a, idx) => {
    const imageInfo = imagePrompts?.[idx] ? `\n[Şəkil: ${imagePrompts[idx]}]` : '';
    return `Q${idx+1}: ${a.question}\nCavab: ${a.answer}${imageInfo}`;
  }).join("\n\n");
  
  const prompt = `You are a clinical psychologist with a PhD. Analyze these projective test answers and provide a professional, insightful conclusion in ${langName}.

Guidelines:
- Be empathetic but professional
- Interpret based on projective psychology principles
- Provide 2-3 specific observations based on the answers
- End with a constructive recommendation or affirmation
- Maximum 150 words

Test Answers:
${answersSummary}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analiz hazırlanarkən bir xəta baş verdi.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Analiz mümkün olmadı. Zəhmət olmasa, yenidən cəhd edin.";
  }
};