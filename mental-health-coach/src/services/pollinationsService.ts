// services/pollinationsService.ts
let currentIndex = 0;

export const generateProjectiveImage = async (prompt: string): Promise<string> => {
  console.log('🎨 Rorschach şəkli istifadə olunur');
  
  // Firebase Storage-dan Rorschach şəkilləri
  const fallbacks = [
    'https://storage.googleapis.com/mental-health-storage/care1.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care2.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care3.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care4.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care6.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care7.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care8.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care9.jpeg',
    'https://storage.googleapis.com/mental-health-storage/care10.jpeg'
  ];
  
  const selectedUrl = fallbacks[currentIndex % fallbacks.length];
  currentIndex++;
  console.log('📸 Rorschach şəkli:', selectedUrl);
  return selectedUrl;
};