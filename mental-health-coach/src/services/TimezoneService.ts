// src/services/TimezoneService.ts
export interface TimezoneInfo {
  timezone: string;
  countryCode: string;
  currentTime: Date;
  offset: number; // UTC offset in hours
}

export class TimezoneService {
  /**
   * HTTPS dəstəkləyən servis vasitəsilə Timezone məlumatını alır.
   * Əgər şəbəkə xətası olsa (məsələn, internet yoxdursa), cihazın daxili vaxtına keçid edir.
   */
  static async getTimezoneByIP(): Promise<TimezoneInfo> {
    try {
      console.log('🌍 Timezone aşkarlanır (Secure HTTPS)...');
      
      // ipapi.co servisi tək sorğu ilə həm IP, həm yerləşmə, həm də vaxt məlumatını verir.
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`Şəbəkə xətası: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && !data.error) {
        console.log('✅ Timezone uğurla alındı:', data.timezone);
        
        // Ofseti hesablayaq (Məsələn: "+0400" -> 4)
        const utcOffsetRaw = data.utc_offset || "+0000";
        const offsetHours = parseInt(utcOffsetRaw) / 100;

        return {
          timezone: data.timezone || 'Asia/Baku',
          countryCode: data.country_code || 'AZ',
          currentTime: new Date(),
          offset: offsetHours
        };
      } else {
        throw new Error(data.reason || 'Məlumat formatı yanlışdır');
      }
      
    } catch (error: any) {
      // TypeError: Network request failed bura düşəcək
      console.log('⚠️ IP Timezone xətası (Fallback aktiv edildi):', error.message);
      
      // FALLBACK: Cihazın öz daxili sazlamalarından istifadə edirik
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      // JS getTimezoneOffset() dəqiqə verir və işarəsi tərsdir, ona görə -60-a bölürük
      const deviceOffset = -now.getTimezoneOffset() / 60; 

      return {
        timezone: deviceTimezone || 'UTC',
        countryCode: 'AZ', // Default olaraq Azərbaycan
        currentTime: now,
        offset: deviceOffset
      };
    }
  }

  /**
   * Ölkə koduna görə statik timezone qaytarır
   */
  static getCountryTimeZone(countryCode: string): string {
    const countryTimezones: { [key: string]: string } = {
      'AZ': 'Asia/Baku',
      'TR': 'Europe/Istanbul',
      'US': 'America/New_York',
      'RU': 'Europe/Moscow',
      'DE': 'Europe/Berlin',
      'GB': 'Europe/London',
      'FR': 'Europe/Paris',
      'IT': 'Europe/Rome',
      'ES': 'Europe/Madrid',
      'CN': 'Asia/Shanghai',
      'JP': 'Asia/Tokyo',
      'IN': 'Asia/Kolkata',
      'BR': 'America/Sao_Paulo',
      'CA': 'America/Toronto',
      'AU': 'Australia/Sydney'
    };
    
    return countryTimezones[countryCode.toUpperCase()] || 'UTC';
  }

  /**
   * İstənilən saat aralığında random vaxt generasiyası (startHour - endHour)
   * @param startHour Başlanğıc saat (0-23)
   * @param endHour Bitmə saatı (0-23, bu saat daxil deyil)
   */
  static getRandomTimeBetween(startHour: number, endHour: number): { hour: number, minute: number } {
    // startHour və endHour arasında random saat seç
    const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
    const minute = Math.floor(Math.random() * 60);
    return { hour, minute };
  }
}