/* =========================
   LANGUAGE
   ========================= */
export type Language = "en" | "ru" | "uz";

/* =========================
   CALLBACK ACTIONS
   (language-neutral)
   ========================= */
export type CallbackAction =
  | "MAIN"
  | "KIDS"
  | "STUDENTS"
  | "TEACHERS"
  | "ENROLL"
  | "KIDS_INFO"
  | "A1_B2"
  | "EXAMS"
  | "PRICES"
  | "SCHEDULE"
  | "CHANGE_LANG";

/* =========================
   LEAD FLOW
   ========================= */
export type LeadStep = 1 | 2 | 3 | 4;

export interface LeadData {
  name?: string;
  phone?: string;
  course?: string;
  age?: string;
}

export interface LeadState {
  step: LeadStep;
  data: LeadData;
}

/* =========================
   BOT STATE
   ========================= */
export type UserLanguageStore = Map<number, Language>;
export type LeadStore = Map<number, LeadState>;
export type ProcessedUpdateStore = Set<number>;

/* =========================
   TELEGRAM UPDATE (SAFE SUBSET)
   ========================= */
export interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}
