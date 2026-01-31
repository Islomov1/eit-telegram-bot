import {
  TelegramUpdate,
  CallbackAction,
  Language,
} from "../types";

import {
  isUpdateProcessed,
  markUpdateProcessed,
  getUserLanguage,
} from "../state/store";

import {
  handleStart,
  handleLanguageSelect,
  handleMenuAction,
  handleLeadInput,
} from "./handlers";

import { askChatGPT } from "../ai/chatgpt";
import { sendMessage } from "../telegram/send";
import { TEXT } from "../ui/text";

/* =========================
   ENV
   ========================= */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

/* =========================
   ROUTER
   ========================= */
export async function routeUpdate(update: TelegramUpdate): Promise<void> {
  const updateId = update.update_id;

  if (isUpdateProcessed(updateId)) return;
  markUpdateProcessed(updateId);

  // Ignore edited messages
  if (update.edited_message) return;

  /* =====================
     CALLBACK QUERIES
     ===================== */
  if (update.callback_query) {
    const chatId = update.callback_query.message?.chat.id;
    const data = update.callback_query.data;

    if (!chatId || !data) return;

    // Language selection
    if (data.startsWith("LANG_")) {
      const lang = data.replace("LANG_", "") as Language;
      await handleLanguageSelect(chatId, lang);
      return;
    }

    // Menu actions
    await handleMenuAction(chatId, data as CallbackAction);
    return;
  }

  /* =====================
     TEXT MESSAGES
     ===================== */
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    // /start
    if (text === "/start") {
      await handleStart(chatId);
      return;
    }

    // Lead flow
    const consumed = await handleLeadInput(chatId, text);
    if (consumed) return;

    // ChatGPT fallback
    const lang = getUserLanguage(chatId);
    const aiResponse = await askChatGPT(
      OPENAI_API_KEY,
      text,
      lang
    );

    await sendMessage(
      TELEGRAM_TOKEN,
      chatId,
      aiResponse?.content || TEXT[lang].fallback
    );
  }
}
