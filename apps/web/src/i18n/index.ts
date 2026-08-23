import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import viAuth from "./locales/vi/auth.json";
import viCommon from "./locales/vi/common.json";

export const defaultNS = "common";
export const resources = {
  vi: {
    common: viCommon,
    auth: viAuth,
  },
  en: {
    common: enCommon,
    auth: enAuth,
  },
} as const;

i18n.use(initReactI18next).init({
  lng: "vi",
  fallbackLng: "vi",
  defaultNS: "common",
  ns: ["common", "auth"],
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
