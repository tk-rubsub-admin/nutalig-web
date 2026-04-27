import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { GridLocaleText } from '@material-ui/data-grid';
import translationEn from './en/translations.json';
import translationTh from './th/translations.json';
import muiEn from './en/mui';
import muiTh from './th/mui';

// INFO: follow setup from: https://react.i18next.com/latest/typescript#create-a-declaration-file
declare module 'react-i18next' {
  interface Resources {
    ns1: typeof translationEn;
    ns2: typeof translationTh;
  }
}

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: 'th',
    resources: {
      en: {
        translation: translationEn
      },
      th: {
        translation: translationTh
      }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;

interface MuiLocale {
  gridLocaleText: Partial<GridLocaleText>;
}

export const getMuiLocales = (lang?: string): MuiLocale => {
  switch (lang) {
    case 'en-US':
    case 'en':
      return muiEn;

    case 'th-TH':
    case 'th':
      return muiTh;

    default:
      return muiEn;
  }
};
