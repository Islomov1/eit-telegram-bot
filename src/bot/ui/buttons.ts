import { Language } from "../types";

/* =========================
   BUTTON KEYS
   ========================= */
export type ButtonKey =
  | "kids"
  | "students"
  | "teachers"
  | "enroll"
  | "changeLang"
  | "back"
  | "kidsEnglish"
  | "generalEnglish"
  | "examPrep"
  | "prices"
  | "schedule";

/* =========================
   BUTTON LABELS
   ========================= */
export const BUTTONS: Record<Language, Record<ButtonKey, string>> = {
  en: {
    kids: "👶 Kids",
    students: "🎓 Students",
    teachers: "👨‍🏫 Teachers",
    enroll: "📝 Sign up",
    changeLang: "🌍 Change language",
    back: "⬅️ Back",

    kidsEnglish: "📘 Kids English (A1–B2)",
    generalEnglish: "📚 General English (A1–B2)",
    examPrep: "🎯 Exam Preparation",
    prices: "💰 Prices",
    schedule: "⏰ Schedule",
  },

  ru: {
    kids: "👶 Дети",
    students: "🎓 Студенты",
    teachers: "👨‍🏫 Преподаватели",
    enroll: "📝 Записаться",
    changeLang: "🌍 Сменить язык",
    back: "⬅️ Назад",

    kidsEnglish: "📘 Английский для детей (A1–B2)",
    generalEnglish: "📚 Общий английский (A1–B2)",
    examPrep: "🎯 Подготовка к экзаменам",
    prices: "💰 Цены",
    schedule: "⏰ Расписание",
  },

  uz: {
    kids: "👶 Bolalar",
    students: "🎓 Talabalar",
    teachers: "👨‍🏫 O‘qituvchilar",
    enroll: "📝 Ro‘yxatdan o‘tish",
    changeLang: "🌍 Tilni o‘zgartirish",
    back: "⬅️ Orqaga",

    kidsEnglish: "📘 Bolalar uchun ingliz tili (A1–B2)",
    generalEnglish: "📚 Umumiy ingliz tili (A1–B2)",
    examPrep: "🎯 Imtihonlarga tayyorlov",
    prices: "💰 Narxlar",
    schedule: "⏰ Jadval",
  },
};
