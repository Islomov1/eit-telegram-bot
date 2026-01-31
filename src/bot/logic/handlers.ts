import {
  Language,
  CallbackAction,
  LeadState,
} from "../types";

import {
  getUserLanguage,
  setUserLanguage,
  startLead,
  getLead,
  updateLead,
  clearLead,
} from "../state/store";

import { TEXT } from "../ui/text";
import {
  mainMenu,
  kidsMenu,
  studentsMenu,
  languageMenu,
} from "../ui/menus";

import { sendMessage } from "../telegram/send";

/* =========================
   ENV
   ========================= */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const LEADS_CHANNEL_ID = Number(process.env.LEADS_CHANNEL_ID!);

/* =========================
   MENU HANDLERS
   ========================= */
export async function handleStart(chatId: number): Promise<void> {
  await sendMessage(
    TELEGRAM_TOKEN,
    chatId,
    "🌍 Please choose a language:",
    languageMenu()
  );
}

export async function handleLanguageSelect(
  chatId: number,
  lang: Language
): Promise<void> {
  setUserLanguage(chatId, lang);
  await sendMessage(
    TELEGRAM_TOKEN,
    chatId,
    TEXT[lang].welcome,
    mainMenu(lang)
  );
}

export async function handleMenuAction(
  chatId: number,
  action: CallbackAction
): Promise<void> {
  const lang = getUserLanguage(chatId);
  const t = TEXT[lang];

  switch (action) {
    case "MAIN":
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.welcome,
        mainMenu(lang)
      );
      return;

    case "KIDS":
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.kidsIntro,
        kidsMenu(lang)
      );
      return;

    case "STUDENTS":
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.studentsIntro,
        studentsMenu(lang)
      );
      return;

    case "TEACHERS":
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.teachers,
        mainMenu(lang)
      );
      return;

    case "KIDS_INFO":
      await sendMessage(TELEGRAM_TOKEN, chatId, t.kidsInfo);
      return;

    case "A1_B2":
      await sendMessage(TELEGRAM_TOKEN, chatId, t.generalEnglish);
      return;

    case "EXAMS":
      await sendMessage(TELEGRAM_TOKEN, chatId, t.examPrep);
      return;

    case "PRICES":
      await sendMessage(TELEGRAM_TOKEN, chatId, t.prices);
      return;

    case "SCHEDULE":
      await sendMessage(TELEGRAM_TOKEN, chatId, t.schedule);
      return;

    case "ENROLL":
      startLead(chatId);
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.askName
      );
      return;

    case "CHANGE_LANG":
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        "🌍 Please choose a language:",
        languageMenu()
      );
      return;

    default:
      await sendMessage(
        TELEGRAM_TOKEN,
        chatId,
        t.fallback
      );
  }
}

/* =========================
   LEAD FLOW HANDLER
   ========================= */
export async function handleLeadInput(
  chatId: number,
  userText: string
): Promise<boolean> {
  const lang = getUserLanguage(chatId);
  const t = TEXT[lang];

  const lead = getLead(chatId);
  if (!lead) return false;

  const state: LeadState = lead;

  if (state.step === 1) {
    state.data.name = userText;
    state.step = 2;
    updateLead(chatId, state);
    await sendMessage(
      TELEGRAM_TOKEN,
      chatId,
      t.askPhone
    );
    return true;
  }

  if (state.step === 2) {
    state.data.phone = userText;
    state.step = 3;
    updateLead(chatId, state);
    await sendMessage(
      TELEGRAM_TOKEN,
      chatId,
      t.askCourse
    );
    return true;
  }

  if (state.step === 3) {
    state.data.course = userText;
    state.step = 4;
    updateLead(chatId, state);
    await sendMessage(
      TELEGRAM_TOKEN,
      chatId,
      t.askAge
    );
    return true;
  }

  if (state.step === 4) {
    state.data.age = userText;

    await sendMessage(
      TELEGRAM_TOKEN,
      LEADS_CHANNEL_ID,
      `🆕 NEW LEAD\n` +
        `👤 ${state.data.name}\n` +
        `📞 ${state.data.phone}\n` +
        `🎓 ${state.data.course}\n` +
        `🎂 ${state.data.age}`
    );

    clearLead(chatId);

    await sendMessage(
      TELEGRAM_TOKEN,
      chatId,
      t.thanks,
      mainMenu(lang)
    );

    return true;
  }

  return false;
}
