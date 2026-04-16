const functions = require('firebase-functions');
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyDMpkUSfcZqV29vUC_u9WZGLvWk8RA8FN4';
const POLLINATIONS_API_KEY = 'sk_JM7p1iNX23eac44NqJHKKhTgGRPqxJfI';

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  }, { timeout: 15000 });
  
  const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No response from Gemini');
  
  const cleanJson = rawText.replace(/```json|```json\s*/g, '').replace(/```\s*$/g, '').trim();
  return JSON.parse(cleanJson);
}

async function generateImage(prompt) {
  try {
    const shortPrompt = prompt.replace(/[^\w\s]/g, '').trim().split(' ').slice(0, 15).join(' ');
    const encodedPrompt = encodeURIComponent(shortPrompt);
    
    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=800&height=600&model=flux&key=${POLLINATIONS_API_KEY}`;
    const response = await axios.head(url, { timeout: 5000 });
    if (response.status === 200) return url;
    
    throw new Error('Pollinations.ai not available');
  } catch (error) {
    const fallbacks = [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rorschach_blot_01.jpg/800px-Rorschach_blot_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Rorschach_blot_02.jpg/800px-Rorschach_blot_02.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Rorschach_blot_03.jpg/800px-Rorschach_blot_03.jpg',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// ✅ YENİ: Sual sayına görə prompt yaradan funksiya
function getGeminiPrompt(lang, testType = 'projective_a', questionCount = 3) {
  const isSingleQuestion = questionCount === 1;
  
  if (isSingleQuestion) {
    // Tək suallıq test (sonrakı testlər üçün)
    return `You are a clinical psychologist. Create a SINGLE projective test question in ${lang}.

Test type: ${testType}
- If "projective_a": Rorschach-style inkblot image with 4 interpretations
- If "projective_b": Choice projection image (chairs, doors, paths) with 4 options
- If "imagination_slider": Vivid imagination scenario with 1-5 scale

Return ONLY valid JSON:
{
  "testTitle": "Title in ${lang}",
  "questions": [
    {
      "id": "q1",
      "type": "${testType === 'imagination_slider' ? 'imagination_slider' : 'projective_image'}",
      ${testType === 'imagination_slider' ? `
      "questionText": "A vivid imagination scenario question",
      "scaleMin": 1,
      "scaleMax": 5,
      "scaleLabels": ["No image", "Completely vivid"]
      ` : `
      "imagePrompt": "${testType === 'projective_a' ? 'abstract symmetrical inkblot, no figures, no faces' : 'three different chairs in a room, one by window, one in corner, one in center'}",
      "questionText": "${testType === 'projective_a' ? 'What do you see in this image?' : 'Which one would you choose?'}",
      "options": [
        {"text": "Option 1", "score": 5},
        {"text": "Option 2", "score": 4},
        {"text": "Option 3", "score": 3},
        {"text": "Option 4", "score": 2}
      ]
      `}
    }
  ]
}`;
  } else {
    // 3 suallıq test (ilkin qeydiyyat üçün)
    return `You are a clinical psychologist. Create a 3-question projective test in ${lang}.

QUESTION 1 - RORSCHACH STYLE:
- Image: abstract symmetrical inkblot, black and white, no humans, no animals, no objects.
- Question: "What do you see in this image?"
- Options: 4 interpretations with scores 1-5.

QUESTION 2 - CHOICE PROJECTION:
- Image: a scene with 3-4 distinct elements (chairs, doors, paths, rooms, windows, etc.)
- Question: "Which one would you choose?"
- Options: 4 options describing each element with scores 1-5.

QUESTION 3 - IMAGINATION:
- Create a vivid imagination scenario (different each time)
- Use button scale 1-5

Return ONLY valid JSON:
{
  "testTitle": "Title in ${lang}",
  "questions": [
    {
      "id": "q1",
      "type": "projective_image",
      "imagePrompt": "abstract symmetrical inkblot, no figures, no faces",
      "questionText": "What do you see in this image?",
      "options": [
        {"text": "Interpretation 1", "score": 5},
        {"text": "Interpretation 2", "score": 4},
        {"text": "Interpretation 3", "score": 3},
        {"text": "Interpretation 4", "score": 2}
      ]
    },
    {
      "id": "q2",
      "type": "choice_projective",
      "imagePrompt": "three different chairs in a room, one by window, one in corner, one in center",
      "questionText": "Which chair would you choose?",
      "options": [
        {"text": "Chair by the window", "score": 5},
        {"text": "Chair in the corner", "score": 4},
        {"text": "Chair in the center", "score": 3},
        {"text": "None, I would stand", "score": 2}
      ]
    },
    {
      "id": "q3",
      "type": "imagination_slider",
      "questionText": "Close your eyes. Imagine a peaceful beach at sunset. Gentle waves, warm sand, seagulls. How vivid?",
      "scaleMin": 1,
      "scaleMax": 5,
      "scaleLabels": ["No image", "Completely vivid"]
    }
  ]
}`;
  }
}

exports.getDynamicTest = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    // ✅ YENİ: Parametrləri oxu
    const body = req.body.data || req.body;
    const { 
      lang = 'English', 
      testType = 'projective_a', 
      questionCount = 3 
    } = body;
    
    console.log(`🎯 Creating test - Language: ${lang}, Type: ${testType}, Questions: ${questionCount}`);
    
    const geminiPrompt = getGeminiPrompt(lang, testType, questionCount);
    const testData = await callGemini(geminiPrompt);
    
    const questionsWithImages = await Promise.all(
      testData.questions.map(async (q) => {
        if (q.type === 'projective_image' || q.type === 'choice_projective') {
          const imageUrl = await generateImage(q.imagePrompt);
          return { ...q, imageUrl };
        }
        return q;
      })
    );
    
    testData.questions = questionsWithImages;
    console.log(`✅ Test created: ${testData.testTitle} (${testData.questions.length} questions)`);
    res.status(200).json({ success: true, data: testData });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});