import { NextRequest, NextResponse } from "next/server";

/* =====================
   ENV
   ===================== */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const LEADS_CHANNEL_ID = Number(process.env.LEADS_CHANNEL_ID!);

/* =====================
   IN-MEMORY STATE (MVP)
   ===================== */
const userLang = new Map<number, "en" | "ru" | "uz">();
const leadState = new Map<number, { step: number; data: any }>();
const processedUpdates = new Set<number>();

/* =====================
   MAIN HANDLER
   ===================== */
export async function POST(req: NextRequest) {
  const body = await req.json();

  /* ---- HARD SPAM STOP ---- */
  const updateId: number | undefined = body?.update_id;
  if (updateId) {
    if (processedUpdates.has(updateId)) {
      return NextResponse.json({ ok: true });
    }
    processedUpdates.add(updateId);
    if (processedUpdates.size > 5000) processedUpdates.clear();
  }

  if (body?.edited_message) {
    return NextResponse.json({ ok: true });
  }

  /* ---- ACK CALLBACKS IMMEDIATELY ---- */
  if (body?.callback_query?.id) {
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: body.callback_query.id }),
    });
  }

  const chatId =
    body?.message?.chat?.id ||
    body?.callback_query?.message?.chat?.id;

  const text: string | undefined =
    body?.message?.text || body?.callback_query?.data;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  /* =====================
     LANGUAGE
     ===================== */
  if (text === "/start") {
    await send(chatId, "🌍 Please choose a language:", {
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
    await mainMenu(chatId, lang);
    return NextResponse.json({ ok: true });
  }

  const lang = userLang.get(chatId) || "en";

  /* =====================
     MENUS
     ===================== */
  if (text === "CHANGE_LANG") {
    await send(chatId, "🌍 Choose a language:", {
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
     KIDS
     ===================== */
  if (text === "KIDS_INFO") {
    return reply(chatId, lang, {
      en:
        "👶 *Kids English*\n\n" +
        "Levels: A1–B2\n" +
        "Price: 448,000 UZS / month\n" +
        "Duration: up to 6 months\n" +
        "Schedule:\n• 9:30–12:30\n• 14:00–20:30",
      ru:
        "👶 *Английский для детей*\n\n" +
        "A1–B2\nЦена: 448 000 сум\nДо 6 месяцев\n" +
        "9:30–12:30 / 14:00–20:30",
      uz:
        "👶 *Bolalar uchun ingliz tili*\n\n" +
        "A1–B2\nNarx: 448 000 so‘m\n6 oygacha\n" +
        "9:30–12:30 / 14:00–20:30",
    });
  }

  /* =====================
     GENERAL ENGLISH
     ===================== */
  if (text === "A1_B2") {
    return reply(chatId, lang, {
      en:
        "📚 *General English*\n\n" +
        "A1 — 448,000 (≈2 months)\n" +
        "A2 — 498,000 (2–3 months)\n" +
        "B1 — 538,000 (4 months)\n" +
        "B2 — 588,000 (4 months)\n\n" +
        "3 times/week · 90 minutes",
      ru:
        "📚 *Общий английский*\n\n" +
        "A1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000",
      uz:
        "📚 *Umumiy ingliz tili*\n\n" +
        "A1 — 448 000\nA2 — 498 000\nB1 — 538 000\nB2 — 588 000",
    });
  }

  /* =====================
     EXAMS
     ===================== */
  if (text === "EXAMS") {
    return reply(chatId, lang, {
      en:
        "🎯 *Exam Preparation*\n\n" +
        "IELTS — 678,000 (up to 6 months)\n" +
        "CEFR (exam) — 578,000 (3 months)\n" +
        "SAT Math — 500,000\nSAT English — 500,000\n" +
        "Individual — 1,480,000 (unlimited)",
      ru:
        "🎯 *Подготовка к экзаменам*\n\n" +
        "IELTS — 678 000\nCEFR — 578 000\nSAT Math — 500 000\nSAT English — 500 000",
      uz:
        "🎯 *Imtihonlarga tayyorlov*\n\n" +
        "IELTS — 678 000\nCEFR — 578 000\nSAT Math — 500 000\nSAT English — 500 000",
    });
  }

  /* =====================
     TEACHERS
     ===================== */
  if (text === "TEACHERS") {
    return reply(chatId, lang, {
      en:
        "👨‍🏫 *Our Teachers*\n\n" +
        "Jasmina Sultanova — IELTS 8.0\n" +
        "Tokhir Islomov — IELTS 8.5\n" +
        "Rayhona Amirkhanova — IELTS 8.0\n" +
        "Samir Rakhimberdiyev — IELTS 8.0\n" +
        "Ozoda Abdurakhmonova — IELTS 7.5\n\n" +
        "More than 100 students achieved results with our guidance.",
      ru:
        "👨‍🏫 *Преподаватели*\nIELTS 7.5–8.5\n100+ успешных студентов",
      uz:
        "👨‍🏫 *O‘qituvchilar*\nIELTS 7.5–8.5\n100+ natijalar",
    });
  }

  /* =====================
     LEADS
     ===================== */
  if (text === "ENROLL") {
    leadState.set(chatId, { step: 1, data: {} });
    await send(chatId, ask(lang, "name"));
    return NextResponse.json({ ok: true });
  }

  if (leadState.has(chatId)) {
    return handleLead(chatId, text, lang);
  }

  /* =====================
     OPENAI (FREE TEXT)
     ===================== */
  const ai = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: `You are a friendly professional consultant for EIT.
Reply in ${lang === "ru" ? "Russian" : lang === "uz" ? "Uzbek" : "English"}.
Never guarantee scores.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await ai.json();
  const answer = data?.choices?.[0]?.message?.content;

  await send(chatId, answer || fallback(lang));
  return NextResponse.json({ ok: true });
}

/* =====================
   HELPERS
   ===================== */
async function handleLead(chatId: number, text: string, lang: string) {
  const state = leadState.get(chatId)!;

  if (state.step === 1) {
    state.data.name = text;
    state.step = 2;
    await send(chatId, ask(lang, "phone"));
  } else if (state.step === 2) {
    state.data.phone = text;
    state.step = 3;
    await send(chatId, ask(lang, "course"));
  } else if (state.step === 3) {
    state.data.course = text;
    state.step = 4;
    await send(chatId, ask(lang, "age"));
  } else {
    state.data.age = text;

    await send(
      LEADS_CHANNEL_ID,
      `🆕 NEW LEAD\n` +
        `👤 Name: ${state.data.name}\n` +
        `📞 Phone: ${state.data.phone}\n` +
        `🎓 Course: ${state.data.course}\n` +
        `🎂 Age: ${state.data.age}`
    );

    leadState.delete(chatId);
    await send(chatId, thanks(lang));
  }

  return NextResponse.json({ ok: true });
}

async function mainMenu(chatId: number, lang: string) {
  await send(chatId, welcome(lang), {
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
  await send(chatId, menuText(lang, "kids"), {
    inline_keyboard: [
      [{ text: "📘 Kids English", callback_data: "KIDS_INFO" }],
      [{ text: "📝 Enroll a child", callback_data: "ENROLL" }],
      [{ text: "⬅️ Back", callback_data: "STUDENTS" }],
    ],
  });
}

async function studentsMenu(chatId: number, lang: string) {
  await send(chatId, menuText(lang, "students"), {
    inline_keyboard: [
      [{ text: "📚 A1–B2", callback_data: "A1_B2" }],
      [{ text: "🎯 Exams", callback_data: "EXAMS" }],
      [{ text: "📝 Enroll", callback_data: "ENROLL" }],
      [{ text: "⬅️ Back", callback_data: "CHANGE_LANG" }],
    ],
  });
}

async function reply(chatId: number, lang: string, map: any) {
  await send(chatId, map[lang]);
}

async function send(chatId: number, text: string, reply_markup?: any) {
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

/* =====================
   TEXT
   ===================== */
const ask = (l: string, k: string) =>
  ({
    en: { name: "Your name?", phone: "Phone number?", course: "Course?", age: "Age?" },
    ru: { name: "Имя?", phone: "Телефон?", course: "Курс?", age: "Возраст?" },
    uz: { name: "Ism?", phone: "Telefon?", course: "Kurs?", age: "Yosh?" },
  } as any)[l][k];

const welcome = (l: string) =>
  ({
    en: "Welcome to *EIT* 👋\nChoose a section:",
    ru: "Добро пожаловать в *EIT* 👋",
    uz: "*EIT* ga xush kelibsiz 👋",
  } as any)[l];

const menuText = (l: string, k: string) =>
  ({
    kids: {
      en: "👶 Kids section",
      ru: "👶 Детский раздел",
      uz: "👶 Bolalar bo‘limi",
    },
    students: {
      en: "🎓 Students section",
      ru: "🎓 Студенты",
      uz: "🎓 Talabalar",
    },
  } as any)[k][l];

const thanks = (l: string) =>
  ({
    en: "✅ Thank you! Our team will contact you soon.",
    ru: "✅ Спасибо! Мы скоро свяжемся.",
    uz: "✅ Rahmat! Tez orada bog‘lanamiz.",
  } as any)[l];

const fallback = (l: string) =>
  ({
    en: "Please contact our admin: @EITADMIN",
    ru: "Свяжитесь с администратором: @EITADMIN",
    uz: "Administrator bilan bog‘laning: @EITADMIN",
  } as any)[l];
