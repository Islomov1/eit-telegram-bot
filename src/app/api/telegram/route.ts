import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const chatId = body?.message?.chat?.id;
  const userText: string | undefined = body?.message?.text;

  if (!chatId || !userText) {
    return NextResponse.json({ ok: true });
  }

  const lowerText = userText.toLowerCase();

  /* =========================
     1️⃣ HARD-CODED IMPORTANT ANSWERS
     ========================= */

  // Contact / admin / phone
  if (
    lowerText.includes("number") ||
    lowerText.includes("phone") ||
    lowerText.includes("contact") ||
    lowerText.includes("admin") ||
    lowerText.includes("номер") ||
    lowerText.includes("телефон") ||
    lowerText.includes("aloqa")
  ) {
    await sendMessage(
      chatId,
      "📞 Phone: +998 77 115 11 33\n" +
        "💬 Telegram: @EITADMIN\n" +
        "🌐 Website: https://eit.uz"
    );
    return NextResponse.json({ ok: true });
  }

  // Location
  if (
    lowerText.includes("address") ||
    lowerText.includes("location") ||
    lowerText.includes("manzil") ||
    lowerText.includes("адрес")
  ) {
    await sendMessage(
      chatId,
      "📍 Address:\nAmir Temur 86A, 2nd floor"
    );
    return NextResponse.json({ ok: true });
  }

  /* =========================
     2️⃣ OPENAI (SMART ANSWERS)
     ========================= */

  const systemPrompt = `
You are a professional sales assistant for EIT (Excellence in Teaching), an English learning centre.

GOAL:
- Give FULL, CONFIDENT answers
- Help students choose a course
- Encourage enrollment

RULES:
- Answer ONLY about EIT
- Do NOT be lazy
- Do NOT overuse fallback
- Be sales-oriented and clear

ABOUT EIT:
EIT prepares students for English exams such as IELTS, CEFR, and SAT.

COURSES:
- CEFR
- IELTS preparation
- SAT preparation
- General English
- A1-B2
- Kids (6-12 years)
- Speaking club

CLASS FORMAT:
- 3 times a week
- 1.5 hours per class
- Duration: 2–5 months
- Price range: 448,000 – 678,000 UZS

LOCATION:
Amir Temur 86A, 2nd floor

CONTACT:
Phone: +998 77 115 11 33
Telegram: @EITADMIN
Website: https://eit.uz

LANGUAGES:
English, Russian, Uzbek.
Reply in the user's language.

SPECIAL RULE:
If a user says they want to prepare for an exam, ask which exam and suggest IELTS, CEFR, or SAT.
`;

  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    }
  );

  const data = await openaiResponse.json();
  const aiMessage: string | undefined =
    data?.choices?.[0]?.message?.content?.trim();

  /* =========================
     3️⃣ SMART FALLBACK (RARE)
     ========================= */

  const fallbackByLanguage = (text: string) => {
    if (/[\u0400-\u04FF]/.test(text)) {
      return "Пожалуйста, свяжитесь с нашим администратором для получения подробной информации.";
    }
    if (/[a-zA-Z]/.test(text)) {
      return "Please contact our admin for details.";
    }
    return "Iltimos, batafsil ma’lumot uchun administratorimiz bilan bog‘laning.";
  };

  const finalAnswer =
    aiMessage && aiMessage.length > 15
      ? aiMessage
      : fallbackByLanguage(userText);

  await sendMessage(chatId, finalAnswer);

  return NextResponse.json({ ok: true });
}

/* =========================
   🔧 HELPER FUNCTION
   ========================= */

async function sendMessage(chatId: number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );
}
