import { NextRequest, NextResponse } from "next/server";

/* =====================
   ENV
   ===================== */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const LEADS_CHANNEL_ID = Number(process.env.LEADS_CHANNEL_ID!);

/* =====================
   STATE (MVP-safe)
   ===================== */
const userLang = new Map<number, "en" | "ru" | "uz">();
const leadState = new Map<number, { step: number; data: any }>();
const processedUpdates = new Set<number>();

/* =====================
   TEXT DICTIONARY
   ===================== */
const TEXT: any = {
  en: {
    main: "Welcome to *EIT* 👋\nChoose a section:",
    kids: "👶 Kids section",
    students: "🎓 Students section",
    teachers: "👨‍🏫 Teachers",
    enroll: "📝 Sign up",
    changeLang: "🌍 Change language",
    back: "⬅️ Back",

    kidsInfo:
      "👶 *Kids English*\n\nLevels: A1–B2\nPrice: 448,000 UZS / month\nDuration: up to 6 months\n\n⏰ Schedule:\n9:30–12:30\n14:00–20:30\n\nFinal schedule confirmed by admin.",

    general:
      "📚 *General English*\n\nA1 — 448,000 (≈2 months)\nA2 — 498,000 (2–3 months)\nB1 — 538,000 (4 months)\nB2 — 588,000 (4 months)\n\n3 times/week · 90 minutes",

    exams:
      "🎯 *Exam Preparation*\n\nIELTS — 678,000 (up to 6 months)\nCEFR — 578,000 (3 months)\nSAT Math — 500,000\nSAT English — 500,000\nIndividual — 1,480,000 (unlimited)",

    prices:
      "💰 *Prices*\n\nKids — 448,000\nA1 — 448,000\nA2 — 498,000\nB1 — 538,000\nB2 — 588,000\nIELTS — 678,000\nCEFR — 578,000\nSAT — 500,000 per section\nIndividual — 1,480,000",

    schedule:
      "⏰ *Schedule*\n\nMorning: 9:30–12:30\nAfternoon/Evening: 14:00–20:30\n\nFinal schedule depends on level and is confirmed by admin.",

    teachersText:
      "👨‍🏫 *Our Teachers*\n\n" +
      "Jasmina Sultanova — IELTS 8.0\n" +
      "Tokhir Islomov — IELTS 8.5\n" +
      "Rayhona Amirkhanova — IELTS 8.0\n" +
      "Samir Rakhimberdiyev — IELTS 8.0\n" +
      "Ozoda Abdurakhmonova — IELTS 7.5\n\n" +
      "More than 100 students have achieved results with our guidance.",

    askName: "👤 Your name?",
    askPhone: "📞 Phone number?",
    askCourse: "🎓 Course interested in?",
    askAge: "🎂 Age?",
    thanks: "✅ Thank you! Our team will contact you soon.",

    fallback: "Please contact our admin: @EITADMIN",
  },

  /* RU and UZ are similar — trimmed for brevity in explanation */
};

/* =====================
   MAIN HANDLER
   ===================== */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const updateId = body?.update_id;
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

  const text =
    body?.message?.text || body?.callback_query?.data;

  if (!chatId || !text) return NextResponse.json({ ok: true });

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
    const lang = text.split("_")[1];
    userLang.set(chatId, lang);
    await mainMenu(chatId, lang);
    return NextResponse.json({ ok: true });
  }

  const lang = userLang.get(chatId) || "en";
  const t = TEXT[lang];

  /* =====================
     MENUS
     ===================== */
  if (text === "MAIN") return mainMenu(chatId, lang);

  if (text === "KIDS") return kidsMenu(chatId, lang);
  if (text === "STUDENTS") return studentsMenu(chatId, lang);

  if (text === "KIDS_INFO") return send(chatId, t.kidsInfo);
  if (text === "A1_B2") return send(chatId, t.general);
  if (text === "EXAMS") return send(chatId, t.exams);
  if (text === "PRICES") return send(chatId, t.prices);
  if (text === "SCHEDULE") return send(chatId, t.schedule);
  if (text === "TEACHERS") return send(chatId, t.teachersText);

  /* =====================
     ENROLL FLOW
     ===================== */
  if (text === "ENROLL") {
    leadState.set(chatId, { step: 1, data: {} });
    return send(chatId, t.askName);
  }

  if (leadState.has(chatId)) {
    return handleLead(chatId, text, lang);
  }

  /* =====================
     CHATGPT (OPEN QUESTIONS)
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
Help users choose courses and suggest signing up.
Reply in ${lang}. Never guarantee scores.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await ai.json();
  const answer = data?.choices?.[0]?.message?.content;

  await send(chatId, answer || t.fallback);
  return NextResponse.json({ ok: true });
}

/* =====================
   MENUS
   ===================== */
async function mainMenu(chatId: number, lang: string) {
  const t = TEXT[lang];
  await send(chatId, t.main, {
    inline_keyboard: [
      [{ text: "👶 " + t.kids, callback_data: "KIDS" }],
      [{ text: "🎓 " + t.students, callback_data: "STUDENTS" }],
      [{ text: "👨‍🏫 " + t.teachers, callback_data: "TEACHERS" }],
      [{ text: t.enroll, callback_data: "ENROLL" }],
      [{ text: t.changeLang, callback_data: "LANG_" + lang }],
    ],
  });
}

async function kidsMenu(chatId: number, lang: string) {
  const t = TEXT[lang];
  await send(chatId, t.kids, {
    inline_keyboard: [
      [{ text: "📘 Kids English", callback_data: "KIDS_INFO" }],
      [{ text: "💰 Prices", callback_data: "PRICES" }],
      [{ text: "⏰ Schedule", callback_data: "SCHEDULE" }],
      [{ text: t.enroll, callback_data: "ENROLL" }],
      [{ text: t.back, callback_data: "MAIN" }],
    ],
  });
}

async function studentsMenu(chatId: number, lang: string) {
  const t = TEXT[lang];
  await send(chatId, t.students, {
    inline_keyboard: [
      [{ text: "📚 General English", callback_data: "A1_B2" }],
      [{ text: "🎯 Exam Prep", callback_data: "EXAMS" }],
      [{ text: "💰 Prices", callback_data: "PRICES" }],
      [{ text: "⏰ Schedule", callback_data: "SCHEDULE" }],
      [{ text: t.enroll, callback_data: "ENROLL" }],
      [{ text: t.back, callback_data: "MAIN" }],
    ],
  });
}

/* =====================
   LEAD HANDLER
   ===================== */
async function handleLead(chatId: number, text: string, lang: string) {
  const t = TEXT[lang];
  const state = leadState.get(chatId)!;

  if (state.step === 1) {
    state.data.name = text;
    state.step = 2;
    return send(chatId, t.askPhone);
  }

  if (state.step === 2) {
    state.data.phone = text;
    state.step = 3;
    return send(chatId, t.askCourse);
  }

  if (state.step === 3) {
    state.data.course = text;
    state.step = 4;
    return send(chatId, t.askAge);
  }

  state.data.age = text;

  await send(
    LEADS_CHANNEL_ID,
    `🆕 NEW LEAD\n👤 ${state.data.name}\n📞 ${state.data.phone}\n🎓 ${state.data.course}\n🎂 ${state.data.age}`
  );

  leadState.delete(chatId);
  return send(chatId, t.thanks);
}

/* =====================
   SEND
   ===================== */
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
