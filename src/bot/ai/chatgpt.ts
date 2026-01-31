import { Language } from "../types";

interface ChatGPTResponse {
  content: string;
}

/**
 * Ask ChatGPT for a response to an open question
 */
export async function askChatGPT(
  apiKey: string,
  userMessage: string,
  lang: Language
): Promise<ChatGPTResponse | null> {
  const systemPrompt = buildSystemPrompt(lang);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const content: string | undefined =
    data?.choices?.[0]?.message?.content;

  if (!content) return null;

  return { content };
}

/**
 * Build system prompt based on language
 */
function buildSystemPrompt(lang: Language): string {
  switch (lang) {
    case "ru":
      return (
        "Ты дружелюбный и профессиональный консультант учебного центра EIT. " +
        "Помогай выбирать курсы, объясняй разницу между уровнями и экзаменами. " +
        "Можешь предложить записаться, но без давления. " +
        "Никогда не гарантируй баллы и не придумывай цены."
      );

    case "uz":
      return (
        "Siz EIT o‘quv markazining do‘stona va professional maslahatchisisiz. " +
        "Kurslarni tanlashda yordam bering, darajalar va imtihonlar farqini tushuntiring. " +
        "Ro‘yxatdan o‘tishni taklif qilishingiz mumkin, lekin bosim qilmasdan. " +
        "Hech qachon ballarni kafolatlamang va narxlarni o‘ylab topmang."
      );

    default:
      return (
        "You are a friendly and professional consultant for EIT learning center. " +
        "Help users choose courses and explain differences between levels and exams. " +
        "You may suggest signing up, but never pressure the user. " +
        "Never guarantee exam scores and never invent prices."
      );
  }
}
