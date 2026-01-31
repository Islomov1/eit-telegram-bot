import { Language, CallbackAction } from "../types";
import { BUTTONS } from "./buttons";

/* =========================
   INLINE KEYBOARD TYPES
   ========================= */
export type InlineKeyboard = {
  inline_keyboard: {
    text: string;
    callback_data: CallbackAction | string;
  }[][];
};

/* =========================
   LANGUAGE MENU
   ========================= */
export function languageMenu(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "🇬🇧 English", callback_data: "LANG_en" }],
      [{ text: "🇷🇺 Русский", callback_data: "LANG_ru" }],
      [{ text: "🇺🇿 O‘zbek", callback_data: "LANG_uz" }],
    ],
  };
}

/* =========================
   MAIN MENU
   ========================= */
export function mainMenu(lang: Language): InlineKeyboard {
  const b = BUTTONS[lang];

  return {
    inline_keyboard: [
      [{ text: b.kids, callback_data: "KIDS" }],
      [{ text: b.students, callback_data: "STUDENTS" }],
      [{ text: b.teachers, callback_data: "TEACHERS" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.changeLang, callback_data: "CHANGE_LANG" }],
    ],
  };
}

/* =========================
   KIDS MENU
   ========================= */
export function kidsMenu(lang: Language): InlineKeyboard {
  const b = BUTTONS[lang];

  return {
    inline_keyboard: [
      [{ text: b.kidsEnglish, callback_data: "KIDS_INFO" }],
      [{ text: b.prices, callback_data: "PRICES" }],
      [{ text: b.schedule, callback_data: "SCHEDULE" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.back, callback_data: "MAIN" }],
    ],
  };
}

/* =========================
   STUDENTS MENU
   ========================= */
export function studentsMenu(lang: Language): InlineKeyboard {
  const b = BUTTONS[lang];

  return {
    inline_keyboard: [
      [{ text: b.generalEnglish, callback_data: "A1_B2" }],
      [{ text: b.examPrep, callback_data: "EXAMS" }],
      [{ text: b.prices, callback_data: "PRICES" }],
      [{ text: b.schedule, callback_data: "SCHEDULE" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.back, callback_data: "MAIN" }],
    ],
  };
}
