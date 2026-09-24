export type AppLanguage =
  | 'en' // English
  | 'hi' // Hindi (हिन्दी)
  | 'bn' // Bengali (বাংলা)
  | 'te' // Telugu (తెలుగు)
  | 'mr' // Marathi (मराठी)
  | 'ta' // Tamil (தமிழ்)
  | 'ur' // Urdu (اردو)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ml' // Malayalam (മലയാളം)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'as' // Assamese (অসমীয়া)
  | 'mai' // Maithili (मैथिली)
  | 'sat' // Santali (ᱥᱟᱱᱛᱟᱲᱤ)
  | 'ks' // Kashmiri (کٲشُر)
  | 'ne' // Nepali (नेपाली)
  | 'kok' // Konkani (कोंकणी)
  | 'doi' // Dogri (डोगरी)
  | 'sd' // Sindhi (سنڌي)
  | 'sa' // Sanskrit (संस्कृतम्)
  | 'brx' // Bodo (बर')
  | 'mni' // Manipuri (মৈতৈলোন্)
  | 'bho' // Bhojpuri (भोजपुरी)
  | 'raj'; // Rajasthani (राजस्थानी)

export interface IndianLanguageMeta {
  code: AppLanguage;
  name: string;
  nativeName: string;
  region: string;
  script: string;
  dir?: 'ltr' | 'rtl';
}

/**
 * All 22 Eighth Schedule Official Indian Languages + English + Regional Languages
 */
export const ALL_INDIAN_LANGUAGES: IndianLanguageMeta[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'National / North India', script: 'Devanagari' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'Pan-India', script: 'Latin' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal, Tripura, Assam', script: 'Bengali' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh, Telangana', script: 'Telugu' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra, Goa', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu, Puducherry', script: 'Tamil' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Pan-India, Telangana, J&K', script: 'Perso-Arabic', dir: 'rtl' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Gujarat, Daman & Diu', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala, Lakshadweep', script: 'Malayalam' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Odisha', script: 'Odia' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Punjab, Chandigarh, Delhi', script: 'Gurmukhi' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Assam', script: 'Assamese' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', region: 'Bihar, Jharkhand', script: 'Devanagari' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'Jharkhand, West Bengal, Odisha', script: 'Ol Chiki' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', region: 'Jammu & Kashmir', script: 'Perso-Arabic', dir: 'rtl' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Sikkim, West Bengal, North-East', script: 'Devanagari' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', region: 'Goa, Karnataka, Maharashtra', script: 'Devanagari' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', region: 'Jammu & Kashmir, Himachal', script: 'Devanagari' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي / सिंधी', region: 'Gujarat, Maharashtra, Rajasthan', script: 'Perso-Arabic / Devanagari' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'Classical Indian', script: 'Devanagari' },
  { code: 'brx', name: 'Bodo', nativeName: 'बर\'', region: 'Assam, Bodoland', script: 'Devanagari' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', region: 'Manipur', script: 'Bengali / Meitei Mayek' },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', region: 'Bihar, Uttar Pradesh', script: 'Devanagari' },
  { code: 'raj', name: 'Rajasthani', nativeName: 'राजस्थानी', region: 'Rajasthan', script: 'Devanagari' },
];

export const LANGUAGE_STORAGE_KEY = 'phc_selected_language';

/**
 * Reads the permanently saved language from localStorage.
 * Guarantee: Once set by user, it remains persistent across reloads and navigation.
 */
export function getSavedLanguage(): AppLanguage {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      const storage = (globalThis as any).localStorage;
      if (storage && typeof storage.getItem === 'function') {
        const saved = storage.getItem(LANGUAGE_STORAGE_KEY) || storage.getItem('arogyamitra_app_language');
        if (saved && ALL_INDIAN_LANGUAGES.some((l) => l.code === saved)) {
          return saved as AppLanguage;
        }
      }
    } catch (e) {
      console.error('Error reading saved language:', e);
    }
  }
  return 'en';
}

/**
 * Saves the chosen language permanently into localStorage and dispatches a window event.
 */
export function saveSelectedLanguage(lang: AppLanguage): void {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      const storage = (globalThis as any).localStorage;
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem(LANGUAGE_STORAGE_KEY, lang);
        storage.setItem('arogyamitra_app_language', lang);
      }
      if (typeof (globalThis as any).dispatchEvent === 'function' && typeof (globalThis as any).CustomEvent === 'function') {
        (globalThis as any).dispatchEvent(new (globalThis as any).CustomEvent('phc_language_changed', { detail: lang }));
      }
    } catch (e) {
      console.error('Error saving language:', e);
    }
  }
}

/**
 * Safe translation resolution helper.
 * If translation is provided for the exact language, returns it.
 * If not, attempts region fallback (e.g. Devanagari/Hindi fallback for Bhojpuri/Maithili),
 * then falls back to English.
 */
export function resolveTranslationObject<T extends Record<string, any>>(
  lang: AppLanguage,
  translations: Partial<Record<AppLanguage, T>>,
  defaultLang: AppLanguage = 'en'
): T {
  if (translations[lang]) {
    return translations[lang] as T;
  }
  // Devanagari regional group fallback to Hindi
  if (['bho', 'mai', 'raj', 'doi', 'kok', 'sa', 'ne'].includes(lang) && translations.hi) {
    return translations.hi as T;
  }
  if (translations[defaultLang]) {
    return translations[defaultLang] as T;
  }
  const keys = Object.keys(translations) as AppLanguage[];
  if (keys.length > 0 && translations[keys[0]]) {
    return translations[keys[0]] as T;
  }
  return {} as T;
}

/**
 * Global Navigation & Common UI Labels for all 25 languages
 */
export const NAV_TRANSLATIONS: Record<
  AppLanguage,
  { home: string; assistant: string; nearby: string; bookings: string; records: string; medicines: string; profile: string; emergency: string; selectLanguage: string }
> = {
  en: { home: 'Home', assistant: 'Health Assistant', nearby: 'Nearby PHC', bookings: 'Bookings', records: 'Records', medicines: 'Medicines', profile: 'Profile', emergency: 'Emergency (108)', selectLanguage: 'Select Language' },
  hi: { home: 'होम', assistant: 'स्वास्थ्य सहायक', nearby: 'नजदीकी पीएचसी', bookings: 'बुकिंग', records: 'रिकॉर्ड्स', medicines: 'दवाइयां', profile: 'प्रोफ़ाइल', emergency: 'आपातकालीन (108)', selectLanguage: 'भाषा चुनें' },
  bn: { home: 'হোম', assistant: 'স্বাস্থ্য সহায়ক', nearby: 'নিকটবর্তী পিএইচসি', bookings: 'বুকিং', records: 'নথিপত্র', medicines: 'ওষুধ', profile: 'প্রোফাইল', emergency: 'জরুরি (১০৮)', selectLanguage: 'ভাষা নির্বাচন করুন' },
  te: { home: 'హోమ్', assistant: 'ఆరోగ్య సహాయకుడు', nearby: 'సమీప పీహెచ్‌సీ', bookings: 'బుకింగ్‌లు', records: 'రికార్డులు', medicines: 'మందులు', profile: 'ప్రొఫైల్', emergency: 'అత్యవసరం (108)', selectLanguage: 'భాషను ఎంచుకోండి' },
  mr: { home: 'होम', assistant: 'आरोग्य सहाय्यक', nearby: 'जवळचे पीएचसी', bookings: 'बुकिंग', records: 'नोंदी', medicines: 'औषधे', profile: 'प्रोफाइल', emergency: 'तातडीची मदत (१०८)', selectLanguage: 'भाषा निवडा' },
  ta: { home: 'முகப்பு', assistant: 'சுகாதார உதவியாளர்', nearby: 'அருகிலுள்ள பிஎச்சி', bookings: 'முன்பதிவு', records: 'பதிவுகள்', medicines: 'மருந்துகள்', profile: 'சுயவிவரம்', emergency: 'அவசரம் (108)', selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்' },
  ur: { home: 'ہوم', assistant: 'صحت کا معاون', nearby: 'قریبی پی ایچ سی', bookings: 'بکنگز', records: 'ریکارڈز', medicines: 'ادویات', profile: 'پروفائل', emergency: 'ہنگامی (108)', selectLanguage: 'زبان منتخب کریں' },
  gu: { home: 'હોમ', assistant: 'આરોગ્ય સહાયક', nearby: 'નજીકનું પીએચસી', bookings: 'બુકિંગ', records: 'રેકોર્ડ્સ', medicines: 'દવાઓ', profile: 'પ્રોફાઇલ', emergency: 'ઇમરજન્સી (108)', selectLanguage: 'ભાષા પસંદ કરો' },
  kn: { home: 'ಮುಖಪುಟ', assistant: 'ಆರೋಗ್ಯ ಸಹಾಯಕ', nearby: 'ಹತ್ತಿರದ ಪಿಹೆಚ್‌ಸಿ', bookings: 'ಬುಕಿಂಗ್', records: 'ದಾಖಲೆಗಳು', medicines: 'ಔಷಧಿಗಳು', profile: 'ಪ್ರೊಫೈಲ್', emergency: 'ತುರ್ತು (108)', selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' },
  ml: { home: 'ഹോം', assistant: 'ആരോഗ്യ സഹായി', nearby: 'അടുത്തുള്ള പിഎച്ച്സി', bookings: 'ബുക്കിംഗുകൾ', records: 'രേഖകൾ', medicines: 'മരുന്നുകൾ', profile: 'പ്രൊഫൈൽ', emergency: 'അടിയന്തരം (108)', selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക' },
  or: { home: 'ମୁଖ୍ୟପୃଷ୍ଠା', assistant: 'ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ', nearby: 'ନିକଟସ୍ଥ ପିଏଚ୍‌ସି', bookings: 'ବୁକିଂ', records: 'ରେକର୍ଡ', medicines: 'ଔଷଧ', profile: 'ପ୍ରୋଫାଇଲ୍', emergency: 'ଜରୁରୀକାଳୀନ (108)', selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ' },
  pa: { home: 'ਮੁੱਖ ਪੰਨਾ', assistant: 'ਸਿਹਤ ਸਹਾਇਕ', nearby: 'ਨੇੜਲਾ ਪੀਐਚਸੀ', bookings: 'ਬੁਕਿੰਗ', records: 'ਰਿਕਾਰਡ', medicines: 'ਦਵਾਈਆਂ', profile: 'ਪ੍ਰੋਫਾਈਲ', emergency: 'ਐਮਰਜੈਂਸੀ (108)', selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ' },
  as: { home: 'মুখ্য পৃষ্ঠা', assistant: 'स्वास्थ्य सहायক', nearby: 'ওচৰৰ পিএইচচি', bookings: 'বুকিং', records: 'নথি-পত্ৰ', medicines: 'ঔষধ', profile: 'প্ৰফাইল', emergency: 'জৰুৰীকালীন (১০৮)', selectLanguage: 'ভাষা বাছক' },
  mai: { home: 'गृह', assistant: 'स्वास्थ्य सहायक', nearby: 'समीपवर्ती पीएचसी', bookings: 'बुकिंग', records: 'दस्तावेज', medicines: 'दवाइयां', profile: 'प्रोफ़ाइल', emergency: 'आपातकालीन (108)', selectLanguage: 'भाषा चुनू' },
  sat: { home: 'ᱚᱲᱟᱜ', assistant: 'ᱦᱚᱲᱢᱚ ᱜᱚᱲᱚᱭᱤᱡ', nearby: 'ᱥᱩᱨ ᱨᱮᱱᱟᱜ ᱯᱤ.ᱮᱪ.ᱥᱤ', bookings: 'ᱵᱩᱠᱤᱝ', records: 'ᱚᱞ ᱠᱚ', medicines: 'ᱨᱟᱱ ᱠᱚ', profile: 'ᱯᱨᱳᱯᱷᱟᱭᱤᱞ', emergency: 'ᱞᱟᱹᱠᱛᱤᱭᱟᱱ (108)', selectLanguage: 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ' },
  ks: { home: 'ہوم', assistant: 'صحت مددگار', nearby: 'نزدیٖک پی ایچ سی', bookings: 'بکنگ', records: 'ریکارڈ', medicines: 'دَवा', profile: 'پروفائل', emergency: 'ہنگامی (108)', selectLanguage: 'زبان ژارِو' },
  ne: { home: 'गृहपृष्ठ', assistant: 'स्वास्थ्य सहायक', nearby: 'नजिकैको पीएचसी', bookings: 'बुकिङ', records: 'रेकर्डहरू', medicines: 'औषधिहरू', profile: 'प्रोफाइल', emergency: 'आपतकालीन (१०८)', selectLanguage: 'भाषा छान्नुहोस्' },
  kok: { home: 'घर', assistant: 'भलायकी सहाय्यक', nearby: 'लागचें पीएचसी', bookings: 'बुकिंग', records: 'नोंदी', medicines: 'वखदां', profile: 'प्रोफाइल', emergency: 'तातडीचें (108)', selectLanguage: 'भास वेंचात' },
  doi: { home: 'मुख पृष्ठ', assistant: 'सेहत सहायक', nearby: 'नेड़े दा पीएचसी', bookings: 'बुकिंग', records: 'रिकार्ड', medicines: 'दवाइयां', profile: 'प्रोफाइल', emergency: 'एमरजेंसी (108)', selectLanguage: 'बोली चुनो' },
  sd: { home: 'گھر', assistant: 'صحت مددگار', nearby: 'ويجھو پي ايڇ سي', bookings: 'بڪنگ', records: 'رڪارڊ', medicines: 'دوائون', profile: 'پروفائل', emergency: 'ايمرجنسي (108)', selectLanguage: 'ٻولي چونڊيو' },
  sa: { home: 'मुख्यपृष्ठम्', assistant: 'स्वास्थ्यसहायकः', nearby: 'समीपस्थं पीएचसी', bookings: 'पञ्जीकरणम्', records: 'लेखाः', medicines: 'औषधानि', profile: 'विवरणम्', emergency: 'आपत्कालीनम् (108)', selectLanguage: 'भाषां चिनोतु' },
  brx: { home: 'नखर', assistant: 'साहाइजिरगिरि', nearby: 'खाथिनि पीएचसी', bookings: 'बुकिंग', records: 'रेकर्डफोर', medicines: 'मुलि', profile: 'प्रफाइल', emergency: 'गोनांथार (108)', selectLanguage: 'राव सायख\'' },
  mni: { home: 'য়ুম', assistant: 'হকশেলগী মতেং পাংবা', nearby: 'নকপগী পিএইচসি', bookings: 'বুকিং', records: 'রেকর্ডশিং', medicines: 'হিদাক-লাংথক', profile: 'প্রোফাইল', emergency: 'অকক্নবা (108)', selectLanguage: 'লোল খনবা' },
  bho: { home: 'घर', assistant: 'स्वास्थ्य सहायक', nearby: 'लगवे के पीएचसी', bookings: 'बुकिंग', records: 'कागजात', medicines: 'दवा-दारू', profile: 'प्रोफाइल', emergency: 'इमरजेंसी (108)', selectLanguage: 'भासा चुनीं' },
  raj: { home: 'घर', assistant: 'स्वास्थ्य सहायक', nearby: 'नेड़लो पीएचसी', bookings: 'बुकिंग', records: 'खातो', medicines: 'दवाईयां', profile: 'प्रोफाइल', emergency: 'आपातकालीन (108)', selectLanguage: 'भाषा पसंद करो' },
};
