const functions = require('firebase-functions');
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyDMpkUSfcZqV29vUC_u9WZGLvWk8RA8FN4';

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  }, { timeout: 15000 });
  
  const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No response from Gemini');
  
  const cleanJson = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson);
}

function getGeminiPrompt(lang) {
  return `You are a clinical psychologist. Create a 3-question projective test in ${lang}.

QUESTION 1 - RORSCHACH STYLE (OPEN ANSWER):
- Image: abstract symmetrical inkblot, black and white, no humans, no animals, no objects.
- Question: "What do you see in this image? Describe what it looks like to you."
- NO OPTIONS - user writes free text answer.

QUESTION 2 - CHOICE PROJECTION:
- Image: a scene with 3-4 distinct elements (chairs, doors, paths, rooms, windows, etc.)
- Question: "Which one would you choose?"
- Options: 4 options describing each element with scores 1-5.

QUESTION 3 - IMAGINATION:
- Create a vivid imagination scenario (different each time)
- Use button scale 1-5

Return ONLY valid JSON. For Q1, set "options": null.

{
  "testTitle": "Title in ${lang}",
  "questions": [
    {
      "id": "q1",
      "type": "projective_image",
      "imagePrompt": "abstract symmetrical inkblot, no figures, no faces",
      "questionText": "What do you see in this image? Describe what it looks like to you.",
      "options": null
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

exports.getDynamicTest = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { lang = 'English' } = req.body.data || req.body;
    console.log('🚀 Creating test in:', lang);
    
    const geminiPrompt = getGeminiPrompt(lang);
    const testData = await callGemini(geminiPrompt);
    
    // Şəkillər app tərəfindən gələcək
    console.log('✅ Test created:', testData.testTitle);
    res.status(200).json({ success: true, data: testData });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});