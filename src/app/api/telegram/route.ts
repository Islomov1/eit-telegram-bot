import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const LEADS_CHANNEL_ID = process.env.LEADS_CHANNEL_ID!;

// in-memory language + lead state (MVP-safe)
const userLang = new Map<number, "en" | "ru" | "uz">();
const leadState = new Map<number, { step: number; data: any }>();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const chatId =
    body?.message?.chat?.id ||
    body?.callback_query?.message?.chat?.id;

  const text: string | undefined =
    body?.message?.text || body?.callback_query?.data;

  if (!chatId || !text) return NextResponse.json({ ok: true });

  /* =====================
     LANGUAGE SELECTION
     ===================== */

  if (text === "/start") {
    await sendMessage(chatId, "🌍 Please choose a language:", {
      inline_keyboard: [
        [{ text: "🇬🇧 English", callback_data: "LANG_en" }],
        [{ text: "🇷🇺 Русский", callback_data: "LANG_ru" }],
        [{ text: "🇺🇿 O‘zbek", callback_data: "LANG_uz" }],
      ],
    });
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("LANG_")) {
    const lang = text.split("_")[1] as "en" | "ru" | "uz";
    userLang.set(chatId, lang);
    await showMainMenu(chatId, lang);
    return NextResponse.json({ ok: true });
  }

  const lang = userLang.get(chatId) || "en";

  /* =====================
     MAIN MENUS
     ===================== */

  if (text === "CHANGE_LANG") {
    await sendMessage(chatId, "🌍 Choose a language:", {
      inline_keyboard: [
        [{ text: "🇬🇧 English", callback_data: "LANG_en" }],
        [{ text: "🇷🇺 Русский", callback_data: "LANG_ru" }],
        [{ text: "🇺🇿 O‘zbek", callback_data: "LANG_uz" }],
      ],
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "KIDS") return kidsMenu(chatId, lang);
  if (text === "STUDENTS") return studentsMenu(chatId, lang);

  /* =====================
     KIDS INFO
     ===================== */

  if (text === "KIDS_INFO") {
    return reply(chatId, lang, {
      en: "👶 *Kids English*\n\nLevels: A1–B2\nPrice: 448,000 UZS / month\nDuration: up to 6 months\nSchedule: 9:30–12:30 / 14:00–20:30",
      ru: "👶 *Английский для детей*\n\nУровни: A1–B2\nЦена: 448 000 сум\nДо 6 месяцев",
      uz: "👶 *Bolalar uchun ingliz tili*\n\nDarajalar: A1–B2\nNarx: 448 000 so‘m\n6 oygacha",
    });
  }

  /* =====================
     STUDENT COURSES
     ===================== */

  if (text === "A1_B2") {
    return reply(chatId, lang, {
      en:
        "📚 *General English*\n\n" +
        "A1 – 448,000 (≈2 months)\n" +
        "A2 – 498,000 (2–3 months)\n" +
        "B1 – 538,000 (4 months)\n" +
        "B2 – 588,000 (4 months)\n\n" +
        "3 times/week · 90 minutes",
      ru:
        "📚 *Общий английский*\n\n" +
        "A1 – 448 000\nA2 – 498 000\nB1 – 538 000\nB2 – 588 000",
      uz:
        "📚 *Umumiy ingliz tili*\n\n" +
        "A1 – 448 000\nA2 – 498 000\nB1 – 538 000\nB2 – 588 000",
    });
  }

  if (text === "EXAMS") {
    return reply(chatId, lang, {
      en:
        "🎯 *Exam Preparation*\n\n" +
        "IELTS – 678,000 (up to 6 months)\n" +
        "CEFR (exam) – 578,000 (3 months)\n" +
        "SAT Math – 500,000\nSAT English – 500,000\n" +
        "Individual – 1,480,000 (unlimited)",
      ru:
        "🎯 *Подготовка к экзаменам*\n\n" +
        "IELTS – 678 000\nCEFR – 578 000\nSAT Math – 500 000\nSAT English – 500 000",
      uz:
        "🎯 *Imtihonlarga tayyorlov*\n\n" +
        "IELTS – 678 000\nCEFR – 578 000\nSAT Math – 500 000\nSAT English – 500 000",
    });
  }

  /* =====================
     TEACHERS
     ===================== */

  if (text === "TEACHERS") {
    return reply(chatId, lang, {
      en:
        "👨‍🏫 *Our Teachers*\n\n" +
        "• Jasmina Sultanova — IELTS 8.0\n" +
        "• Tokhir Islomov — IELTS 8.5\n" +
        "• Rayhona Amirkhanova — IELTS 8.0\n" +
        "• Samir Rakhimberdiyev — IELTS 8.0\n" +
        "• Ozoda Abdurakhmonova — IELTS 7.5\n" +
        "• SAT specialists available\n\n" +
        "More than 100 students achieved results with our guidance.",
      ru:
        "👨‍🏫 *Преподаватели*\n\n" +
        "IELTS 7.5–8.5\nБолее 100 успешных студентов.",
      uz:
        "👨‍🏫 *O‘qituvchilar*\n\n" +
        "IELTS 7.5–8.5\n100 dan ortiq natijalar.",
    });
  }

  /* =====================
     LEAD CAPTURE
     ===================== */

  if (text === "ENROLL") {
    leadState.set(chatId, { step: 1, data: {} });
    await sendMessage(chatId, getText(lang, "ask_name"));
    return NextResponse.json({ ok: true });
  }

  if (leadState.has(chatId)) {
    return handleLead(chatId, text, lang);
  }

  /* =====================
     FALLBACK (OPENAI)
     ===================== */

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly professional consultant for EIT. Reply in ${
            lang === "ru" ? "Russian" : lang === "uz" ? "Uzbek" : "English"
          }.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await aiRes.json();
  const answer = data?.choices?.[0]?.message?.content;

  await sendMessage(chatId, answer || getText(lang, "fallback"));
  return NextResponse.json({ ok: true });
}

/* =====================
   LEAD HANDLER
   ===================== */

async function handleLead(chatId: number, text: string, lang: string) {
  const state = leadState.get(chatId)!;

  if (state.step === 1) {
    state.data.name = text;
    state.step = 2;
    await sendMessage(chatId, getText(lang, "ask_phone"));
  } else if (state.step === 2) {
    state.data.phone = text;
    state.step = 3;
    await sendMessage(chatId, getText(lang, "ask_course"));
  } else if (state.step === 3) {
    state.data.course = text;
    state.step = 4;
    await sendMessage(chatId, getText(lang, "ask_age"));
  } else {
    state.data.age = text;

    await sendMessage(
      Number(LEADS_CHANNEL_ID),
      `🆕 NEW LEAD\n👤 Name: ${state.data.name}\n📞 Phone: ${state.data.phone}\n🎓 Course: ${state.data.course}\n🎂 Age: ${state.data.age}`
    );

    leadState.delete(chatId);
    await sendMessage(chatId, getText(lang, "thanks"));
  }

  return NextResponse.json({ ok: true });
}

/* =====================
   MENUS & HELPERS
   ===================== */

async function showMainMenu(chatId: number, lang: string) {
  await sendMessage(chatId, getText(lang, "welcome"), {
    inline_keyboard: [
      [{ text: "👶 Kids", callback_data: "KIDS" }],
      [{ text: "🎓 Students", callback_data: "STUDENTS" }],
      [{ text: "👨‍🏫 Teachers", callback_data: "TEACHERS" }],
      [{ text: "📝 Enroll", callback_data: "ENROLL" }],
      [{ text: "🌍 Change language", callback_data: "CHANGE_LANG" }],
    ],
  });
}

async function kidsMenu(chatId: number, lang: string) {
  await sendMessage(chatId, getText(lang, "kids_menu"), {
    inline_keyboard: [
      [{ text: "📘 Kids English", callback_data: "KIDS_INFO" }],
      [{ text: "📝 Enroll a child", callback_data: "ENROLL" }],
      [{ text: "⬅️ Back", callback_data: "CHANGE_LANG" }],
    ],
  });
}

async function studentsMenu(chatId: number, lang: string) {
  await sendMessage(chatId, getText(lang, "students_menu"), {
    inline_keyboard: [
      [{ text: "📚 A1–B2", callback_data: "A1_B2" }],
      [{ text: "🎯 Exams", callback_data: "EXAMS" }],
      [{ text: "📝 Enroll", callback_data: "ENROLL" }],
      [{ text: "⬅️ Back", callback_data: "CHANGE_LANG" }],
    ],
  });
}

function getText(lang: string, key: string) {
  const t: any = {
    welcome: {
      en: "Welcome to *EIT* 👋\nChoose a section:",
      ru: "Добро пожаловать в *EIT* 👋",
      uz: "*EIT* ga xush kelibsiz 👋",
    },
    kids_menu: {
      en: "👶 Kids section",
      ru: "👶 Детский раздел",
      uz: "👶 Bolalar bo‘limi",
    },
    students_menu: {
      en: "🎓 Students section",
      ru: "🎓 Студенты",
      uz: "🎓 Talabalar",
    },
    ask_name: {
      en: "👤 Your name?",
      ru: "👤 Ваше имя?",
      uz: "👤 Ismingiz?",
    },
    ask_phone: {
      en: "📞 Phone number?",
      ru: "📞 Номер телефона?",
      uz: "📞 Telefon raqamingiz?",
    },
    ask_course: {
      en: "🎓 Course interested in?",
      ru: "🎓 Интересующий курс?",
      uz: "🎓 Qaysi kurs?",
    },
    ask_age: {
      en: "🎂 Age?",
      ru: "🎂 Возраст?",
      uz: "🎂 Yosh?",
    },
    thanks: {
      en: "✅ Thank you! Our team will contact you soon.",
      ru: "✅ Спасибо! Мы скоро свяжемся с вами.",
      uz: "✅ Rahmat! Tez orada bog‘lanamiz.",
    },
    fallback: {
      en: "Please contact our admin: @EITADMIN",
      ru: "Свяжитесь с администратором: @EITADMIN",
      uz: "Administrator bilan bog‘laning: @EITADMIN",
    },
  };

  return t[key]?.[lang] || "";
}

async function reply(chatId: number, lang: string, map: any) {
  await sendMessage(chatId, map[lang]);
}

async function sendMessage(chatId: number, text: string, reply_markup?: any) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup,
    }),
  });
}
