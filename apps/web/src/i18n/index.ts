import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viCommon from "./locales/vi/common.json";
import enCommon from "./locales/en/common.json";

export const defaultNS = "common";
export const resources = {
  vi: {
    common: viCommon,
  },
  en: {
    common: enCommon,
  },
} as const;

i18n.use(initReactI18next).init({
  lng: "vi",
  fallbackLng: "vi",
  defaultNS,
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
