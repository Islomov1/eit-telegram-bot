import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const LEADS_CHANNEL_ID = process.env.LEADS_CHANNEL_ID!;

// ===== GLOBAL IN-MEMORY STORES (MVP-safe) =====
const userLang = new Map<number, "en" | "ru" | "uz">();
const leadState = new Map<number, { step: number; data: any }>();
const processedUpdates = new Set<number>(); // 🔒 anti-spam key

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ✅ HARD STOP: duplicate update protection
  const updateId: number | undefined = body?.update_id;
  if (updateId && processedUpdates.has(updateId)) {
    return NextResponse.json({ ok: true });
  }
  if (updateId) {
    processedUpdates.add(updateId);
    // keep memory sane
    if (processedUpdates.size > 5000) {
      processedUpdates.clear();
    }
  }

  // ✅ Ignore edited messages
  if (body?.edited_message) {
    return NextResponse.json({ ok: true });
  }

  // ✅ ACK callback queries IMMEDIATELY
  if (body?.callback_query?.id) {
    fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
        }),
      }
    );
  }

  // 🔹 Extract message safely
  const chatId =
    body?.message?.chat?.id ||
    body?.callback_query?.message?.chat?.id;

  const text: string | undefined =
    body?.message?.text || body?.callback_query?.data;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  // ================= LANGUAGE =================

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

  // ================= MENUS =================

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

  if (text === "KIDS_INFO") {
    return reply(chatId, lang, {
      en: "👶 Kids English\nA1–B2\n448,000 UZS / month\nUp to 6 months",
      ru: "👶 Английский для детей\nA1–B2\n448 000 сум",
      uz: "👶 Bolalar ingliz tili\nA1–B2\n448 000 so‘m",
    });
  }

  if (text === "A1_B2") {
    return reply(chatId, lang, {
      en:
        "A1 – 448,000\nA2 – 498,000\nB1 – 538,000\nB2 – 588,000\n\n3x/week · 90 min",
      ru:
        "A1 – 448 000\nA2 – 498 000\nB1 – 538 000\nB2 – 588 000",
      uz:
        "A1 – 448 000\nA2 – 498 000\nB1 – 538 000\nB2 – 588 000",
    });
  }

  if (text === "EXAMS") {
    return reply(chatId, lang, {
      en:
        "IELTS – 678,000\nCEFR – 578,000\nSAT Math – 500,000\nSAT English – 500,000\nIndividual – 1,480,000",
      ru:
        "IELTS – 678 000\nCEFR – 578 000\nSAT Math – 500 000\nSAT English – 500 000",
      uz:
        "IELTS – 678 000\nCEFR – 578 000\nSAT Math – 500 000\nSAT English – 500 000",
    });
  }

  if (text === "TEACHERS") {
    return reply(chatId, lang, {
      en: "IELTS 7.5–8.5 certified teachers\n100+ successful students",
      ru: "Преподаватели IELTS 7.5–8.5\n100+ результатов",
      uz: "IELTS 7.5–8.5 ustozlar\n100+ natija",
    });
  }

  // ================= LEADS =================

  if (text === "ENROLL") {
    leadState.set(chatId, { step: 1, data: {} });
    await sendMessage(chatId, ask(lang, "name"));
    return NextResponse.json({ ok: true });
  }

  if (leadState.has(chatId)) {
    return handleLead(chatId, text, lang);
  }

  // ================= OPENAI =================

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
          content: `You are a professional consultant for EIT. Reply in ${
            lang === "ru" ? "Russian" : lang === "uz" ? "Uzbek" : "English"
          }.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await ai.json();
  const answer = data?.choices?.[0]?.message?.content;

  await sendMessage(chatId, answer || fallback(lang));
  return NextResponse.json({ ok: true });
}

// ================= HELPERS =================

async function handleLead(chatId: number, text: string, lang: string) {
  const state = leadState.get(chatId)!;

  if (state.step === 1) {
    state.data.name = text;
    state.step = 2;
    await sendMessage(chatId, ask(lang, "phone"));
  } else if (state.step === 2) {
    state.data.phone = text;
    state.step = 3;
    await sendMessage(chatId, ask(lang, "course"));
  } else {
    state.data.course = text;

    await sendMessage(
      Number(LEADS_CHANNEL_ID),
      `🆕 NEW LEAD\n👤 ${state.data.name}\n📞 ${state.data.phone}\n🎓 ${state.data.course}`
    );

    leadState.delete(chatId);
    await sendMessage(chatId, thanks(lang));
  }

  return NextResponse.json({ ok: true });
}

async function showMainMenu(chatId: number, lang: string) {
  await sendMessage(chatId, welcome(lang), {
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
  await sendMessage(chatId, "Kids section", {
    inline_keyboard: [
      [{ text: "📘 Info", callback_data: "KIDS_INFO" }],
      [{ text: "📝 Enroll", callback_data: "ENROLL" }],
    ],
  });
}

async function studentsMenu(chatId: number, lang: string) {
  await sendMessage(chatId, "Students section", {
    inline_keyboard: [
      [{ text: "📚 A1–B2", callback_data: "A1_B2" }],
      [{ text: "🎯 Exams", callback_data: "EXAMS" }],
      [{ text: "📝 Enroll", callback_data: "ENROLL" }],
    ],
  });
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
      reply_markup,
    }),
  });
}

const ask = (l: string, k: string) =>
  ({
    en: { name: "Your name?", phone: "Phone?", course: "Course?" },
    ru: { name: "Имя?", phone: "Телефон?", course: "Курс?" },
    uz: { name: "Ism?", phone: "Telefon?", course: "Kurs?" },
  } as any)[l][k];

const welcome = (l: string) =>
  ({
    en: "Welcome to EIT 👋",
    ru: "Добро пожаловать в EIT 👋",
    uz: "EIT ga xush kelibsiz 👋",
  } as any)[l];

const thanks = (l: string) =>
  ({
    en: "✅ Thank you! We’ll contact you.",
    ru: "✅ Спасибо! Мы свяжемся.",
    uz: "✅ Rahmat! Bog‘lanamiz.",
  } as any)[l];

const fallback = (l: string) =>
  ({
    en: "Please contact @EITADMIN",
    ru: "Свяжитесь с @EITADMIN",
    uz: "@EITADMIN bilan bog‘laning",
  } as any)[l];
