import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  en: {
    translation: {
      "Welcome": "Welcome",
      "Home": "Home",
      "Subjects": "Subjects",
      "Study Plan": "Study Plan",
      "Ranking": "Ranking",
      "Dashboard": "Dashboard",
      "Browse Subjects": "Browse Subjects",
      "Sign Out": "Sign Out",
      "Take Mixed Test": "Take Mixed Test",
      "Recent Activity": "Recent Activity",
      "Tests Taken": "Tests Taken",
      "Average Score": "Avg Score",
      "Ready to start": "Ready to start learning today?",
    }
  },
  hi: {
    translation: {
      "Welcome": "स्वागत है",
      "Home": "होम",
      "Subjects": "विषय",
      "Study Plan": "अध्ययन योजना",
      "Ranking": "रैंकिंग",
      "Dashboard": "डैशबोर्ड",
      "Browse Subjects": "विषय ब्राउज़ करें",
      "Sign Out": "लॉग आउट",
      "Take Mixed Test": "मिश्रित परीक्षण लें",
      "Recent Activity": "हाल की गतिविधि",
      "Tests Taken": "दिए गए परीक्षण",
      "Average Score": "औसत अंक",
      "Ready to start": "क्या आज सीखना शुरू करने के लिए तैयार हैं?",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
