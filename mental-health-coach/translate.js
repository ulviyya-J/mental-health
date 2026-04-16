const translate = require('google-translate-api-next');
const fs = require('fs-extra');
const path = require('path');

/**
 * Tərcümə ediləcək hədəf dillər (ISO kodları)
 * Siyahını ehtiyacına görə artıra və ya azalda bilərsən.
 */
const targetLanguages = [
  'az', 'tr', 'ru', 'fr', 'de', 'es', 'it', 'pt', 'nl', 
  'sv', 'no', 'da', 'fi', 'pl', 'cs', 'sk', 'hu', 'ro', 
  'bg', 'el', 'sq', 'bs', 'hr', 'sr', 'sl', 'et', 'lv', 
  'lt', 'mt', 'is', 'ga', 'cy', 'be', 'uk', 'mk', 'me', 
  'ka', 'hy'
];

// Fayl yolları (Path)
const sourceFile = path.join(__dirname, './src/localization/locales/en.json');
const outputDir = path.join(__dirname, './src/localization/locales/');

/**
 * Obyekt daxilindəki bütün mətnləri rekursiv olaraq tərcümə edən funksiya
 */
async function translateObject(obj, targetLang) {
    const newObj = {};
    
    for (const key in obj) {
        // Əgər dəyər obyektdirsə (məs: "common": {...}), daxilinə giririk
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            newObj[key] = await translateObject(obj[key], targetLang);
        } 
        // Əgər dəyər mətndirsə və dəyişən ({{name}}) deyilsə, tərcümə edirik
        else if (typeof obj[key] === 'string') {
            try {
                // Əgər mətndə {{var}} varsa, Google bəzən onu korlayır. 
                // Sadə tərcümə edirik, amma istifadə edərkən diqqətli olmaq lazımdır.
                const res = await translate(obj[key], { to: targetLang });
                newObj[key] = res.text;
                console.log(`[${targetLang}] ${key}: ${obj[key].substring(0, 20)}... -> ${res.text.substring(0, 20)}...`);
            } catch (error) {
                console.error(`❌ [${targetLang}] "${key}" tərcümə olunmadı:`, error.message);
                newObj[key] = obj[key]; // Xəta olarsa orijinalı saxla
            }
        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

/**
 * Əsas icra funksiyası
 */
async function start() {
    console.log('🚀 Tərcümə prosesi başladıldı...');

    try {
        // 1. Ana faylın (en.json) mövcudluğunu yoxla
        if (!await fs.pathExists(sourceFile)) {
            throw new Error(`Mənbə faylı tapılmadı: ${sourceFile}. Zəhmət olmasa en.json faylını yaradın.`);
        }

        const sourceData = await fs.readJson(sourceFile);

        // 2. Hər bir dil üçün dövr (Loop)
        for (const lang of targetLanguages) {
            // Əgər dil "en" (ingilis) deyilse tərcümə et (ingilis dili artıq bizdə var)
            if (lang === 'en') continue;

            console.log(`\n🌍 [${lang.toUpperCase()}] hazırlanır...`);
            
            const translatedData = await translateObject(sourceData, lang);
            
            const outputFile = path.join(outputDir, `${lang}.json`);
            await fs.writeJson(outputFile, translatedData, { spaces: 2 });
            
            console.log(`✅ ${lang}.json uğurla yaradıldı.`);
        }

        console.log('\n✨ TƏBRİKLƏR! Bütün dillər hazırdır.');

    } catch (err) {
        console.error('\n🛑 KRİTİK XƏTA:', err.message);
    }
}

// Skripti başlat
start();