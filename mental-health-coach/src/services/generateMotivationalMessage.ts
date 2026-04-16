// services/generateMotivationalMessage.ts
import { getAIResponse } from './api';

/**
 * AI ilə tək bir motivasiya mesajı yaradır
 * @param currentLang - İstifadəçinin aktiv dili ('az', 'en', 'ru' və s.)
 * @returns Tək bir motivasiya mesajı (string)
 */
export const generateMotivationalMessage = async (currentLang: string = 'az'): Promise<string> => {
    try {
        const targetLanguage = currentLang === 'az' ? 'Azerbaijani' : currentLang === 'ru' ? 'Russian' : 'English';
        
        // AI-ya tək bir cümlə istəyirik (bildiriş üçün)
        const prompt = `Act as a supportive coach. Write a single, very short, unique and positive motivational sentence in ${targetLanguage}. 
                        Maximum 100 characters. No quotes. No numbers. No emojis. Just the sentence.`;

        console.log(`🤖 AI Requesting Motivational Message in ${targetLanguage}...`);
        const response = await getAIResponse(prompt);
        
        if (!response || response.includes("429") || response.includes("error")) {
            // Limit olsa belə əllə yazılmış mesaj qaytarırıq
            return currentLang === 'az' 
                ? "Bu gün yeni bir başlanğıcdır."
                : "Today is a new beginning.";
        }

        // Cavabı təmizləyirik
        let message = response.trim().replace(/["']/g, '');
        
        // Maksimum 100 simvol
        if (message.length > 100) {
            message = message.substring(0, 97) + '...';
        }
        
        return message;
    } catch (error) {
        console.log('❌ AI Motivational Message Error:', error);
        return currentLang === 'az' 
            ? "Uğurlar səninlədir."
            : "Good luck with you.";
    }
};