import { getAIResponse } from './api';

export const generateTripleMotivation = async (currentLang: string = 'az'): Promise<string[]> => {
    try {
        const targetLanguage = currentLang === 'az' ? 'Azerbaijani' : currentLang === 'ru' ? 'Russian' : 'English';
        
        // AI-ya 3 cümləni birdən istəyirik
        const prompt = `Act as a supportive coach. Write 3 different, very short, unique and positive motivational sentences in ${targetLanguage}. 
                        Separate each sentence with exactly "###". 
                        Maximum 100 characters per sentence. No quotes. No numbers.`;

        console.log(`🤖 AI Requesting Triple Motivation in ${targetLanguage}...`);
        const response = await getAIResponse(prompt);
        
        if (!response || response.includes("429") || response.includes("error")) {
             // Limit olsa belə əllə yazılmış 3 dənə fərqli mesaj qaytarırıq ki, boş qalmasın
             return currentLang === 'az' 
                ? ["Bu gün yeni bir başlanğıcdır.", "Özünə inam hər şeydir.", "Hər şey gözəl olacaq."]
                : ["Today is a new beginning.", "Confidence is everything.", "Everything will be fine."];
        }

        // Gələn mətni "###" işarəsinə görə bölüb massiv (array) edirik
        const messages = response.split('###').map(s => s.trim().replace(/["']/g, ''));
        
        // Əgər AI nəsə səhv edib 3 dənə qaytarmasa, qalanını doldururuq
        while (messages.length < 3) {
            messages.push(currentLang === 'az' ? "Günün uğurlu keçsin!" : "Have a great day!");
        }

        return messages;

    } catch (error) {
        console.log('❌ AI Triple Error:', error);
        return ["Uğurlar səninlədir.", "Günün xoş keçsin.", "Gözəl nəticələr səni gözləyir."];
    }
};