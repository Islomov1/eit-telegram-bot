import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const chatId = body?.message?.chat?.id;
  const userText = body?.message?.text;

  if (!chatId || !userText) {
    return NextResponse.json({ ok: true });
  }

  const systemPrompt = `
You are a professional sales assistant for EIT (Excellence in Teaching), an English learning centre.

YOUR JOB:
- Clearly explain courses, prices, schedules, and location
- Convince students to enroll
- Answer confidently using the provided information
- Do NOT be lazy or overuse the fallback message

RULES:
- Answer ONLY questions related to EIT
- If the question is unrelated (politics, personal advice, jokes), politely redirect
- If information is not available, use the fallback message
- NEVER say "I don't know" unless truly necessary

ABOUT EIT:
EIT (Excellence in Teaching) prepares students for English exams such as IELTS, CEFR, SAT, and other international tests.

COURSES:
- CEFR levels: A1, A2, B1, B2
- IELTS preparation
- SAT preparation

CLASS FORMAT:
- Classes are held 3 times a week
- Each class lasts 1.5 hours
- Course duration ranges from 2 to 5 months depending on the course
- Prices range from 448,000 to 678,000 UZS

LOCATION:
Amir Temur 86A, 2nd floor

CONTACT:
Phone: +998 77 115 11 33
Telegram admin: @EITADMIN
Website: https://eit.uz

WORKING DAYS:
- Weekdays: via admin
- Weekend: Sunday only

LANGUAGES:
- English
- Russian
- Uzbek
Detect the user's language and reply in the same language.

FALLBACK (use only if info is missing):
English: Please contact our admin for details.
Russian: Пожалуйста, свяжитесь с нашим администратором для получения подробной информации.
Uzbek: Iltimos, batafsil ma’lumot uchun administratorimiz bilan bog‘laning.
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
  const answer =
    data.choices?.[0]?.message?.content ??
    "Please contact our admin for details.";

  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: answer,
      }),
    }
  );

  return NextResponse.json({ ok: true });
}
