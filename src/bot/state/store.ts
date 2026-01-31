import {
  Language,
  LeadState,
  UserLanguageStore,
  LeadStore,
  ProcessedUpdateStore,
} from "../types";

/* =========================
   USER LANGUAGE
   ========================= */
const userLanguages: UserLanguageStore = new Map();

/**
 * Set user language
 */
export function setUserLanguage(userId: number, lang: Language): void {
  userLanguages.set(userId, lang);
}

/**
 * Get user language
 * Defaults to English if not set
 */
export function getUserLanguage(userId: number): Language {
  return userLanguages.get(userId) ?? "en";
}

/* =========================
   LEAD (SIGN-UP) STATE
   ========================= */
const leadStates: LeadStore = new Map();

/**
 * Start lead flow
 */
export function startLead(userId: number): void {
  leadStates.set(userId, {
    step: 1,
    data: {},
  });
}

/**
 * Get lead state
 */
export function getLead(userId: number): LeadState | undefined {
  return leadStates.get(userId);
}

/**
 * Update lead state
 */
export function updateLead(userId: number, state: LeadState): void {
  leadStates.set(userId, state);
}

/**
 * Finish and clear lead
 */
export function clearLead(userId: number): void {
  leadStates.delete(userId);
}

/* =========================
   ANTI-SPAM (update_id)
   ========================= */
const processedUpdates: ProcessedUpdateStore = new Set();

/**
 * Check if update already processed
 */
export function isUpdateProcessed(updateId: number): boolean {
  return processedUpdates.has(updateId);
}

/**
 * Mark update as processed
 */
export function markUpdateProcessed(updateId: number): void {
  processedUpdates.add(updateId);

  // keep memory sane (serverless safe)
  if (processedUpdates.size > 5000) {
    processedUpdates.clear();
  }
}
