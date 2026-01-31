import { Language } from "../types";

/* =========================
   TEXT STRUCTURE
   ========================= */
export type UITextKey =
  | "welcome"
  | "kidsIntro"
  | "studentsIntro"
  | "kidsInfo"
  | "generalEnglish"
  | "examPrep"
  | "prices"
  | "schedule"
  | "teachers"
  | "askName"
  | "askPhone"
  | "askCourse"
  | "askAge"
  | "thanks"
  | "fallback";

/* =========================
   TEXT CONTENT
   ========================= */
export const TEXT: Record<Language, Record<UITextKey, string>> = {
  en: {
    welcome:
      "👋 *Welcome to EIT — Excellence in Teaching*\n\n" +
      "We help students confidently prepare for English exams and improve their level.\n\n" +
      "Please choose a section below 👇",

    kidsIntro:
      "👶 *Kids Section*\n\n" +
      "This section is designed for parents.\n" +
      "Here you can find information about English classes for children.",

    studentsIntro:
      "🎓 *Students Section*\n\n" +
      "Here you can explore General English and Exam Preparation courses.",

    kidsInfo:
      "👶 *Kids English (A1–B2)*\n\n" +
      "• Friendly and supportive environment\n" +
      "• Small groups\n" +
      "• Strong language foundation\n\n" +
      "💰 Price: *448,000 UZS / month*\n" +
      "⏳ Duration: up to 6 months\n\n" +
      "⏰ Schedule:\n9:30–12:30\n14:00–20:30\n\n" +
      "_Final schedule is confirmed by admin._",

    generalEnglish:
      "📚 *General English (A1–B2)*\n\n" +
      "A1 — 448,000 (≈2 months)\n" +
      "A2 — 498,000 (2–3 months)\n" +
      "B1 — 538,000 (4 months)\n" +
      "B2 — 588,000 (4 months)\n\n" +
      "• 3 classes per week\n" +
      "• 90 minutes per class",

    examPrep:
      "🎯 *Exam Preparation*\n\n" +
      "IELTS — 678,000 (up to 6 months)\n" +
      "CEFR — 578,000 (3 months)\n" +
      "SAT Math — 500,000\n" +
      "SAT English — 500,000\n\n" +
      "👤 Individual lessons — 1,480,000 (unlimited)",

    prices:
      "💰 *Prices Summary*\n\n" +
      "Kids — 448,000\n" +
      "A1 — 448,000\n" +
      "A2 — 498,000\n" +
      "B1 — 538,000\n" +
      "B2 — 588,000\n" +
      "IELTS — 678,000\n" +
      "CEFR — 578,000\n" +
      "SAT — 500,000 per section\n" +
      "Individual — 1,480,000",

    schedule:
      "⏰ *Class Schedule*\n\n" +
      "Morning: 9:30–12:30\n" +
      "Afternoon/Evening: 14:00–20:30\n\n" +
      "_Exact time depends on level and is confirmed by admin._",

    teachers:
      "👨‍🏫 *Our Teachers*\n\n" +
      "• Jasmina Sultanova — IELTS 8.0\n" +
      "• Tokhir Islomov — IELTS 8.5\n" +
      "• Rayhona Amirkhanova — IELTS 8.0\n" +
      "• Samir Rakhimberdiyev — IELTS 8.0\n" +
      "• Ozoda Abdurakhmonova — IELTS 7.5\n\n" +
      "🌟 More than 100 students have achieved their exam results by following our teachers’ guidance.",

    askName: "👤 Please tell us your name:",
    askPhone: "📞 Please enter your phone number:",
    askCourse: "🎓 Which course are you interested in?",
    askAge: "🎂 Please enter your age (or child’s age):",

    thanks:
      "✅ Thank you!\nOur admin will contact you shortly to help you get started.",

    fallback:
      "For detailed information, please contact our admin: @EITADMIN",
  },

  ru: {
    welcome:
      "👋 *Добро пожаловать в EIT — Excellence in Teaching*\n\n" +
      "Мы помогаем студентам уверенно готовиться к экзаменам и улучшать уровень английского.\n\n" +
      "Выберите раздел ниже 👇",

    kidsIntro:
      "👶 *Раздел для детей*\n\n" +
      "Информация для родителей о курсах английского языка для детей.",

    studentsIntro:
      "🎓 *Раздел для студентов*\n\n" +
      "Общий английский и подготовка к экзаменам.",

    kidsInfo:
      "👶 *Английский для детей (A1–B2)*\n\n" +
      "• Дружелюбная атмосфера\n" +
      "• Маленькие группы\n\n" +
      "💰 Цена: *448 000 сум / месяц*\n" +
      "⏳ До 6 месяцев\n\n" +
      "⏰ 9:30–12:30 / 14:00–20:30\n\n" +
      "_Расписание подтверждается администратором._",

    generalEnglish:
      "📚 *Общий английский (A1–B2)*\n\n" +
      "A1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000\n\n" +
      "3 раза в неделю · 90 минут",

    examPrep:
      "🎯 *Подготовка к экзаменам*\n\n" +
      "IELTS — 678 000\nCEFR — 578 000\nSAT Math — 500 000\nSAT English — 500 000\n\n" +
      "Индивидуально — 1 480 000",

    prices:
      "💰 *Цены*\n\n" +
      "Дети — 448 000\nA1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000\nIELTS — 678 000\nCEFR — 578 000\nSAT — 500 000",

    schedule:
      "⏰ *Расписание*\n\n" +
      "Утро: 9:30–12:30\nВечер: 14:00–20:30\n\n" +
      "_Окончательное время подтверждается администратором._",

    teachers:
      "👨‍🏫 *Преподаватели*\n\n" +
      "IELTS 7.5–8.5\nБолее 100 успешных студентов.",

    askName: "👤 Ваше имя:",
    askPhone: "📞 Номер телефона:",
    askCourse: "🎓 Интересующий курс:",
    askAge: "🎂 Возраст:",

    thanks:
      "✅ Спасибо!\nАдминистратор свяжется с вами в ближайшее время.",

    fallback:
      "Для подробной информации свяжитесь с администратором: @EITADMIN",
  },

  uz: {
    welcome:
      "👋 *EIT — Excellence in Teaching ga xush kelibsiz*\n\n" +
      "Biz ingliz tilini o‘rganishda va imtihonlarga tayyorlanishda yordam beramiz.\n\n" +
      "Quyidagi bo‘limlardan birini tanlang 👇",

    kidsIntro:
      "👶 *Bolalar bo‘limi*\n\n" +
      "Bolalar uchun ingliz tili kurslari haqida ma’lumot.",

    studentsIntro:
      "🎓 *Talabalar bo‘limi*\n\n" +
      "Umumiy ingliz tili va imtihonlarga tayyorlov.",

    kidsInfo:
      "👶 *Bolalar uchun ingliz tili (A1–B2)*\n\n" +
      "• Qulay muhit\n• Kichik guruhlar\n\n" +
      "💰 Narx: *448 000 so‘m / oy*\n" +
      "⏳ 6 oygacha\n\n" +
      "⏰ 9:30–12:30 / 14:00–20:30\n\n" +
      "_Jadval administrator tomonidan tasdiqlanadi._",

    generalEnglish:
      "📚 *Umumiy ingliz tili (A1–B2)*\n\n" +
      "A1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000\n\n" +
      "Haftasiga 3 marta · 90 daqiqa",

    examPrep:
      "🎯 *Imtihonlarga tayyorlov*\n\n" +
      "IELTS — 678 000\nCEFR — 578 000\nSAT Math — 500 000\nSAT English — 500 000\n\n" +
      "Individual — 1 480 000",

    prices:
      "💰 *Narxlar*\n\n" +
      "Bolalar — 448 000\nA1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000\nIELTS — 678 000\nCEFR — 578 000\nSAT — 500 000",

    schedule:
      "⏰ *Dars jadvali*\n\n" +
      "Ertalab: 9:30–12:30\nKechqurun: 14:00–20:30\n\n" +
      "_Aniq vaqt administrator tomonidan belgilanadi._",

    teachers:
      "👨‍🏫 *O‘qituvchilar*\n\n" +
      "IELTS 7.5–8.5\n100 dan ortiq natijalar.",

    askName: "👤 Ismingiz:",
    askPhone: "📞 Telefon raqamingiz:",
    askCourse: "🎓 Qaysi kursga qiziqasiz?",
    askAge: "🎂 Yoshingiz:",

    thanks:
      "✅ Rahmat!\nAdministrator tez orada siz bilan bog‘lanadi.",

    fallback:
      "Batafsil ma’lumot uchun administrator bilan bog‘laning: @EITADMIN",
  },
};
