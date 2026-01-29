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
You are an AI assistant for EIT (Excellence in Teaching).
Answer only questions related to EIT learning centre.
Be sales-oriented, polite, and professional.
If the question is unrelated or unclear, politely redirect to admin.
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
