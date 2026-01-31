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
   TEXT & BUTTONS
   ===================== */
const UI: any = {
  en: {
    text: {
      welcome:
        "👋 *Welcome to EIT — Excellence in Teaching*\n\n" +
        "We help students confidently prepare for English exams and general English.\n" +
        "Choose what you’re interested in below 👇",

      kidsInfo:
        "👶 *Kids English (A1–B2)*\n\n" +
        "• Small groups\n• Friendly environment\n• Strong foundation\n\n" +
        "💰 Price: *448,000 UZS / month*\n" +
        "⏳ Duration: up to 6 months\n\n" +
        "⏰ Schedule:\n9:30–12:30 / 14:00–20:30\n\n" +
        "_Final schedule is confirmed by admin._",

      general:
        "📚 *General English (A1–B2)*\n\n" +
        "A1 — 448,000 (≈2 months)\n" +
        "A2 — 498,000 (2–3 months)\n" +
        "B1 — 538,000 (4 months)\n" +
        "B2 — 588,000 (4 months)\n\n" +
        "• 3 times/week\n• 90 minutes per class",

      exams:
        "🎯 *Exam Preparation*\n\n" +
        "IELTS — 678,000 (up to 6 months)\n" +
        "CEFR — 578,000 (3 months)\n" +
        "SAT Math — 500,000\nSAT English — 500,000\n\n" +
        "👤 Individual lessons — 1,480,000 (unlimited)",

      prices:
        "💰 *Prices Summary*\n\n" +
        "Kids — 448,000\nA1 — 448,000\nA2 — 498,000\nB1 — 538,000\nB2 — 588,000\nIELTS — 678,000\nCEFR — 578,000\nSAT — 500,000 / section\nIndividual — 1,480,000",

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
        "🌟 More than 100 students have achieved their results with our guidance.",

      askName: "👤 Your name?",
      askPhone: "📞 Your phone number?",
      askCourse: "🎓 Which course are you interested in?",
      askAge: "🎂 Your age (or child’s age)?",
      thanks:
        "✅ Thank you!\nOur admin will contact you shortly to help you get started.",
      fallback:
        "For detailed information, please contact our admin: @EITADMIN",
    },

    buttons: {
      kids: "👶 Kids",
      students: "🎓 Students",
      teachers: "👨‍🏫 Teachers",
      enroll: "📝 Sign up",
      changeLang: "🌍 Change language",
      back: "⬅️ Back",

      kidsEnglish: "📘 Kids English (A1–B2)",
      general: "📚 General English",
      exams: "🎯 Exam Preparation",
      prices: "💰 Prices",
      schedule: "⏰ Schedule",
    },
  },

  /* RU & UZ same structure, different language */
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

  if (body?.edited_message) return NextResponse.json({ ok: true });

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

  /* LANGUAGE */
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
    return mainMenu(chatId, lang);
  }

  const lang = userLang.get(chatId) || "en";
  const t = UI[lang].text;
  const b = UI[lang].buttons;

  /* MENUS */
  if (text === "MAIN") return mainMenu(chatId, lang);
  if (text === "KIDS") return kidsMenu(chatId, lang);
  if (text === "STUDENTS") return studentsMenu(chatId, lang);

  if (text === "KIDS_INFO") return send(chatId, t.kidsInfo);
  if (text === "A1_B2") return send(chatId, t.general);
  if (text === "EXAMS") return send(chatId, t.exams);
  if (text === "PRICES") return send(chatId, t.prices);
  if (text === "SCHEDULE") return send(chatId, t.schedule);
  if (text === "TEACHERS") return send(chatId, t.teachers);

  /* ENROLL */
  if (text === "ENROLL") {
    leadState.set(chatId, { step: 1, data: {} });
    return send(chatId, t.askName);
  }

  if (leadState.has(chatId)) {
    return handleLead(chatId, text, lang);
  }

  /* CHATGPT */
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
          content:
            "You are a friendly, professional education consultant for EIT. " +
            "Help users choose courses and encourage signing up. " +
            "Never guarantee exam scores.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await ai.json();
  await send(chatId, data?.choices?.[0]?.message?.content || t.fallback);
  return NextResponse.json({ ok: true });
}

/* =====================
   MENUS
   ===================== */
async function mainMenu(chatId: number, lang: string) {
  const t = UI[lang].text;
  const b = UI[lang].buttons;

  return send(chatId, t.welcome, {
    inline_keyboard: [
      [{ text: b.kids, callback_data: "KIDS" }],
      [{ text: b.students, callback_data: "STUDENTS" }],
      [{ text: b.teachers, callback_data: "TEACHERS" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.changeLang, callback_data: "LANG_" + lang }],
    ],
  });
}

async function kidsMenu(chatId: number, lang: string) {
  const b = UI[lang].buttons;
  return send(chatId, b.kids, {
    inline_keyboard: [
      [{ text: b.kidsEnglish, callback_data: "KIDS_INFO" }],
      [{ text: b.prices, callback_data: "PRICES" }],
      [{ text: b.schedule, callback_data: "SCHEDULE" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.back, callback_data: "MAIN" }],
    ],
  });
}

async function studentsMenu(chatId: number, lang: string) {
  const b = UI[lang].buttons;
  return send(chatId, b.students, {
    inline_keyboard: [
      [{ text: b.general, callback_data: "A1_B2" }],
      [{ text: b.exams, callback_data: "EXAMS" }],
      [{ text: b.prices, callback_data: "PRICES" }],
      [{ text: b.schedule, callback_data: "SCHEDULE" }],
      [{ text: b.enroll, callback_data: "ENROLL" }],
      [{ text: b.back, callback_data: "MAIN" }],
    ],
  });
}

/* =====================
   LEADS
   ===================== */
async function handleLead(chatId: number, text: string, lang: string) {
  const t = UI[lang].text;
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
